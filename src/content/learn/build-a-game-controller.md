---
title: "Build a Game Controller"
description: "USB gamepad with arcade buttons, joystick and 3D-printed case."
image: "/sudostore/assets/game-controller.png"
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "usb-hid", "gamepad"]
faqs:
  - q: "Does it work on any computer?"
    a: "Yes. Windows, Mac, Linux — any computer that supports USB gamepads."
  - q: "Can I use it for PC gaming?"
    a: "Yes. It shows up as a standard gamepad. Map buttons in Steam or any game's settings."
  - q: "How many buttons can I add?"
    a: "Up to 16 on GPIO pins. The code supports 6 by default."
---

## What you'll build

Your own game controller that any computer recognises as a proper gamepad. Arcade buttons, a joystick, and a case you designed yourself. Then you remap every button to do whatever you want.

> **Before you start:** Plug any gamepad into your computer. Open your computer's controller settings and press each button. Notice how the computer sees it as a simple list of buttons? That's all we're doing — building that list ourselves.

> **🤔 Challenge:** Before you wire anything, open a text editor and make a list of all the buttons on a gamepad (Up, Down, Left, Right, A, B, Start, Select...). This is basically what the computer sees!

## What you need

| Part | What it does | ~Price |
|------|-------------|--------|
| ESP32-S3 dev board | The brain + USB gamepad | R150 |
| 6x 30mm arcade buttons | Your buttons | R60 |
| Joystick module | Directional pad | R35 |
| 3D-printed case | Holds everything | R40 (filament) |
| Wires + breadboard | Connections | R60 |
| USB-C cable | Power + data | R15 |

> **💡 Important:** You need the **ESP32-S3** specifically — it has USB OTG support which lets it act as a USB device (gamepad). Regular ESP32 boards cannot do this.

> **🤔 Where to buy the ESP32-S3:** Search "ESP32-S3 dev kit" — you want one with the USB-C connector and the pins broken out. Most are under R200.

## Step 1: Understand USB gamepads

When you press a button on a gamepad, the computer receives a simple message: "Button 1 is pressed". That's it. No complex data — just a list of on/off states.

```
  What your computer receives:
  ┌──────────────────────────┐
  │ Button 1: OFF  │   │ ON │
  │ Button 2: OFF  │   │ ON │
  │ Button 3: OFF  │   │ ON │
  │ ...             │   │    │
  │ Joystick X: 0   │ → │ 327 │ ← (range: -32768 to 32767)
  │ Joystick Y: 0   │ → │ -12 │
  └──────────────────────────┘
```

> **🤔 USB gamepad vs keyboard:** A keyboard sends "A" or "Space". A gamepad sends "Button 1". Both tell the computer "do this thing", but gamepads are designed for simultaneous inputs (pressing 3 buttons at once). Keyboards can too, but gamepads are better at it.

## Step 2: Wire the buttons

Each arcade button has 2 pins. When pressed, they connect:

```
  Button 1     Button 2     Button 3
  [    ]       [    ]       [    ]
   │ │          │ │          │ │
   │ └── GND    │ └── GND    │ └── GND
   └──── GPIO 2 └──── GPIO 3 └──── GPIO 4
```

All buttons share GND but connect to different GPIO pins:

| Button | ESP32 Pin | What it does (default) |
|--------|-----------|----------------------|
| 1 | GPIO 2 | Jump / Action A |
| 2 | GPIO 3 | Run / Action B |
| 3 | GPIO 4 | Attack / Action X |
| 4 | GPIO 5 | Use item / Action Y |
| 5 | GPIO 6 | Shield |
| 6 | GPIO 7 | Start / Select |

> **💡 Wiring tip:** The arcade buttons have a plastic clip — press the clip to release the button, then press it through the hole in your case. Tighten the nut from the back to hold it in place.

> **🤔 Why INPUT_PULLUP?** Without it, the pin would "float" — reading random HIGH/LOW values. INPUT_PULLUP connects the pin to 3.3V through a resistor inside the ESP32. When the button is NOT pressed, the pin reads HIGH. When pressed, it connects to GND and reads LOW. Simple!

## Step 3: Wire the joystick

