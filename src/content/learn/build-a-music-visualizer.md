---
title: "Build a Music Visualizer"
description: "Reactive LED strip driven by microphone and ESP32. Sound to light in real time."
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "audio", "led", "fft"]
faqs:
  - q: "How sensitive is the microphone?"
    a: "Adjustable in the code. Set the threshold to filter out background noise."
  - q: "How many LEDs can it drive?"
    a: "Up to 300 on a single GPIO pin. More with multiple strips."
  - q: "Can I use it without sound?"
    a: "Yes. It has an idle mode that shows a slow colour cycle when it's quiet."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: Microphone module, WS2812B LED strip (60 LEDs), 3D-printed housing.

## Step 1: Understand the audio pipeline

The visualizer works in three stages — capture, analyse, display:

```
   Audio Signal Pipeline:
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │  MICROPHONE  │────→│  ESP32 ADC   │────→│  FFT ANALYSIS │
   │  (analog)    │     │  (reads wave) │     │  (split into  │
   └──────────────┘     └──────────────┘     │   frequency    │
                                              │   bands)      │
                                              └──────┬───────┘
                                                     │
                                          ┌──────────▼───────────┐
                                          │  LED STRIP CONTROL   │
                                          │  (map bands to LEDs) │
                                          └──────────────────────┘

   Microphone → Analog voltage wave → ADC → FFT → 32 frequency bands
   → 32 LED groups (or fewer, mapped proportionally)
```

## Step 2: Wire the microphone module

```
   Microphone Module (MAX9814 or similar)
   ┌───────────────┐
   │  ┌─────────┐  │
   │  │   MIC   │  │
   │  │         │  │
   │  └─────────┘  │
   │  VCC GND OUT  │
   └──┬──┬──┬──┘
      │  │  │
      │  │  └──── A0 (ESP32 analog input)
      │  └──────── GND
      └──────────── 3.3V

   Pin mapping:
   ┌────────────┬────────────┐
   │ Module Pin │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 3.3V       │
   │ GND        │ GND        │
   │ OUT        │ A0         │
   └────────────┴────────────┘
```

## Step 3: Wire the LED strip

Same wiring as the LED Word Clock guide:

```
   WS2812B LED Strip (60 LEDs)
   ┌─────────────────────────────────────────┐
   │  ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ● ●  │
   │  ↑                                ↑        │
   │  DIN                           end       │
   └──┬───────────────────────────────────┘
      │
     VCC                                GND
      │                                  │
      │                                  │
   ┌──┼──────────────────────────────┼──┐
   │  │                                │  │
   │ 5V                             GND   │  ← ESP32 pins
   │  │                                │  │
   └──┼──────────────────────────────┼──┘

   DIN (green/data) ──── GPIO 12 (ESP32)
   VCC (red/power)     ──── 5V (ESP32)
   GND (white/ground)  ──── GND (ESP32)

   Pin mapping:
   ┌────────────┬────────────┐
   │ Strip Wire │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ DIN (data) │ GPIO 12    │
   │ VCC (power)│ 5V         │
   │ GND (ground)│ GND       │
   └────────────┴────────────┘
```

## Step 4: Full wiring diagram

```
   Music Visualizer Full Wiring:
   ┌─────────────────────────────────────────────────────┐
   │                                                       │
   │  ESP32                                               │
   │  ┌─────────────────────────────────────────────┐    │
   │  │ 3.3V  ─────→  Microphone VCC               │    │
   │  │ GND   ─────→  Microphone GND + Strip GND   │    │
   │  │ 5V    ─────→  Strip VCC (power)             │    │
   │  │ A0    ←─────  Microphone OUT (audio in)     │    │
   │  │ GPIO12 ────→  Strip DIN (LED data)          │    │
   │  └─────────────────────────────────────────────┘    │
   │                                                       │
   └─────────────────────────────────────────────────────┘

   Breadboard layout:
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V (mic)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND (mic, strip, esp)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [OUT]─ · · · · · · · · · · · ·  │ ← Mic signal to A0
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [DIN]─ · · · · · · · · · · · ·  │ ← Strip data from GPIO 12
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │ ← 5V (strip power)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND
   └──────────────────────────────────────────┘
```

## Step 5: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **FastLED**

No other libraries needed — the microphone reads as a raw analog value.

## Step 6: Read the microphone

```cpp
void setup() {
  Serial.begin(115200);
}

void loop() {
  // Read the microphone 50 times and average
  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += analogRead(A0);
    delay(2);
  }
  int average = sum / 50;

  // Calculate volume (how far from silence)
  // Silence is around 512 (mid-point of 10-bit ADC)
  int volume = abs(average - 512);

  Serial.print("Raw: "); Serial.print(average);
  Serial.print(" Volume: "); Serial.println(volume);

  delay(50);
}
```

**Result:** Open Serial Monitor. Clap near the microphone — the volume spikes. Find your threshold: quiet room vs. music playing.

