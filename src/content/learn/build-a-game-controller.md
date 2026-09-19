---
title: "Build a Custom Game Controller"
description: "Arcade-style USB gamepad with ESP32-S3, arcade buttons and 3D-printed case."
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "usb-hid", "gamepad", "arcade"]
faqs:
  - q: "Which computers does it work on?"
    a: "Any computer that supports USB gamepads — Windows, Mac, Linux, Raspberry Pi."
  - q: "Can I use it for PC gaming?"
    a: "Yes. It shows up as a standard gamepad. Map buttons in Steam or any game's settings."
  - q: "Can I record macros?"
    a: "Yes. The firmware supports recording button sequences and playing them back."
---

## What you need

From the **Starter Pack**: ESP32-S3 dev board, USB-C cable, small breadboard.

From this kit: 6x 30mm arcade buttons, 1x joystick module, 3D-printed case.

## Step 1: Understand USB HID

The ESP32-S3 can act as a USB gamepad. When you press a button, the ESP32 sends a standard gamepad report that any computer understands:

```
   USB Gamepad Protocol (simplified):
   ┌─────────────────────────────────────┐
   │ Report ID: 0x01 (gamepad)          │
   ├─────────────────────────────────────┤
   │ Buttons: 0x0000 (16-bit bitmask)   │
   │   Bit 0:  Button 1                │
   │   Bit 1:  Button 2                │
   │   Bit 2:  Button 3                │
   │   Bit 3:  Button 4                │
   │   Bit 4:  Button 5                │
   │   Bit 5:  Button 6                │
   │   Bit 6:  Left trigger            │
   │   Bit 7:  Right trigger           │
   ├─────────────────────────────────────┤
   │ Axis X:  -32768 to 32767 (joystick)│
   │ Axis Y:  -32768 to 32767 (joystick)│
   └─────────────────────────────────────┘

   When Button 1 is pressed: report = 0x0001
   When Buttons 1+3 are pressed: report = 0x0005
```

## Step 2: Wire the arcade buttons

Each button connects a GPIO pin to GND when pressed. The ESP32 uses internal pullup resistors:

```
   Button Wiring (one button):
   ┌───────────────────────────────────────┐
   │                                       │
   │  ESP32 GPIO  ──── ┌──────┐            │
   │    (INPUT_PULLUP) │ BTN  │            │
   │                   │ ○    │            │
   │                   │  ○───┼──→ GND     │
   │                   └──────┘            │
   │                                       │
   └───────────────────────────────────────┘

   When NOT pressed: GPIO reads HIGH (pullup)
   When pressed: GPIO reads LOW (connected to GND)

   6 Buttons wiring map:
   ┌───────────────────────────────────────┐
   │                                       │
   │  GPIO 2  ──── Button 1 (top-left)     │
   │  GPIO 3  ──── Button 2 (top-right)    │
   │  GPIO 4  ──── Button 3 (middle-left)  │
   │  GPIO 5  ──── Button 4 (middle-right) │
   │  GPIO 6  ──── Button 5 (bottom-left)  │
   │  GPIO 7  ──── Button 6 (bottom-right) │
   │                                       │
   │  All buttons share GND rail           │
   └───────────────────────────────────────┘

   Breadboard layout:
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← +5V (unused for buttons)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND rail (all buttons)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [B1]· · · · · · [B2]· · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [B3]· · · · · · [B4]· · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [B5]· · · · · · [B6]· · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │
   │  - - - - - - - - - - - - - - - - - - -  │
   └──────────────────────────────────────────┘

   Pin mapping:
   ┌────────────┬────────────┐
   │ Button     │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ Button 1   │ GPIO 2     │
   │ Button 2   │ GPIO 3     │
   │ Button 3   │ GPIO 4     │
   │ Button 4   │ GPIO 5     │
   │ Button 5   │ GPIO 6     │
   │ Button 6   │ GPIO 7     │
   │ All GND    │ GND        │
   └────────────┴────────────┘
```

## Step 3: Wire the joystick module

The joystick has two potentiometers (X and Y axes) and a switch (button):

```
   Joystick Module
   ┌───────────────┐
   │  ┌─────────┐  │
   │  │         │  │
   │  │  ┌───┐  │  │ ← joystick stick
   │  │  │ ● │  │  │
   │  │  └───┘  │  │
   │  │         │  │
   │  └─────────┘  │
   │  VCC GND SW X Y│
   └──┬──┬──┬──┬──┬─┘
      │  │  │  │  │
      │  │  │  │  └──── A0 (X axis)
      │  │  │  └──────── A1 (Y axis)
      │  │  └──────────── GPIO 8 (button)
      │  └──────────────── GND
      └──────────────── 5V

   Pin mapping:
   ┌────────────┬────────────┐
   │ Module Pin │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ VCC        │ 5V         │
   │ GND        │ GND        │
   │ X          │ A0         │ (analog)
   │ Y          │ A1         │ (analog)
   │ SW (button)│ GPIO 8     │
   └────────────┴────────────┘
```