The joystick module has 5 pins: VCC, GND, SW (switch press), X (horizontal), Y (vertical).

```
  Joystick Module
  VCC → 5V
  GND → GND
  X → A0 (analog — left/right position)
  Y → A1 (analog — up/down position)
  SW → GPIO 8 (button press on the joystick)
```

> **🤔 Test it now:** Upload a blank sketch, then open the Serial Monitor. Run `analogRead(A0)` and move the joystick left and right. The number should change smoothly from about 0 to 4095. Do the same on A1 for up/down. If it doesn't change, check your wiring.

## Step 4: Install the USB HID library

The ESP32 Arduino core includes the USB HID (Human Interface Device) library. You don't install it — just use it:

```cpp
#include "USB.h"
#include "USBHIDGamepad.h"
```

> **🤔 What is HID?** Human Interface Device — the technical name for keyboards, mice, gamepads and other input devices. Your computer has built-in support for HID devices, which is why you don't need to install drivers.

## Step 5: First button test

```cpp
USBHIDGamepad gamepad;

void setup() {
  USB.begin();
  gamepad.begin();

  pinMode(2, INPUT_PULLUP);
  pinMode(3, INPUT_PULLUP);
  // ... repeat for all 6 buttons
}

void loop() {
  // Read button 1
  if (digitalRead(2) == LOW) {
    gamepad.press(1 << 0); // press bit 0 (Button 1)
  } else {
    gamepad.release(1 << 0); // release bit 0
  }

  gamepad.commit(); // send the report to the computer
  delay(10); // small delay to prevent duplicate inputs
}
```

### What this does:
- **`1 << 0`** — shifts the number 1 left by 0 positions = `00000001` = Button 1
- **`1 << 1`** = `00000010` = Button 2 (and so on)
- **`gamepad.press(...)`** — tells the computer "this button is held down"
- **`gamepad.release(...)`** — tells the computer "this button is no longer pressed"
- **`gamepad.commit()`** — sends the whole report

> **🤔 Try this:** Open **Windows → Game Controllers** settings. You should see your ESP32 listed. Click "Properties" and press buttons — they should light up in the tester.

## Step 6: Make it useful

Map buttons to specific actions:

```cpp
void loop() {
  // Read all 6 buttons
  for (int i = 0; i < 6; i++) {
    int pin = 2 + i;
    if (digitalRead(pin) == LOW) {
      // Map button i to a specific game action
      switch (i) {
        case 0: gamepad.press(GAMEPAD_BUTTON_1); break; // A
        case 1: gamepad.press(GAMEPAD_BUTTON_2); break; // B
        case 2: gamepad.press(GAMEPAD_BUTTON_3); break; // X
        case 3: gamepad.press(GAMEPAD_BUTTON_4); break; // Y
        case 4: gamepad.press(GAMEPAD_BUTTON_5); break; // L1
        case 5: gamepad.press(GAMEPAD_BUTTON_6); break; // Start
      }
    } else {
      gamepad.releaseAll(); // release all buttons when this one is up
    }
  }

  // Read joystick position
  int x = map(analogRead(A0), 0, 4095, -32768, 32767);
  int y = map(analogRead(A1), 0, 4095, -32768, 32767);
  gamepad.axisX(x);
  gamepad.axisY(y);

  gamepad.commit();
  delay(10);
}
```

## Step 7: Assemble it

1. Print the case (or use a prefab box)
2. Mount arcade buttons through the holes
3. Mount joystick in the centre
4. Wire all buttons to GPIO pins and GND
5. Place ESP32 inside, route the USB-C cable out
6. Test before closing the case!

## Troubleshooting

**Computer doesn't detect the controller?**
- You need ESP32-S3 specifically (not regular ESP32)
- Check that USB mode is set to "USB-OTG" in Arduino IDE board settings
- Try a different USB cable (some are charge-only)

**Buttons trigger multiple inputs?**
- Add a small delay (5-10ms) after each press
- Consider adding a capacitor (100nF) across each button

**Joystick drifts on its own?**
- Check the joystick wiring — make sure VCC and GND are not swapped
- Some joysticks need 5V, not 3.3V

## What's next?

Build the **Digital Pet** — your first simple project with a screen and buttons.