## Step 7: Simple reactive LEDs (no FFT)

Before doing FFT, let's get sound-reactive LEDs working:

```cpp
#include <FastLED.h>

#define NUM_LEDS 60
#define DATA_PIN 12
#define MIC_PIN A0

CRGB leds[NUM_LEDS];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(60);
  delay(1000);
}

void loop() {
  // Get volume
  long sum = 0;
  for (int i = 0; i < 50; i++) {
    sum += analogRead(MIC_PIN);
    delay(2);
  }
  int volume = abs(sum / 50 - 512);

  // Map volume to number of lit LEDs
  int lit = map(volume, 0, 200, 0, NUM_LEDS);
  lit = constrain(lit, 0, NUM_LEDS);

  // Fill LEDs — green at bottom, red at top (like a VU meter)
  for (int i = 0; i < NUM_LEDS; i++) {
    if (i < lit) {
      float ratio = (float)i / NUM_LEDS;
      uint8_t r = ratio * 255;
      uint8_t g = (1.0 - ratio) * 255;
      leds[i] = CRGB(r, g, 0);
    } else {
      leds[i] = CRGB::Black;
    }
  }

  FastLED.show();
  delay(30);
}
```

**Result:** LEDs light up like a VU meter when sound plays. More sound = more LEDs lit, green at bottom, red at top.

## Step 8: Add FFT for frequency bands

For a proper visualizer, split sound into frequency bands (bass, mids, treble):

```cpp
#include <FastLED.h>
#include "FFTReal.h" // Install via GitHub: earlephilhower/FFTReal

#define NUM_LEDS 60
#define DATA_PIN 12
#define MIC_PIN A0
#define FFT_SIZE 64

CRGB leds[NUM_LEDS];
float timeDomain[FFT_SIZE];
float freqDomain[FFT_SIZE];

void setup() {
  FastLED.addLeds<WS2812B, DATA_PIN, GRB>(leds, NUM_LEDS);
  FastLED.setBrightness(60);
}

void loop() {
  // Sample the microphone into the time domain
  for (int i = 0; i < FFT_SIZE; i++) {
    timeDomain[i] = (analogRead(MIC_PIN) - 512) / 200.0;
    delayMicroseconds(100);
  }

  // Run FFT
  FFTReal::forward(timeDomain, freqDomain, FFT_SIZE);

  // Map frequency bands to LED groups
  int bands = 12;
  int ledsPerBand = NUM_LEDS / bands;

  for (int b = 0; b < bands; b++) {
    // Sum the magnitude of frequencies in this band
    float magnitude = 0;
    int start = b * (FFT_SIZE / 2 / bands);
    int end = start + (FFT_SIZE / 2 / bands);

    for (int f = start; f < end; f++) {
      magnitude += freqDomain[f] * freqDomain[f];
    }
    magnitude = sqrt(magnitude);

    // Map to LED brightness (0-255)
    int brightness = constrain(magnitude * 200, 0, 255);

    // Light up this band's LEDs
    for (int l = 0; l < ledsPerBand; l++) {
      int idx = b * ledsPerBand + l;
      if (idx < NUM_LEDS) {
        // Colour: blue at bottom, purple at top
        leds[idx] = CHSV(200 + b * 5, 255, brightness);
      }
    }
  }

  FastLED.show();
  delay(30);
}
```

**Result:** 12 vertical bars of colour, each representing a frequency band. Bass drives the bottom LEDs, treble drives the top.

## Step 9: Add a sensitivity knob

```cpp
// Add a potentiometer to GPIO 34
// Pot: 3.3V → GPIO 34 → GND (acts as a voltage divider 0-3.3V)

void loop() {
  int pot = analogRead(34); // 0-4095
  int threshold = map(pot, 0, 4095, 50, 300); // adjust threshold range

  int volume = getVolume(); // your volume function
  if (volume > threshold) {
    // Sound detected — run visualizer
    runVisualizer(volume);
  } else {
    // Silence — idle mode (slow colour cycle)
    idleMode();
  }
}
```

## Step 10: Assemble the visualizer

```
   Music Visualizer Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │     3D-PRINTED HOUSING        │  │
   │  │     (directs light forward)   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   LED STRIP (top,       │   │  │
   │  │  │   pointing forward)     │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   ESP32 + Microphone    │   │  │
   │  │  │   (inside, wired)       │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  [mic hole] [led diffuser]   │   │  │ ← front panel
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the LED strip inside the housing, facing forward
2. Place a frosted/acrylic diffuser in front of the LEDs
3. Put the ESP32 inside, with the microphone pointing out through a hole
4. Wire everything up
5. Close the housing, power via USB-C

## Customise it

- Change colour themes — rainbow, monochrome, aurora
- Add a beat-detection mode that flashes on each beat
- Display a waveform instead of bars
- Add a mode that responds to claps specifically
- Chain two strips together for a wider display

## What's next?

Build the **Network Status Monitor** — another ESP32 project with LEDs and display.
