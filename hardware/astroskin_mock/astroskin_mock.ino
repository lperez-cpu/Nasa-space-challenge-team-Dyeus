// Project E.D.E.N. — AstroSkin mock (simulated wearable biosensor)
//
// Stands in for NASA's wearable biomonitoring (e.g. Bio-Monitor / Astroskin) during the demo.
// Turn the potentiometers and the dashboard reacts within ~15 s.
//
// Wiring (any Arduino with analog inputs):
//   A0 potentiometer -> heart rate     (50 .. 130 bpm)
//   A1 potentiometer -> stress         (LOW / MOD / HIGH)
//   A2 potentiometer -> inflammation   (LOW / MOD / HIGH)
//   D2 push button   -> "symptom" flag (insomnia), to GND (uses INPUT_PULLUP)
//
// Output: one JSON line every 2 s over USB serial at 9600 baud, read by hardware/bridge.py:
//   {"heart_rate":88,"stress_level":"HIGH","inflammation_level":"LOW","insomnia":0}

const int PIN_HR = A0;
const int PIN_STRESS = A1;
const int PIN_INFLAM = A2;
const int PIN_SYMPTOM = 2;

const char* levelFrom(int raw) {
  if (raw < 341) return "LOW";
  if (raw < 682) return "MOD";
  return "HIGH";
}

void setup() {
  Serial.begin(9600);
  pinMode(PIN_SYMPTOM, INPUT_PULLUP);
}

void loop() {
  int heartRate = map(analogRead(PIN_HR), 0, 1023, 50, 130);
  const char* stress = levelFrom(analogRead(PIN_STRESS));
  const char* inflammation = levelFrom(analogRead(PIN_INFLAM));
  int insomnia = digitalRead(PIN_SYMPTOM) == LOW ? 1 : 0;

  Serial.print("{\"heart_rate\":");
  Serial.print(heartRate);
  Serial.print(",\"stress_level\":\"");
  Serial.print(stress);
  Serial.print("\",\"inflammation_level\":\"");
  Serial.print(inflammation);
  Serial.print("\",\"insomnia\":");
  Serial.print(insomnia);
  Serial.println("}");

  delay(2000);
}
