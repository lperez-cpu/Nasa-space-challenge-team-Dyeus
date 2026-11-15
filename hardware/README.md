# Hardware: AstroSkin mock

On the ISS, crew vitals come from wearables such as the Bio-Monitor / Astroskin garment and sleep/activity watches. For the demo, an Arduino stands in for that wearable: turning a knob changes the astronaut's readings and the dashboard reacts within ~15 seconds.

```
Arduino (astroskin_mock.ino) --USB serial JSON--> bridge.py --REST insert--> Supabase astronaut_log --> dashboard
```

## Wiring

| Arduino pin | Part | Meaning |
| --- | --- | --- |
| A0 | Potentiometer | Heart rate, 50–130 bpm |
| A1 | Potentiometer | Stress level: LOW / MOD / HIGH |
| A2 | Potentiometer | Inflammation level: LOW / MOD / HIGH |
| D2 | Push button to GND | Insomnia symptom |

## Run

1. Upload `astroskin_mock/astroskin_mock.ino` with the Arduino IDE.
2. Check the readings: `python hardware/bridge.py --port COM3 --dry-run`
3. Send them to Supabase: `python hardware/bridge.py --port COM3`

No Arduino at hand? `python hardware/bridge.py --simulate --dry-run` generates random readings.

The bridge only inserts a new record when a level changes or the heart rate moves by 8 bpm or more, and never more than once every 10 seconds. It needs `pip install pyserial` and the project's `.env` file.
