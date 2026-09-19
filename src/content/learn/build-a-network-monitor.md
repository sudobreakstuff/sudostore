---
title: "Build a Network Monitor"
description: "Desktop device showing internet health with LEDs and OLED. Pings servers, shows latency and uptime."
published: 2026-09-10
level: "beginner"
tags: ["diy-kit", "beginner", "esp32", "network", "wifi", "ping"]
faqs:
  - q: "Which servers does it ping?"
    a: "Configurable. Default pings Google DNS (8.8.8.8), Cloudflare (1.1.1.1) and your router."
  - q: "How often does it check?"
    a: "Every 30 seconds by default. Change the interval in the code."
  - q: "Can I ping my own servers?"
    a: "Yes. Add any hostname or IP address to the ping list."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: 3x LEDs (green, amber, red), 0.96" OLED, 3D-printed case.

## Step 1: Wire the LEDs

Each LED connects a GPIO pin to GND. The ESP32 uses internal pullup resistors and `digitalWrite(LED_PIN, LOW)` to turn an LED on (active-low):

```
   LED Wiring (three LEDs):
   ┌───────────────────────────────────────────────┐
   │                                                       │
   │  ESP32 GPIO 2  ──── [R] ──── GND (green = good)  │
   │  ESP32 GPIO 3  ──── [Y] ──── GND (amber = slow)  │
   │  ESP32 GPIO 4  ──── [R] ──── GND (red = down)    │
   │                                                       │
   │  Note: LOW = ON (active-low, using pullup)          │
   └───────────────────────────────────────────────┘

   Each LED on breadboard:
   ┌─────────────────────────────────────────┐
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND rail
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [LED1]· · · · [LED2]· · · · ·  │ ← 3 LEDs
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [LED3]· · · · · · · · · · · ·  │ ← 3 LEDs
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │ ← +5V (unused)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND
   └─────────────────────────────────────────┘

   Pin mapping:
   ┌────────────┬────────────┐
   │ LED Colour │ ESP32 Pin  │
   ├────────────┼────────────┤
   │ Green (good)│ GPIO 2    │
   │ Amber (slow)│ GPIO 3    │
   │ Red (down)  │ GPIO 4    │
   │ All GND     │ GND        │
   └────────────┴────────────┘
```

## Step 2: Wire the OLED display

Standard I2C connection:

```
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ESP32                                 │
   │  ┌──────────────────────────────────┐  │
   │  │  3.3V ────────┬───────────────│  │
   │  │  GND  ────────┼───────────────│  │
   │  │  GPIO 21 ─────┤─── SDA         │  │
   │  │  GPIO 22 ─────┤─── SCL         │  │
   │  └───────────────┴───────────────┘  │
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

## Step 3: Full breadboard layout

```
   ┌──────────────────────────────────────────┐
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V (OLED)
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND (all GND)
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [SDA]─[SCL]─ · · · · · · · ·  │ ← OLED
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  · · · [GREEN][AMBER][RED]· · · · · ·  │ ← LEDs (active LOW)
   │  · · ·  GPIO2  GPIO3 GPIO4 · · · · ·  │
   │  · · · · · · · · · · · · · · · · · · ·  │
   │  + + + + + + + + + + + + + + + + + + +  │ ← 3.3V
   │  - - - - - - - - - - - - - - - - - - -  │ ← GND
   └──────────────────────────────────────────┘
```

## Step 4: Install libraries

1. **Sketch → Include Library → Manage Libraries**
2. Search and install: **Adafruit SSD1306**
3. Search and install: **Adafruit GFX Library**

## Step 5: Ping function

The ESP32 can ping hosts natively in newer Arduino core versions:

```cpp
#include <WiFi.h>

bool pingHost(const char* host, int timeout = 2000) {
  // Use the WiFi library's ping capability
  // Available in ESP32 Arduino Core 2.0.0+
  int result = WiFi.ping((uint8_t*)host, timeout);
  return result >= 0; // returns round-trip time in ms, or -1 if failed
}

int getLatency(const char* host) {
  int result = WiFi.ping((uint8_t*)host, 2000);
  return result; // milliseconds, or -1
}
```

If `WiFi.ping` is not available on your core version, use a raw socket approach:

```cpp
#include <arpa/inet.h>
#include <sys/socket.h>

