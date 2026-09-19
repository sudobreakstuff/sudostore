---
title: "Build a Weather Station"
description: "Desktop weather station with ESP32, BME280 sensor and OLED display. Shows temperature, humidity and pressure in real time."
published: 2026-09-10
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "sensor", "weather", "oled"]
faqs:
  - q: "Can I add a wind sensor?"
    a: "Yes. Add an anemometer to any GPIO and read it as a digital or analog input."
  - q: "How often does it update?"
    a: "Every 15 seconds by default. Change the delay in the code."
  - q: "Can I log data?"
    a: "Yes. Add an SD card module or push to a web dashboard over WiFi."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: BME280 sensor, 0.96" OLED display, 3D-printed case.

## Step 1: Wire the BME280 sensor

The BME280 uses I2C — just 4 wires:

```
   BME280 Sensor
   ┌───────────────┐
   │  ┌─────────┐  │
   │  │ BME280  │  │
   │  │         │  │
   │  └─────────┘  │
   │  VCC GND SDA SCL│
   └──┬──┬──┬──┬──┘
      │  │  │  │
      │  │  │  └──── GPIO 22
      │  │  └──────── GPIO 21
      │  └──────────── GND
      └──────────────── 3.3V

   Pin mapping:
   ┌────────────┬────────────┐
   │ Sensor Pin │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 3.3V       │
   │ GND        │ GND        │
   │ SDA        │ GPIO 21    │
   │ SCL        │ GPIO 22    │
   └────────────┴────────────┘
```

## Step 2: Wire the OLED display

Same I2C bus — share the SDA and SCL wires:

```
   OLED + BME280 on same I2C bus:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ESP32              ┌─────────┐        │
   │  GPIO 21 ──────────┤ BME280  │        │
   │  GPIO 22 ──────────│ SDA     │        │
   │  3.3V  ────────────│ SCL     │───→───│──→ OLED VCC
   │  GND   ────────────│ GND     │──→───│──→ OLED GND
   │                      └─────────┘        │
   │                                         │
   │  3.3V ──────────────────────────────────│──→ BME280 VCC
   │  GND  ──────────────────────────────────│──→ BME280 GND
   └─────────────────────────────────────────┘

   Shared I2C bus — both devices on the same wires.
```

## Step 3: Wire the OLED to ESP32

```
   ┌─────────────────────────────────────────┐
   │  ESP32                                 │
   │  ┌──────────────────────────────────┐  │
   │  │  3.3V ────────┬─────────────────│  │
   │  │  GND  ────────┼─────────────────│  │
   │  │  GPIO 21 ─────┤─── SDA          │  │
   │  │  GPIO 22 ─────┤─── SCL          │  │
   │  └───────────────┴─────────────────┘  │
   └─────────────────────────────────────────┘
         │         │
         │    Breadboard:
   ┌─────┼─────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + +  │ ← 3.3V rail
   │  - - - - - - - - - - - - - - - - - -  │ ← GND rail
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · [SDA]─[SCL]─ · · · · · ·  │ ← OLED + BME280
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   │  - - - - - - - - - - - - - - - - - -  │
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

## Step 4: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **Adafruit SSD1306**
3. Search and install: **Adafruit GFX Library**
4. Search and install: **Adafruit BME280**
5. Search and install: **Adafruit Unified Sensor** (dependency)

## Step 5: First readings

```cpp
#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_BME280.h>

#define SCREEN_W 128
#define SCREEN_H 64
#define SEALEVELPRESSURE_HPA 1013.25

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
Adafruit_BME280 bme;

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  if (!bme.begin(0x76)) {
    display.println("BME280 not found!");
    display.display();
    while (1) delay(100);
  }

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("Weather Station");
  display.println("Starting...");
  display.display();
  delay(1500);
}

void loop() {
  display.clearDisplay();
  display.setTextSize(1);

  float temp = bme.readTemperature();
  float hum = bme.readHumidity();
  float pres = bme.readPressure() / 100.0F;

  display.setCursor(0, 0);
  display.print("Temp: ");
  display.print(temp, 1);
  display.println(" C");

  display.setCursor(0, 12);
  display.print("Hum:  ");
  display.print(hum, 1);
  display.println(" %");

  display.setCursor(0, 24);
  display.print("Pres: ");
  display.print(pres, 1);
  display.println(" hPa");

  display.display();
  delay(15000); // 15 seconds
}
```

**Result:** Temperature, humidity and pressure display on the OLED, updating every 15 seconds.

## Step 6: Add weather icons

Replace the text display with icons:

```cpp
void displayWeather(float temp) {
  display.clearDisplay();

  // Simple sun icon
  if (temp > 20) {
    display.fillCircle(40, 20, 10, SSD1306_WHITE);
    for (int i = 0; i < 8; i++) {
      float angle = i * (360 / 8) * PI / 180;
      int x = 40 + cos(angle) * 16;
      int y = 20 + sin(angle) * 16;
      display.drawPixel(x, y, SSD1306_WHITE);
    }
    display.setTextSize(2);
    display.setCursor(60, 15);
    display.print(temp, 0);
    display.println("C");
  } else {
    // Cloud icon
    display.drawCircle(35, 20, 8, SSD1306_WHITE);
    display.drawCircle(48, 20, 6, SSD1306_WHITE);
    display.drawRect(28, 22, 30, 6, SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 40);
    display.println("Cool day");
  }

  display.display();
}
```

**Result:** Sun or cloud icon appears based on temperature.

## Step 7: Assemble the station

```
   Weather Station Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │      3D-PRINTED CASE            │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │      OLED DISPLAY       │   │  │
   │  │  │      (visible front)    │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   ESP32 + BME280        │   │  │
   │  │  │   (inside, wired)       │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │      hole for sensor probe     │  │
   │  └─────────────────────────────────┘  │
   │                  │                     │
   │                  ↓ USB-C               │
   └─────────────────────────────────────────┘
```

1. Mount the OLED into the front window of the case
2. Place the ESP32 and BME280 inside, wire them up
3. Route the sensor probe (if external) through a hole in the back
4. Close the case, power via USB-C

## Customise it

- Add an SD card module to log data over time
- Push readings to a web dashboard via WiFi
- Add a wind speed sensor (anemometer module)
- Change the update interval
- Add a timestamp from a RTC module

## What's next?

Build the **LED Word Clock** — same ESP32 and display, but shows the time in glowing letters.
