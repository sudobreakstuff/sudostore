---
title: "Build a Plant Monitor"
description: "Soil moisture sensor, OLED display and watering alerts. Know when your plant needs water."
published: 2026-09-10
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "sensor", "plant", "oled"]
faqs:
  - q: "How often does it check moisture?"
    a: "Every 15 minutes by default. Change the delay in the code."
  - q: "Can I monitor multiple plants?"
    a: "Yes. Add a second sensor and OLED. The code supports up to 4 sensors."
  - q: "Can it water the plant automatically?"
    a: "Not in this kit, but you can add a relay and solenoid valve — the code shows how."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: Capacitive soil moisture sensor, 0.96" OLED, 3D-printed pot-station.

## Step 1: Wire the soil moisture sensor

The capacitive moisture sensor has 3 pins — it works by measuring how much the soil conducts electricity:

```
   Soil Moisture Sensor
   ┌───────────────┐
   │  ┌─────────┐  │
   │  │   SENSOR│  │
   │  │  ┌───┐  │  │ ← probe goes into soil
   │  │  │   │  │  │
   │  └─────────┘  │
   │  VCC  GND  AO │
   └──┬───┬───┬──┘
      │   │   │
      │   │   └──── A0 (ESP32 analog input)
      │   └──────── GND
      └──────────── 3.3V

   Pin mapping:
   ┌────────────┬────────────┐
   │ Sensor Pin │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 3.3V       │
   │ GND        │ GND        │
   │ AO (analog)│ A0         │
   └────────────┴────────────┘

   Reading: 0 (wet) to 4095 (dry)
   You'll calibrate this based on your soil.
```

## Step 2: Wire the OLED display

Same I2C bus as before — share the wires with any other I2C device:

```
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ESP32                                 │
   │  ┌──────────────────────────────────┐  │
   │  │  3.3V ────────┬───────────────│  │
   │  │  GND  ────────┼───────────────│  │
   │  │  GPIO 21 ─────┤─── SDA         │  │
   │  │  GPIO 22 ─────┤─── SCL         │  │
   │  └───────────────┴───────────────┘  │
   │                                         │
   │  Shared I2C: SDA and SCL both go to:│
   │  → OLED display                       │
   │  → Moisture sensor (no SDA/SCL,      │
   │     uses A0 instead)                  │
   └─────────────────────────────────────────┘

   Pin mapping:
   ┌────────────┬────────────┐
   │ OLED Pin   │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 3.3V       │
   │ GND        │ GND        │
   │ SDA        │ GPIO 21    │
   │ SCL        │ GPIO 22    │
   └────────────┴────────────┘
```

## Step 3: Full breadboard layout

```
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V rail (OLED + sensor VCC)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND rail (all GND)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [SDA]─[SCL]─ · · · · · · · ·  │ ← OLED
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [AO]─ · · · · · · · · · · · ·  │ ← Moisture sensor (analog)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   │  - - - - - - - - - - - - - - - - - - -  │
   └──────────────────────────────────────────┘

   Moisture sensor on breadboard:
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · [AO]─ · · · ·  │ ← signal
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   │  - - - - - - - - - - - - - - - - - - -  │
   └──────────────────────────────────────────┘
```

## Step 4: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **Adafruit SSD1306**
3. Search and install: **Adafruit GFX Library**

No sensor library needed — the moisture sensor reads as a simple analog value.

## Step 5: Read the sensor

```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  int raw = analogRead(A0);
  float voltage = raw * (3.3 / 4095.0);

  // Higher value = drier soil (calibrate for your plant)
  // Typical: 1500 = dry, 800 = wet
  int moisture = map(raw, 1500, 800, 0, 100);
  moisture = constrain(moisture, 0, 100);

  Serial.print("Raw: "); Serial.print(raw);
  Serial.print(" Moisture: "); Serial.print(moisture);
  Serial.println("%");

  delay(5000);
}
```

**Result:** Open Serial Monitor. Insert the probe into dry soil — note the reading. Then water the soil and note the reading. These are your calibration points.

## Step 6: Display on OLED with alerts

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_W 128
#define SCREEN_H 64
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

void displayMoisture(int moisture, int dryThreshold = 30) {
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Plant Monitor");

  // Moisture bar
  display.drawRect(0, 10, 64, 10, SSD1306_WHITE);
  int fillWidth = map(moisture, 0, 100, 0, 64);
  display.fillRect(0, 10, fillWidth, 10, SSD1306_WHITE);

  // Moisture percentage
  display.setTextSize(2);
  display.setCursor(0, 28);
  display.print(moisture);
  display.println("%");

  // Alert if too dry
  if (moisture < dryThreshold) {
    display.setTextSize(1);
    display.setCursor(0, 50);
    display.println("!! WATER NOW !!");
    // Blink the alert
    for (int i = 0; i < 3; i++) {
      display.display();
      delay(400);
      display.clearDisplay();
      display.setTextSize(1);
      display.setCursor(0, 0);
      display.println("Plant Monitor");
      display.drawRect(0, 10, 64, 10, SSD1306_WHITE);
      display.fillRect(0, 10, fillWidth, 10, SSD1306_WHITE);
      display.setTextSize(2);
      display.setCursor(0, 28);
      display.print(moisture);
      display.println("%");
      display.display();
      delay(400);
    }
  } else {
    display.setTextSize(1);
    display.setCursor(0, 50);
    display.println("All good");
  }

  display.display();
}
```

**Result:** A moisture bar and percentage on the OLED. When dry, it flashes "WATER NOW".

## Step 7: Auto-check loop with timed updates

```cpp
unsigned long lastCheck = 0;
const unsigned long CHECK_INTERVAL = 15 * 60 * 1000; // 15 minutes

void loop() {
  if (millis() - lastCheck > CHECK_INTERVAL) {
    lastCheck = millis();
    int moisture = readMoisture(); // your calibration function
    displayMoisture(moisture);
  }
}
```

## Step 8: Assemble the pot-station

```
   Smart Plant Monitor Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │    3D-PRINTED POT-STATION    │  │
   │  │    (sits next to your plant) │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │      OLED DISPLAY       │   │  │
   │  │  │      (front-facing)     │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ESP32 + SENSOR BOARD   │   │  │
   │  │  │  (inside the station)   │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  [sensor probe sticks out the │  │
   │  │   side and goes into soil]    │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the OLED into the front slot of the pot-station
2. Place the ESP32 and sensor board inside
3. Route the sensor probe through a hole in the side or bottom
4. Insert the probe into your plant's soil
5. Power via USB-C (or add a battery pack for portability)

## Customise it

- Add multiple sensors and multiple OLEDs for a garden display
- Wire up a water pump with a relay for automatic watering
- Log data to an SD card over time
- Add a temperature sensor to track room conditions
- Push alerts to your phone via WiFi

## What's next?

Build the **DIY Music Visualizer** — add a microphone and LEDs to see your music.
