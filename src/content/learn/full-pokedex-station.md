---
title: "Full Pokédex Station: Combo Build Guide"
description: "Combine the Pixel Dex Scanner and Pokéball Signal Tower into one unit — OLED screen + LED ring in a complete interactive Pokédex."
published: 2026-09-03
level: "intermediate"
tags: ["diy-kit", "combo", "esp32", "display", "led", "pokemon"]
faqs:
  - q: "Do I need both kits?"
    a: "Yes. This guide uses the OLED from the Dex Scanner and the LED ring from the Signal Tower."
  - q: "Is this harder than the individual kits?"
    a: "Slightly. You're combining two projects, so there's more wiring. But the code concepts are the same."
  - q: "Can I use a bigger display?"
    a: "Yes. A 1.3\" or 1.5\" OLED gives more screen real estate. Just update the resolution in the code."
---

## What you need

- **Pixel Dex Scanner kit** (OLED, IR sensor, case)
- **Pokéball Signal Tower kit** (WS2812 LED ring, case)
- **Starter Pack** (ESP32, breadboard, wires, buzzer)
- One ESP32 to run everything

## The concept

A single unit with:
- OLED screen showing Pokémon data and scan results
- LED ring around the screen reacting to scans
- IR sensor for detecting objects
- Buzzer for sound effects

When you point it at something, the LED ring pulses, the screen displays a Pokémon, and the buzzer plays the scan sound.

## Step 1: Wire everything

```
   Full Pokédex Station — All Components
   ┌─────────────────────────────────────────────────────┐
   │                                                     │
   │   ┌─────────────┐        ┌─────────────────────┐   │
   │   │  OLED 128x64│        │  WS2812B LED RING   │   │
   │   │  (display)  │        │  (16 pixels)        │   │
   │   └──────┬──────┘        └──────────┬──────────┘   │
   │          │                          │               │
   │   VCC  GND  SDA  SCL       VCC  DIN  GND          │
   │    │    │    │    │         │    │    │             │
   │    │    │    │    │         │    │    │             │
   │   3.3V GND  21   22        5V   12   GND           │
   │          │                          │               │
   │          │    ┌─────────────┐       │               │
   │          │    │  IR SENSOR  │       │               │
   │          │    │  (obstacle) │       │               │
   │          │    └──────┬──────┘       │               │
   │          │           │              │               │
   │          │      VCC  OUT  GND       │               │
   │          │       │    │    │        │               │
   │          │      3.3V  14  GND       │               │
   │          │           │              │               │
   │          │    ┌──────┴──────┐       │               │
   │          │    │   BUZZER    │       │               │
   │          │    │   (audio)   │       │               │
   │          │    └──────┬──────┘       │               │
   │          │           │              │               │
   │          │        +  │  -           │               │
   │          │           │              │               │
   │          │          5V  GND         │               │
   │          │           │              │               │
   │          │           │              │               │
   │   ┌──────┴───────────┴──────────────┴──────────┐   │
   │   │              ESP32 BOARD                    │   │
   │   │  ┌──────────────────────────────────────┐   │   │
   │   │  │  3.3V  GND  5V  12  14  21  22      │   │   │
   │   │  └──────────────────────────────────────┘   │   │
   │   └─────────────────────────────────────────────┘   │
   │                        │                            │
   │                    USB-C cable                       │
   │                        ↓                            │
   │                   to computer                       │
   └─────────────────────────────────────────────────────┘

   Pin mapping summary:
   ┌────────────┬────────────┬────────────┐
   │ Component  │ ESP32 Pin  │ Purpose    │
   ├────────────┼────────────┼────────────┤
   │ OLED VCC   │ 3.3V       │ Power      │
   │ OLED GND   │ GND        │ Ground     │
   │ OLED SDA   │ GPIO 21    │ I2C data   │
   │ OLED SCL   │ GPIO 22    │ I2C clock  │
   │ Ring VCC   │ 5V         │ Power      │
   │ Ring DIN   │ GPIO 12    │ LED data   │
   │ Ring GND   │ GND        │ Ground     │
   │ IR VCC     │ 3.3V       │ Power      │
   │ IR OUT     │ GPIO 14    │ Sensor     │
   │ IR GND     │ GND        │ Ground     │
   │ Buzzer +   │ 5V         │ Power      │
   │ Buzzer -   │ GND        │ Ground     │
   └────────────┴────────────┴────────────┘

   Total pins used: GPIO 5, 12, 14, 21, 22 — all on one ESP32.
```

