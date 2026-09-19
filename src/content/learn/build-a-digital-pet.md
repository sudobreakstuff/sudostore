---
title: "Build a Digital Pet"
description: "Tamagotchi-style virtual pet with OLED display, buttons and buzzer. Feed it, play with it, watch it grow."
published: 2026-09-10
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "oled", "pet", "buzzer"]
faqs:
  - q: "Does the pet need WiFi?"
    a: "No. Everything runs locally on the ESP32. No internet needed."
  - q: "Can I have more than one pet?"
    a: "Yes. Each pet needs its own board, but you can make a multi-pet display using extra OLEDs."
  - q: "What does the pet do?"
    a: "It has hunger, happiness and energy levels. Feed it, play with it, let it sleep. It reacts to neglect too."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: 0.96" OLED, 3x tactile buttons, piezo buzzer, 3D-printed pocket case.

## Step 1: Wire the OLED display

Same I2C setup as the weather station guide:

```
   OLED Display (I2C)
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ESP32                                 │
   │  ┌──────────────────────────────────┐  │
   │  │  3.3V ────────┬─────────────────│──│──→ OLED VCC
   │  │  GND  ────────┼─────────────────│──│──→ OLED GND
   │  │  GPIO 21 ─────┤─── SDA          │  │
   │  │  GPIO 22 ─────┤─── SCL          │  │
   │  └───────────────┴──────────────────┘  │
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

## Step 2: Wire the buttons

Three buttons for interaction: one to select, one to confirm, one to go back:

```
   Buttons (select, action, back):
   ┌──────────────────────────────────────────┐
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND rail
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [SEL]─ · · · · [ACT]─ · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [BCK]─ · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   └──────────────────────────────────────────┘

   Pin mapping:
   ┌────────────┬────────────┐
   │ Button     │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ Select     │ GPIO 4     │
   │ Action     │ GPIO 5     │
   │ Back       │ GPIO 6     │
   │ All GND    │ GND        │
   └────────────┴────────────┘
```

## Step 3: Wire the buzzer

```
   Buzzer (sound effects):
   ┌───────────────────────────────────────┐
   │                                       │
   │  ESP32 GPIO 7 ──── ┌──────┐           │
   │                   │ BUZ+ │           │
   │                   │  ○   │           │
   │                   │  ○───┼──→ GND     │
   │                   └──────┘           │
   └───────────────────────────────────────┘

   Pin mapping:
   ┌────────────┬────────────┐
   │ Buzzer Pin │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ Positive   │ GPIO 7     │
   │ Negative   │ GND        │
   └────────────┴────────────┘
```

## Step 4: Wire it all together

```
   Full Wiring:
   ┌─────────────────────────────────────────────────────┐
   │                                                       │
   │  ESP32                    ┌──────────────┐          │
   │  ┌────────────────────┐   │              │          │
   │  │ GPIO 4  ←────── ──│───│  Select Btn  │          │
   │  │ GPIO 5  ←────── ──│───│  Action Btn  │          │
   │  │ GPIO 6  ←────── ──│───│  Back Btn    │          │
   │  │ GPIO 7  ──────→───│───│  Buzzer +    │          │
   │  │ GPIO 21 ←────── ──│───│  OLED SDA    │          │
   │  │ GPIO 22 ←────── ──│───│  OLED SCL    │          │
   │  │ 3.3V  ──────→─────│───│  OLED VCC    │          │
   │  │ GND   ──────→─────│───│  OLED GND    │          │
   │  │ GND   ──────→─────│───│  All Btn GND │          │
   │  │ GND   ──────→─────│───│  Buzzer GND  │          │
   │  └────────────────────┘   │              │          │
   │                          └──────────────┘          │
   └─────────────────────────────────────────────────────┘

   Breadboard view:
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V (OLED)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND (all ground)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [SEL]· · · · [ACT]· · · · · ·  │ ← Buttons
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [BCK]· · · · · · · · · · · ·  │ ← Button
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · [BUZ+]· · · · · ·  │ ← Buzzer
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [SDA]─[SCL]· · · · · · · · · ·  │ ← OLED
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND
   └──────────────────────────────────────────┘
```

## Step 5: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **Adafruit SSD1306**
3. Search and install: **Adafruit GFX Library**

## Step 6: Core pet code — the pet state

Every pet has stats. This is the foundation:

```cpp
struct Pet {
  int hunger;       // 0-100, starts at 50
  int happiness;    // 0-100, starts at 50
  int energy;       // 0-100, starts at 80
  bool asleep;      // false
  unsigned long lastUpdate;
};

Pet myPet = {50, 50, 80, false, millis()};