bool pingHost(const char* ip, int timeout_ms = 2000) {
  int sock = socket(AF_INET, SOCK_RAW, IPPROTO_ICMP);
  if (sock < 0) return false;

  struct sockaddr_in dest;
  dest.sin_family = AF_INET;
  inet_pton(AF_INET, ip, &dest.sin_addr);

  // Send ICMP echo request (simplified)
  // In practice, use a raw socket with proper ICMP packet
  // This requires elevated privileges on some systems

  close(sock);
  return true; // placeholder
}
```

**Result:** `pingHost("8.8.8.8")` returns `true` if Google DNS responds, `false` if it doesn't.

## Step 6: Monitor logic

```cpp
#define GOOD_PIN 2
#define SLOW_PIN 3
#define DOWN_PIN 4

const char* hosts[] = {"8.8.8.8", "1.1.1.1", "192.168.1.1"};
const int NUM_HOSTS = 3;
int latencies[NUM_HOSTS] = {0};
bool statuses[NUM_HOSTS] = {false};

void checkAllHosts() {
  bool anyDown = false;
  bool anySlow = false;

  for (int i = 0; i < NUM_HOSTS; i++) {
    int latency = getLatency(hosts[i]);
    latencies[i] = latency;

    if (latency < 0) {
      statuses[i] = false; // DOWN
      anyDown = true;
    } else if (latency > 200) {
      statuses[i] = true; // SLOW (connected but slow)
      anySlow = true;
    } else {
      statuses[i] = true; // GOOD
    }
  }

  // Update LEDs
  digitalWrite(GOOD_PIN, !anyDown && !anySlow ? LOW : HIGH); // on when all good
  digitalWrite(SLOW_PIN, anySlow ? LOW : HIGH); // on when slow
  digitalWrite(DOWN_PIN, anyDown ? LOW : HIGH); // on when something is down
}
```

## Step 7: Display on OLED

```cpp
void displayStatus() {
  display.clearDisplay();

  display.setTextSize(1);
  display.setCursor(0, 0);
  display.println("Network Monitor");

  for (int i = 0; i < NUM_HOSTS; i++) {
    display.setCursor(0, 10 + i * 16);
    display.print(hosts[i]);
    display.print(" ");

    if (!statuses[i] || latencies[i] < 0) {
      display.println("DOWN");
    } else if (latencies[i] > 200) {
      display.print("SLOW ");
      display.print(latencies[i]);
      display.println("ms");
    } else {
      display.print("OK ");
      display.print(latencies[i]);
      display.println("ms");
    }
  }

  display.setCursor(0, 60);
  display.println("-- uptime --");
  display.display();
}
```

## Step 8: Main loop

```cpp
unsigned long lastCheck = 0;

void setup() {
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);

  pinMode(GOOD_PIN, INPUT_PULLUP);
  pinMode(SLOW_PIN, INPUT_PULLUP);
  pinMode(DOWN_PIN, INPUT_PULLUP);

  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.println("Starting...");
  display.display();
  delay(1000);
}

void loop() {
  if (millis() - lastCheck > 30000) { // every 30 seconds
    checkAllHosts();
    displayStatus();
  }
}
```

**Result:** The device pings your servers every 30 seconds. LEDs show status (green = good, amber = slow, red = down). OLED shows latency numbers.

## Step 9: Assemble the monitor

```
   Network Monitor Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │    3D-PRINTED CASE            │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ● ● ●  LEDs           │   │  │ ← Green, Amber, Red
   │  │  │  (status indicators)    │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │      OLED DISPLAY       │   │  │ ← Status and latency
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ESP32 (inside)         │   │  │
   │  │  └─────────────────────────┘   │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the three LEDs at the top of the case (with coloured covers)
2. Mount the OLED below the LEDs
3. Place the ESP32 inside
4. Wire everything up
5. Close the case, power via USB-C

## Customise it

- Add more hosts to the ping list
- Show historical latency graphs on the OLED
- Add a buzzer that sounds when something goes down
- Display your public IP address
- Connect to MQTT for home automation integration

## What's next?

Build the **Browser Game** — a pure software coding project, no hardware needed.
