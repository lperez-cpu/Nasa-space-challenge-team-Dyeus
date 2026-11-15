"""Project E.D.E.N. — Arduino -> Supabase bridge.

Reads the JSON lines printed by hardware/astroskin_mock/astroskin_mock.ino and inserts a new
row in `astronaut_log` when the readings change meaningfully. The dashboard polls Supabase
every 15 s, so the alerts and prescriptions update on screen without touching the app.

Usage:
    pip install pyserial
    python hardware/bridge.py --port COM3              # real Arduino
    python hardware/bridge.py --simulate               # no Arduino: random readings
    python hardware/bridge.py --port COM3 --dry-run    # print what would be sent

Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from the project's .env file.
Only uses the public anon key (allowed to INSERT into astronaut_log by RLS).
"""

import argparse
import json
import pathlib
import random
import sys
import time
import urllib.request

ENV_FILE = pathlib.Path(__file__).resolve().parent.parent / ".env"
MIN_SECONDS_BETWEEN_INSERTS = 10  # avoid flooding the table
HR_CHANGE_BPM = 8                 # heart-rate change that counts as "meaningful"


def load_env(path):
    env = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if "=" in line and not line.strip().startswith("#"):
            key, value = line.split("=", 1)
            env[key.strip()] = value.strip()
    return env


def cardio_level(hr):
    if hr > 110 or hr < 50:
        return "HIGH"
    if hr > 100 or hr < 60:
        return "MOD"
    return "NORMAL"


def to_row(reading, days_in_space):
    hr = int(reading["heart_rate"])
    insomnia = bool(reading.get("insomnia"))
    stress = reading.get("stress_level", "LOW")
    return {
        "heart_rate": hr,
        "days_in_space": days_in_space,
        "stress_level": stress,
        "inflammation_level": reading.get("inflammation_level", "LOW"),
        "cardiovascular_level": cardio_level(hr),
        "cognitive_level": "NORMAL",
        "nutrition_level": "Normal",
        "sleep_quality": 3 if insomnia else 7,
        "mood": {"LOW": 7, "MOD": 5, "HIGH": 3}.get(stress, 6),
        "energy_level": 6,
        "symptoms": ["insomnio"] if insomnia else [],
    }


def changed(prev, row):
    if prev is None:
        return True
    keys = ("stress_level", "inflammation_level", "cardiovascular_level", "symptoms")
    return any(prev[k] != row[k] for k in keys) or abs(prev["heart_rate"] - row["heart_rate"]) >= HR_CHANGE_BPM


def insert(url, key, row):
    req = urllib.request.Request(
        f"{url.rstrip('/')}/rest/v1/astronaut_log",
        data=json.dumps(row).encode("utf-8"),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "return=minimal",
        },
    )
    with urllib.request.urlopen(req, timeout=10) as res:
        return res.status


def readings_from_serial(port, baud):
    import serial  # pyserial

    with serial.Serial(port, baud, timeout=5) as ser:
        while True:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line.startswith("{"):
                try:
                    yield json.loads(line)
                except json.JSONDecodeError:
                    continue


def readings_simulated():
    while True:
        yield {
            "heart_rate": random.randint(62, 118),
            "stress_level": random.choice(["LOW", "MOD", "HIGH"]),
            "inflammation_level": random.choice(["LOW", "LOW", "MOD"]),
            "insomnia": random.choice([0, 0, 1]),
        }
        time.sleep(2)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", help="serial port, e.g. COM3 or /dev/ttyUSB0")
    ap.add_argument("--baud", type=int, default=9600)
    ap.add_argument("--simulate", action="store_true", help="generate readings without an Arduino")
    ap.add_argument("--dry-run", action="store_true", help="print rows instead of inserting")
    ap.add_argument("--days", type=int, default=148, help="days_in_space to report")
    args = ap.parse_args()

    if not args.port and not args.simulate:
        ap.error("use --port COM3 or --simulate")

    env = load_env(ENV_FILE) if ENV_FILE.exists() else {}
    url, key = env.get("VITE_SUPABASE_URL"), env.get("VITE_SUPABASE_ANON_KEY")
    if not args.dry_run and not (url and key):
        sys.exit(f"Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY in {ENV_FILE}")

    source = readings_simulated() if args.simulate else readings_from_serial(args.port, args.baud)
    prev, last_insert = None, 0.0
    print("E.D.E.N. bridge running - Ctrl+C to stop")
    for reading in source:
        row = to_row(reading, args.days)
        if not changed(prev, row) or time.time() - last_insert < MIN_SECONDS_BETWEEN_INSERTS:
            continue
        if args.dry_run:
            print("DRY-RUN", json.dumps(row, ensure_ascii=False))
        else:
            status = insert(url, key, row)
            print(f"sent [{status}] HR {row['heart_rate']} · stress {row['stress_level']} · "
                  f"inflammation {row['inflammation_level']} · symptoms {row['symptoms']}")
        prev, last_insert = row, time.time()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nstopped")