void updatePetStats() {
  unsigned long now = millis();
  unsigned long elapsed = (now - myPet.lastUpdate) / 1000; // seconds
  myPet.lastUpdate = now;

  if (myPet.asleep) {
    myPet.energy = min(100, myPet.energy + elapsed * 0.1);
    return;
  }

  myPet.hunger = max(0, myPet.hunger - elapsed * 0.05);
  myPet.happiness = max(0, myPet.happiness - elapsed * 0.03);
  myPet.energy = max(0, myPet.energy - elapsed * 0.02);
}
```

**Result:** Stats degrade over real time, simulating a living creature.

## Step 7: Handle button input

```cpp
const int BUTTON_SELECT = 4;
const int BUTTON_ACTION = 5;
const int BUTTON_BACK = 6;

void checkButtons() {
  if (digitalRead(BUTTON_SELECT) == LOW) {
    // Cycle through: hunger, happiness, energy
    selectStat();
    delay(200); // debounce
  }

  if (digitalRead(BUTTON_ACTION) == LOW) {
    // Apply action based on selected stat
    applyAction();
    tone(7, 880, 100); // happy beep
    delay(200);
  }

  if (digitalRead(BUTTON_BACK) == LOW) {
    myPet.asleep = !myPet.asleep;
    tone(7, myPet.asleep ? 440 : 660, 150);
    delay(200);
  }
}
```

## Step 8: Display the pet on OLED

```cpp
#include <Adafruit_SSD1306.h>
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void displayPet() {
  display.clearDisplay();

  // Draw pet face based on mood
  int mood = (myPet.hunger + myPet.happiness + myPet.energy) / 3;
  int eyeSize = 4 + (mood / 20);

  if (myPet.asleep) {
    // Sleeping face — closed eyes
    display.drawLine(30, 25, 50, 25, SSD1306_WHITE);
    display.drawLine(78, 25, 98, 25, SSD1306_WHITE);
    display.setCursor(55, 40);
    display.println("zZ");
  } else if (mood > 70) {
    // Happy face
    display.fillCircle(40, 28, eyeSize, SSD1306_WHITE);
    display.fillCircle(88, 28, eyeSize, SSD1306_WHITE);
    display.drawArc(40, 50, 25, 0, 180, SSD1306_WHITE);
  } else {
    // Sad/neutral face
    display.fillCircle(40, 30, eyeSize, SSD1306_WHITE);
    display.fillCircle(88, 30, eyeSize, SSD1306_WHITE);
    display.drawArc(40, 55, 20, 180, 360, SSD1306_WHITE); // frown
  }

  // Stats bar
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("Hunger:");
  display.println(myPet.hunger);
  display.setCursor(0, 8);
  display.print("Happy:");
  display.println(myPet.happiness);
  display.setCursor(0, 16);
  display.print("Energy:");
  display.println(myPet.energy);

  display.display();
}
```

## Step 9: Feed and play actions

```cpp
int selectedStat = 0; // 0=hunger, 1=happiness, 2=energy

void selectStat() {
  selectedStat = (selectedStat + 1) % 3;
  tone(7, 550, 50);
}

void applyAction() {
  switch (selectedStat) {
    case 0: // Feed — reduces hunger
      myPet.hunger = min(100, myPet.hunger + 25);
      tone(7, 440, 80);
      break;
    case 1: // Play — increases happiness, reduces energy
      myPet.happiness = min(100, myPet.happiness + 20);
      myPet.energy = max(0, myPet.energy - 15);
      tone(7, 660, 100);
      tone(7, 880, 100);
      break;
    case 2: // Rest — increases energy
      myPet.energy = min(100, myPet.energy + 30);
      myPet.asleep = true;
      break;
  }
}
```

## Step 10: Assemble the pet

```
   Digital Pet Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │    3D-PRINTED POCKET CASE       │  │
   │  │    (with clip on back)          │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │      OLED SCREEN        │   │  │
   │  │  │      (pet face here)    │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  [SEL] [ACT] [BCK]             │   │  │ ← Buttons below screen
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │   ESP32 + Buzzer        │   │  │
   │  │  └─────────────────────────┘   │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the OLED through the front window
2. Place 3 buttons below the screen on the front panel
3. Put the ESP32 and buzzer inside
4. Route wires neatly
5. Close the case, clip it to your bag or pocket

## Customise it

- Change the pet's personality (aggressive, lazy, hyper)
- Add a hunger timer that makes the pet cry when too hungry
- Add a name entry via button sequence
- Add a growth system — pet evolves as it levels up

## What's next?

Build the **Smart Plant Monitor** — another sensor project, this time for your plants.