## Step 2: Combined code

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <FastLED.h>

#define SCREEN_W 128
#define SCREEN_H 64
#define NUM_LEDS 16
#define DATA_PIN 12
#define IR_PIN 14
#define BUZZER_PIN 5

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);
CRGB leds[NUM_LEDS];

int scanCount = 0;
bool scanning = false;

// Pikachu silhouette bitmap
static const unsigned char pikachu[] PROGMEM = {
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,
  0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00
};

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  pinMode(IR_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);

  // Boot screen
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(20, 20);
  display.println("POKEDEX STATION");
  display.setCursor(30, 35);
  display.println("v2.0 READY");
  display.display();

  fill_solid(leds, NUM_LEDS, CRGB::Blue);
  FastLED.show();
  delay(1000);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
}

void scanAnimation() {
  // LED ring pulse
  for (int brightness = 0; brightness < 255; brightness += 15) {
    fill_solid(leds, NUM_LEDS, CHSV(0, 255, brightness));
    FastLED.show();
    delay(10);
  }
  for (int brightness = 255; brightness > 0; brightness -= 15) {
    fill_solid(leds, NUM_LEDS, CHSV(0, 255, brightness));
    FastLED.show();
    delay(10);
  }

  // Scan sound
  tone(BUZZER_PIN, 880, 50);
  delay(60);
  tone(BUZZER_PIN, 1200, 50);
  delay(60);
  tone(BUZZER_PIN, 1600, 80);
  delay(100);
}

void displayScan() {
  scanCount++;
  display.clearDisplay();
  display.setCursor(0, 0);
  display.print("SCAN #");
  display.println(scanCount);
  display.drawLine(0, 10, 128, 10, SSD1306_WHITE);
  display.drawBitmap(32, 15, pikachu, 64, 48, SSD1306_WHITE);
  display.setCursor(0, 55);
  display.println("Pokemon detected!");
  display.display();
}

void loop() {
  if (digitalRead(IR_PIN) == LOW && !scanning) {
    scanning = true;
    scanAnimation();
    displayScan();
    delay(2000);  // cooldown
    scanning = false;
  }

  // Idle animation — slow colour cycle
  static uint8_t hue = 0;
  fill_solid(leds, NUM_LEDS, CHSV(hue, 255, 30));
  FastLED.show();
  hue++;
  delay(50);
}
```

## Step 3: Test it

1. Upload the code
2. Point the scanner at your hand or a phone
3. Watch: LED ring pulses red, screen shows the scan, buzzer plays the sound

## Step 4: Assemble the station

1. Mount the OLED in the centre of the Pokédex case
2. Place the LED ring around the screen (visible through the seam)
3. Mount the IR sensor behind the sensor window
4. Fit the buzzer inside the case
5. Route the USB-C cable out the back

## What you built

A fully interactive Pokédex station:
- Scan objects with the IR sensor
- See Pokémon silhouettes on the OLED
- Watch the LED ring pulse with each scan
- Hear the scan sound through the buzzer
- Track your total scans

## Customise it

- Add more Pokémon silhouettes and randomise which one appears
- Make the LED ring change colour based on scan count
- Add a "rare find" mode with special animations
- Connect to WiFi and log scans to a database

## More combos

- **Cyberdeck + Pikachu Badge** → Smart Pikachu (voice-activated LED alerts)
- **Game Console + Signal Tower** → Game Boy Color (LED backlighting)
- **Any two kits** → share the ESP32, combine the skills
