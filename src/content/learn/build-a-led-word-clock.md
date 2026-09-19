---
title: "Build an LED Word Clock"
description: "Illuminated word clock with WS2812B LEDs behind frosted acrylic. Time displayed in glowing letters."
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "led", "clock", "ws2812b"]
faqs:
  - q: "How accurate is the time?"
    a: "The RTC module keeps time with about 1 minute per month accuracy. WiFi sync corrects it daily."
  - q: "Can I change the font?"
    a: "Yes. The code maps which LEDs form each letter — rearrange them for different layouts."
  - q: "How bright is it?"
    a: "Adjustable in the code. For a room, 40-60% brightness is plenty."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: WS2812B LED strip (288 LEDs), RTC module, frosted acrylic panel, 3D-printed frame.

## Step 1: Plan the LED layout

Your word clock is a grid of LEDs behind frosted acrylic. Each letter position maps to specific LEDs. Standard layout:

```
   Word Clock LED Grid (simplified):
   ┌───────────────────────────────────────┐
   │                                        │
   │   IT IS     TEN   FIVE   TWENTY       │
   │    ^^^      ^^^   ^^^    ^^^^^        │
   │   LEDs: 0-6 LEDs:7-9 LED:10-12 LED:13-17│
   │                                        │
   │   TEN TWENTY  THREE  FOUR              │
   │    ^^^^^    ^^^^^   ^^^^  ^^^^        │
   │   LEDs:18-22 LED:23-27 LED:28-31 LED:32-35│
   │                                        │
   │   OCLOCK  ONE  TWO  SIX  EIGHT        │
   │    ^^^^^  ^^^  ^^^  ^^^  ^^^^^        │
   │   LEDs:36-42 LED:43-45 LED:46-48 LED:49-51│
   │                                        │
   │  [brightness bar] [status LEDs]        │
   │   LEDs: 52-64  LEDs: 65-72             │
   │                                        │
   └───────────────────────────────────────┘

   Total LEDs needed: ~80-90 (out of 288 on the strip)
   Extra LEDs: use for a decorative border or status bar
```

## Step 2: Wire the WS2812B LED strip

```
   WS2812B LED Strip (first ~80 LEDs used)
   ┌──────────────────────────────────────────────┐
   │  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●  │
   │  ↑                                      ↑     │
   │  DIN (data in)                    unused end  │
   └──┬───────────────────────────────────────────┘
      │
     VCC                                GND
      │                                  │
      │                                  │
   ┌──┼──────────────────────────────────┼──┐
   │  │                                  │  │
   │ 5V                               GND   │  ← ESP32 pins
   │  │                                  │  │
   └──┼──────────────────────────────────┼──┘

   DIN (green/data wire) ──── GPIO 12 (ESP32)
   VCC (red/power)          ──── 5V (ESP32)
   GND (white/ground)       ──── GND (ESP32)

   Pin mapping:
   ┌────────────┬────────────┐
   │ Strip Wire │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ DIN (data) │ GPIO 12    │
   │ VCC (power)│ 5V         │
   │ GND (ground)│ GND       │
   └────────────┴────────────┘
```

## Step 3: Wire the RTC module

The RTC keeps time even when power is off (battery backed up):

```
   RTC Module (DS3231 or similar)
   ┌───────────────┐
   │  ┌─────────┐  │
   │  │   RTC   │  │
   │  │         │  │
   │  └─────────┘  │
   │  VCC GND SDA SCL│
   └──┬──┬──┬──┬──┘
      │  │  │  │
      │  │  │  └──── GPIO 22
      │  │  └──────── GPIO 21
      │  └──────────── GND
      └──────────────── 3.3V

   Shares I2C bus with BME280 (if you added one in that guide).
   Pin mapping:
   ┌────────────┬────────────┐
   │ RTC Pin    │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 3.3V       │
   │ GND        │ GND        │
   │ SDA        │ GPIO 21    │
   │ SCL        │ GPIO 22    │
   └────────────┴────────────┘
```