## Step 4: Install the USB HID library

The ESP32 Arduino core includes USB HID. Just include the right header:

```cpp
#include "USB.h"
#include "USBHIDKeyboard.h"
```

In your `platformio.ini` or Arduino board settings, make sure USB mode is set to **USB-OTG (TinyUSB)** or **Hardware CDC and USB**.

## Step 5: First button test

```cpp
#include "USB.h"
#include "USBHIDGamepad.h"

USBHIDGamepad gamepad;

const int buttons[] = {2, 3, 4, 5, 6, 7};
const int numButtons = 6;

void setup() {
  USB.begin();
  gamepad.begin();

  for (int i = 0; i < numButtons; i++) {
    pinMode(buttons[i], INPUT_PULLUP);
  }
}

void loop() {
  for (int i = 0; i < numButtons; i++) {
    if (digitalRead(buttons[i]) == LOW) {
      gamepad.press(1 << i);  // press button i
    } else {
      gamepad.release(1 << i); // release button i
    }
  }

  // Read joystick
  int x = analogRead(A0);  // 0-4095
  int y = analogRead(A1);  // 0-4095
  int16_t axisX = map(x, 0, 4095, -32768, 32767);
  int16_t axisY = map(y, 0, 4095, -32768, 32767);

  gamepad.axisX(axisX);
  gamepad.axisY(axisY);

  gamepad.commit();
  delay(10);
}
```

**Result:** Plug the ESP32-S3 into your computer. Open **Game Controllers** in Windows or **Joystick** tester on Linux. Press buttons — they register on the screen.

## Step 6: Assign buttons to actions

Now make it actually useful. Map buttons to keyboard keys or gamepad buttons:

```cpp
void loop() {
  for (int i = 0; i < numButtons; i++) {
    if (digitalRead(buttons[i]) == LOW) {
      switch (i) {
        case 0: // Button 1 — Jump
          gamepad.press(GAMEPAD_BUTTON_1);
          break;
        case 1: // Button 2 — Run
          gamepad.press(GAMEPAD_BUTTON_2);
          break;
        case 2: // Button 3 — Attack
          gamepad.press(GAMEPAD_BUTTON_3);
          break;
        case 3: // Button 4 — Use item
          gamepad.press(GAMEPAD_BUTTON_4);
          break;
        case 4: // Button 5 — Shield
          gamepad.press(GAMEPAD_BUTTON_5);
          break;
        case 5: // Button 6 — Start
          gamepad.press(GAMEPAD_BUTTON_6);
          break;
      }
    } else {
      gamepad.releaseAll();
    }
  }

  gamepad.axisX(map(analogRead(A0), 0, 4095, -32768, 32767));
  gamepad.axisY(map(analogRead(A1), 0, 4095, -32768, 32767));
  gamepad.commit();
  delay(10);
}
```

## Step 7: Assemble the controller

```
   Game Controller Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │     3D-PRINTED CASE             │  │
   │  │     (ergonomic hand shape)      │  │
   │  │                                 │  │
   │  │  ┌────┐                ┌────┐  │  │
   │  │  │ B1 │                │ B2 │  │  │ ← Top buttons
   │  │  │ B3 │                │ B4 │  │  │ ← Middle buttons
   │  │  │ B5 │                │ B6 │  │  │ ← Bottom buttons
   │  │  └────┘                └────┘  │  │
   │  │                                 │  │
   │  │      ┌──────────┐               │  │
   │  │      │  JOYSTICK│               │  │ ← Joystick (center-top)
   │  │      └──────────┘               │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ESP32-S3               │   │  │ ← Inside, wired
   │  │  └─────────────────────────┘   │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the joystick through the top hole in the case
2. Mount each arcade button through its hole — tighten with the included nut
3. Place the ESP32-S3 in the hollow section of the handle
4. Wire all buttons to GPIO pins and GND (as per Step 2)
5. Connect the joystick module
6. Close the case, plug in USB-C

## Customise it

- Record macros — hold a button to start recording, press others to record a sequence
- Create multiple profiles stored on the board
- Add a small OLED to show what profile is active
- Add trigger buttons for racing games
- Make a fight stick with six buttons + a start button

## What's next?

Build the **Digital Pet** — your first simple project with a screen and buttons.
