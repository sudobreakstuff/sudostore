---
title: "Pokéball Signal Tower: LED Patterns & WiFi Alerts"
description: "Build a Pokéball-shaped LED ring that displays patterns, responds to WiFi notifications, and looks incredible on your desk."
published: 2026-09-03
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "led", "pokemon", "wifi"]
faqs:
  - q: "Can I use this without WiFi?"
    a: "Yes. The LED patterns work standalone. WiFi is only needed for notifications."
  - q: "How bright is the LED ring?"
    a: "Very bright on full. The code includes brightness control — you can dim it for desk use."
  - q: "Can I change the colours?"
    a: "Absolutely. The guide includes a colour picker tool and shows how to set any RGB value."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: WS2812B LED ring, 3D-printed Pokéball case, wiring harness.

## Step 1: Wire the LED ring

```
   WS2812B LED Ring (16 pixels)
   ┌─────────────────────────┐
   │    ○ ○ ○ ○ ○ ○ ○ ○     │
   │  ○                   ○  │
   │  ○      LED RING     ○  │
   │  ○                   ○  │
   │    ○ ○ ○ ○ ○ ○ ○ ○     │
   └─────┬─────┬─────┬───────┘
         │     │     │
        VCC   DIN   GND
         │     │     │
         │     │     │
   ┌─────┼─────┼─────┼─────┐
   │     │     │     │     │
   │  5V │  12 │  GND│     │  ← ESP32 pins
   │     │     │     │     │
   └─────┴─────┴─────┴─────┘
         ESP32 Board

   Breadboard layout:
   ┌─────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 5V rail
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND rail
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   │  - - - - - - - - - - - - - - - - - - -  │
   └─────────────────────────────────────────┘

   Wire connections:
   ┌────────────┬────────────┬────────────┐
   │ Ring Wire  │ ESP32 Pin  │ Breadboard │
   ├────────────┼────────────┼────────────┤
   │ VCC (red)  │ 5V         │ + rail     │
   │ DIN (green)│ GPIO 12    │ row 5      │
   │ GND (white)│ GND       │ - rail     │
   └────────────┴────────────┴────────────┘
```

**Important:** The ring needs decent power. If you see flickering, use the 5V pin and a separate USB power supply for the ring.

## Step 2: Install FastLED library

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for "FastLED"
3. Install **FastLED by Daniel Garcia**

## Step 3: Basic colour test

```cpp
#include <FastLED.h>

#define NUM_LEDS 16
#define DATA_PIN 12

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
}

void loop() {
  fill_solid(leds, NUM_LEDS, CRGB::Red);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Blue);
  FastLED.show();
  delay(1000);

  fill_solid(leds, NUM_LEDS, CRGB::Green);
  FastLED.show();
  delay(1000);
}
```

**Result:** The ring cycles through red, blue, and green every second.

## Step 4: Rainbow pattern

```cpp
void loop() {
  static uint8_t hue = 0;
  for (int i = 0; i < NUM_LEDS; i++) {
    leds[i] = CHSV(hue + (i * 256 / NUM_LEDS), 255, 255);
  }
  FastLED.show();
  hue++;
  delay(20);
}
```

**Result:** A smooth rainbow chase around the ring. The `hue` variable shifts all colours together.

## Step 5: WiFi notification (advanced)

This connects to your WiFi and lights up when it receives a signal:

```cpp
#include <WiFi.h>
#include <FastLED.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
  // LED ring setup here
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    // Pulse green when connected
    fill_solid(leds, NUM_LEDS, CRGB::Green);
    FastLED.show();
    delay(500);
    fill_solid(leds, NUM_LEDS, CRGB::Black);
    FastLED.show();
    delay(500);
  }
}
```

For real notifications, you'd poll a webhook or MQTT topic. The concept is the same — when you get a signal, light up the ring.

## Step 6: Assemble the Pokéball

```
   Pokéball Case Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │         ┌─────────────────┐             │
   │         │   RED TOP       │             │
   │         │   (hemisphere)  │             │
   │         └────────┬────────┘             │
   │                  │ snap                  │
   │         ┌────────┴────────┐             │
   │         │  LED RING HERE  │ ← glow      │
   │         │  (visible seam) │   shows     │
   │         └────────┬────────┘   through   │
   │                  │                      │
   │         ┌────────┴────────┐             │
   │         │  WHITE BOTTOM   │             │
   │         │  (hemisphere)   │             │
   │         └────────┬────────┘             │
   │                  │ wires                │
   │                  ↓                      │
   │            to ESP32 + USB               │
   └─────────────────────────────────────────┘
```

1. Place the LED ring inside the bottom (white) hemisphere
2. Route the wires through the back hole
3. Snap the top (red) hemisphere on — the LED glow shows through the seam
4. Place on your desk, powered by USB

## Customise it

- Change the rainbow speed by adjusting the `delay(20)` value
- Add a button to cycle through patterns
- Use the Pokéball colours: red top LEDs, white bottom LEDs
- Make it react to sound with a microphone module (advanced)

## What's next?

Combine with the **Pixel Dex Scanner** to build a Full Pokédex Station — OLED screen + LED ring in one unit.