## Step 4: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **FastLED**
3. Search and install: **RTClib**
4. (Optional) **Adafruit SSD1306** — for a small status display

## Step 5: First light test

```cpp
#include <FastLED.h>

#define NUM_LEDS 80
#define DATA_PIN 12

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(60);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
  delay(500);
  fill_solid(leds, NUM_LEDS, CRGB::Green);
  FastLED.show();
  delay(1000);
  fill_solid(leds, NUM_LEDS, CRGB::Black);
  FastLED.show();
}

void loop() {}
```

**Result:** All 80 LEDs light up green for one second, then off. If this works, your strip is wired correctly.

## Step 6: Show the time

```cpp
#include <FastLED.h>
#include <RTClib.h>

#define NUM_LEDS 80
#define DATA_PIN 12
RTC_DS3231 rtc;
CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(60);
  rtc.begin();
}

void showTime(int hour, int minute) {
  fill_solid(leds, NUM_LEDS, CRGB::Black);

  // This is simplified — real code maps each LED
  // to a letter position in your word grid
  int pos = (hour % 12) * 4 + (minute / 15);
  if (pos < NUM_LEDS) {
    leds[pos] = CRGB::Green;
  }

  FastLED.show();
}

void loop() {
  DateTime now = rtc.now();
  showTime(now.hour(), now.minute());
  delay(10000); // update every 10 seconds
}
```

**Result:** The time is shown as a pattern of green LEDs.

## Step 7: Build the letter grid

The full version maps specific LEDs to specific letters:

```
   Word Clock Layout Diagram:
   ┌─────────────────────────────────────────────────┐
   │                                                    │
   │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────────┐         │
   │  │ IT  │  │ IS  │  │ TEN │  │ FIVE    │         │
   │  │LEDs │  │LEDs │  │LEDs │  │ LEDs    │         │
   │  │0-5  │  │6-9  │  │10-13│  │ 14-17   │         │
   │  └─────┘  └─────┘  └─────┘  └─────────┘         │
   │                                                    │
   │  ┌──────────┐ ┌────────┐ ┌────┐ ┌────────┐       │
   │  │  TWENTY  │ │ THREE  │ │FOUR│ │  ONE   │       │
   │  │  LEDs    │ │ LEDs   │ │LEDS│ │ LEDs   │       │
   │  │  18-22   │ │ 23-27  │ │28-31│ │ 32-35 │       │
   │  └──────────┘ └────────┘ └────┘ └────────┘       │
   │                                                    │
   │  ┌───────┐  ┌────┐ ┌────┐ ┌───────┐  ┌─────┐   │
   │  │OCLOCK │  │ TWO│ │ FIVE│ │ EIGHT │  │SIX  │   │
   │  │ 36-42 │  │43-45│ │46-49│ │ 50-54 │  │55-57│   │
   │  └───────┘  └────┘ └────┘ └───────┘  └─────┘   │
   │                                                    │
   └────────────────────────────────────────────────────┘
```

## Step 8: Assemble the clock

```
   LED Word Clock Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │         3D-PRINTED FRAME        │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   FROSTED ACRYLIC       │   │  │
   │  │  │   (light-diffusing      │   │  │
   │  │  │    front panel)         │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   LED STRIP (glued to   │   │  │
   │  │  │   inside back panel)    │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ESP32 + RTC            │   │  │
   │  │  │  (controls everything)  │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Glue the LED strip inside the back panel of the frame, facing forward
2. Place the frosted acrylic panel in front — it diffuses the light
3. Mount the ESP32 and RTC in the back section
4. Wire everything up
5. Close the frame, power via USB-C

## Customise it

- Change colour themes — blue at night, white during day
- Add a brightness sensor for auto-dimming
- Display the date or a message
- Make it react to music (sound module)

## What's next?

Build the **Custom Game Controller** — your next input device project.
