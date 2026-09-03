---
title: "Pikachu Buzzer Badge: Sound & Melody Guide"
description: "Build a wearable Pikachu badge that plays sounds, melodies, and custom SFX. Press buttons, make noise, have fun."
published: 2026-09-03
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "audio", "pokemon", "wearable"]
faqs:
  - q: "Can I record my own sounds?"
    a: "Yes. The guide shows how to store custom tone sequences and play them back on button press."
  - q: "How loud is the speaker?"
    a: "Loud enough to hear across a room. It's not a boombox, but it's clearly audible."
  - q: "Can I wear it?"
    a: "Yes. The 3D-printed case has a clip on the back. Pin it to your shirt or bag."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable, buttons.

From this kit: 8-ohm speaker, 2x tactile buttons, 3D-printed Pikachu badge case.

## Step 1: Wire the speaker

```
ESP32 GPIO 5  →  Speaker positive (+)
ESP32 GND     →  Speaker negative (-)
```

## Step 2: Wire the buttons

```
ESP32 GPIO 4  →  Button A pin 1
ESP32 GND     →  Button A pin 2

ESP32 GPIO 15 →  Button B pin 1
ESP32 GND     →  Button B pin 2
```

## Step 3: Pikachu voice

The classic Pikachu sound is a quick rise in pitch:

```cpp
void setup() {
  pinMode(4, INPUT_PULLUP);
  pinMode(15, INPUT_PULLUP);
}

void pikachuSound() {
  tone(5, 880, 50);   // high pitch
  delay(60);
  tone(5, 1200, 50);  // higher
  delay(60);
  tone(5, 1600, 80);  // peak
  delay(100);
  tone(5, 1200, 50);  // fall
  delay(60);
  tone(5, 880, 80);   // settle
  delay(100);
}

void loop() {
  if (digitalRead(4) == LOW) {
    pikachuSound();
    delay(300); // debounce
  }
}
```

**Result:** Press button A — Pikachu speaks.

## Step 4: Play a melody

The Pokécenter theme, one note at a time:

```cpp
// Note frequencies
#define NOTE_C4 262
#define NOTE_D4 294
#define NOTE_E4 330
#define NOTE_F4 349
#define NOTE_G4 392
#define NOTE_A4 440
#define NOTE_B4 494
#define NOTE_C5 523

int melody[] = {
  NOTE_E4, NOTE_E4, NOTE_E4, NOTE_C5, NOTE_B4,
  NOTE_A4, NOTE_A4, NOTE_A4, NOTE_G4, NOTE_E4
};

int durations[] = {
  200, 200, 200, 400, 200,
  200, 200, 200, 400, 400
};

void playMelody() {
  for (int i = 0; i < 10; i++) {
    tone(5, melody[i], durations[i]);
    delay(durations[i] + 50);
  }
}

void loop() {
  if (digitalRead(15) == LOW) {
    playMelody();
    delay(300);
  }
}
```

**Result:** Press button B — the Pokécenter theme plays.

## Step 5: Custom sound effects

Try making your own sounds by changing the frequencies and timing:

```cpp
void alertSound() {
  for (int freq = 400; freq < 1600; freq += 100) {
    tone(5, freq, 30);
    delay(35);
  }
  for (int freq = 1600; freq > 400; freq -= 100) {
    tone(5, freq, 30);
    delay(35);
  }
}
```

Experiment: higher numbers = higher pitch, longer delays = slower sounds.

## Step 6: Assemble the badge

1. Place the speaker behind the speaker grille on the badge
2. Wire the buttons to the A and B positions
3. Fit the ESP32 into the back of the case
4. Attach the clip to the back
5. Power via USB or a small battery pack

## Customise it

- Add more buttons for more sounds
- Make the Pikachu sound play automatically every hour
- Chain melodies together for a full song
- Add an LED that flashes with the sound

## What's next?

Combine with the **Cyberdeck Wireless Remote** to build a Smart Pikachu — voice-activated LED alerts with Pikachu sounds.
