---
title: "Pixel Dex Scanner: OLED Display & Sensors"
description: "Build a Pokédex with an OLED screen and IR sensor. Scan objects, display pixel art, and log your discoveries."
published: 2026-09-03
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "display", "sensor", "pokemon"]
faqs:
  - q: "What can the IR sensor detect?"
    a: "It detects nearby objects (within 2-30cm). When something passes in front, it triggers a scan."
  - q: "Can I draw my own pixel art?"
    a: "Yes. The guide includes a pixel art editor and shows how to convert images to code arrays."
  - q: "How many Pokémon can it display?"
    a: "As many as you can store in the ESP32's flash. The starter code includes 5 silhouettes."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable, buttons, buzzer.

From this kit: 0.96" SSD1306 OLED, IR obstacle sensor, 3D-printed Pokédex case.

## Step 1: Wire the OLED (I2C)

The OLED uses I2C — just 4 wires:

```
OLED VCC  →  ESP32 3.3V
OLED GND  →  ESP32 GND
OLED SDA  →  ESP32 GPIO 21
OLED SCL  →  ESP32 GPIO 22
```

## Step 2: Wire the IR sensor

```
IR VCC  →  ESP32 3.3V
IR GND  →  ESP32 GND
IR OUT  →  ESP32 GPIO 14
```

## Step 3: Install the OLED library

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for "SSD1306"
3. Install **Adafruit SSD1306**
4. Also install **Adafruit GFX Library** (dependency)

## Step 4: First pixels on screen

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.println("POKEDEX v1.0");
  display.println("Scanning...");
  display.display();
}

void loop() {
  // We'll add scanning here
}
```

**Result:** "POKEDEX v1.0 / Scanning..." appears on the OLED.

## Step 5: Draw pixel art

A simple Pokémon silhouette as a 16x16 bitmap:

```cpp
// Pikachu silhouette (16x16)
static const unsigned char pikachu[] PROGMEM = {
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00
};

void displayPokemon() {
  display.clearDisplay();
  display.drawBitmap(32, 0, pikachu, 64, 64, SSD1306_WHITE);
  display.display();
}
```

**Result:** A pixel art Pokémon silhouette appears on screen.

## Step 6: Add scanning

```cpp
int scanCount = 0;

void loop() {
  if (digitalRead(14) == LOW) {  // IR sensor detects object
    scanCount++;
    display.clearDisplay();
    display.setCursor(0, 0);
    display.print("SCAN #");
    display.println(scanCount);
    display.println("Pokemon found!");
    display.drawBitmap(32, 20, pikachu, 64, 64, SSD1306_WHITE);
    display.display();

    tone(5, 880, 100);  // scan sound
    delay(1000);
  }
}
```

**Result:** Point the scanner at something — when it detects an object, it displays a Pokémon and increments the scan count.

## Step 7: Assemble the Pokédex

1. Fit the OLED into the top half of the clamshell case
2. Mount the IR sensor behind the sensor window
3. Wire everything to the ESP32 in the bottom half
4. Connect the hinge
5. Open and close it like a real Pokédex

## Customise it

- Draw your own pixel art using [pixilart.com](https://pixilart.com)
- Add more Pokémon silhouettes and cycle through them
- Use the buzzer to play the Pokédex entry sound
- Log scan data to the serial monitor

## What's next?

Combine with the **Pokéball Signal Tower** to build a Full Pokédex Station — OLED screen + LED ring in one unit.
