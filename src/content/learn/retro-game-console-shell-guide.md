---
title: "Retro Game Console Shell: Build & Play Your Own Games"
description: "Code Pong, Snake, and Breakout on an OLED screen inside a 3D-printed Game Boy shell. The ultimate beginner project."
published: 2026-09-03
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "gaming", "retro", "oled"]
faqs:
  - q: "What games can I build?"
    a: "Pong, Snake, Breakout, Tetris, Flappy Bird clones — anything with simple graphics on a 128x64 display."
  - q: "Is the code hard?"
    a: "The concepts are simple — loops, if statements, arrays. The guide walks through each game step by step."
  - q: "Can I add sound?"
    a: "Yes. Wire the buzzer from your Starter Pack and add tone() calls for collisions and scoring."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable, buttons, buzzer.

From this kit: 0.96" SSD1306 OLED, 4x tactile buttons, 3D-printed Game Boy shell.

## Step 1: Wire the OLED

Same as the Dex Scanner:

```
OLED VCC  →  ESP32 3.3V
OLED GND  →  ESP32 GND
OLED SDA  →  ESP32 GPIO 21
OLED SCL  →  ESP32 GPIO 22
```

## Step 2: Wire the buttons

```
D-pad Up     →  ESP32 GPIO 14
D-pad Down   →  ESP32 GPIO 27
D-pad Left   →  ESP32 GPIO 26
D-pad Right  →  ESP32 GPIO 25
Button A     →  ESP32 GPIO 33
Button B     →  ESP32 GPIO 32
All GND pins →  ESP32 GND
```

## Step 3: Install the display library

Install **Adafruit SSD1306** and **Adafruit GFX Library** (same as Dex Scanner).

## Step 4: Pong — the simplest game

```cpp
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#define SCREEN_W 128
#define SCREEN_H 64
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

int paddleY = 24;
int ballX = 64, ballY = 32;
int ballDX = 2, ballDY = 1;
int score = 0;

void setup() {
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  pinMode(14, INPUT_PULLUP);  // up
  pinMode(27, INPUT_PULLUP);  // down
}

void loop() {
  // Move paddle
  if (digitalRead(14) == LOW && paddleY > 0) paddleY -= 3;
  if (digitalRead(27) == LOW && paddleY < 52) paddleY += 3;

  // Move ball
  ballX += ballDX;
  ballY += ballDY;

  // Bounce off top/bottom
  if (ballY <= 0 || ballY >= 62) ballDY = -ballDY;

  // Bounce off paddle
  if (ballX <= 8 && ballY >= paddleY && ballY <= paddleY + 12) {
    ballDX = -ballDX;
    score++;
  }

  // Reset if missed
  if (ballX <= 0) {
    ballX = 64; ballY = 32;
    score = 0;
  }

  // Bounce off right wall
  if (ballX >= 126) ballDX = -ballDX;

  // Draw
  display.clearDisplay();
  display.fillRect(2, paddleY, 3, 12, SSD1306_WHITE);  // paddle
  display.fillCircle(ballX, ballY, 2, SSD1306_WHITE);   // ball
  display.setCursor(100, 0);
  display.print(score);
  display.display();
  delay(16);  // ~60fps
}
```

**Result:** Move the paddle with up/down, bounce the ball, rack up points.

## Step 5: Snake — growing and eating

```cpp
int snakeX[100], snakeY[100];
int snakeLen = 3;
int foodX, foodY;
int dir = 0;  // 0=right, 1=down, 2=left, 3=up

void spawnFood() {
  foodX = random(0, 32) * 4;
  foodY = random(0, 16) * 4;
}

void setup() {
  // ... display setup ...
  for (int i = 0; i < snakeLen; i++) {
    snakeX[i] = 32 - i * 4;
    snakeY[i] = 32;
  }
  spawnFood();
}

void loop() {
  // Read direction
  if (digitalRead(14) == LOW) dir = 3;  // up
  if (digitalRead(27) == LOW) dir = 1;  // down
  if (digitalRead(26) == LOW) dir = 2;  // left
  if (digitalRead(25) == LOW) dir = 0;  // right

  // Move body (follow the head)
  for (int i = snakeLen - 1; i > 0; i--) {
    snakeX[i] = snakeX[i-1];
    snakeY[i] = snakeY[i-1];
  }

  // Move head
  if (dir == 0) snakeX[0] += 4;
  if (dir == 1) snakeY[0] += 4;
  if (dir == 2) snakeX[0] -= 4;
  if (dir == 3) snakeY[0] -= 4;

  // Eat food
  if (snakeX[0] == foodX && snakeY[0] == foodY) {
    snakeLen++;
    spawnFood();
  }

  // Draw
  display.clearDisplay();
  for (int i = 0; i < snakeLen; i++) {
    display.fillRect(snakeX[i], snakeY[i], 3, 3, SSD1306_WHITE);
  }
  display.fillRect(foodX, foodY, 3, 3, SSD1306_WHITE);
  display.display();
  delay(100);
}
```

## Step 6: Add sound

Wire the buzzer from your Starter Pack and add:

```cpp
tone(5, 440, 50);   // paddle hit
tone(5, 880, 50);   // eat food
tone(5, 220, 200);  // game over
```

## Step 7: Assemble the Game Boy

1. Fit the OLED into the screen window
2. Place the buttons in the D-pad and A/B positions
3. Wire everything to the ESP32
4. Close the shell and screw it together
5. Power via USB-C on top

## Customise it

- Add a menu screen to choose between games
- Save high scores to ESP32 flash
- Make the games harder as you progress
- Add a "game over" animation

## What's next?

Combine with the **Pokéball Signal Tower** to build a Game Boy Color — add LED backlighting to the retro console.
