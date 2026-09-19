---
title: "Build a Personal Dashboard"
description: "ESP32 display showing your data from the web — weather, GitHub, calendar, crypto."
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "api", "dashboard", "iot"]
faqs:
  - q: "Which APIs work out of the box?"
    a: "OpenWeatherMap, GitHub, Bitcoin price. You can add any REST API."
  - q: "How does it connect to WiFi?"
    a: "Standard WiFi. Configure SSID and password in the code."
  - q: "Can I add my own data?"
    a: "Yes. The configuration guide explains how to add any API endpoint."
---

## What you need

From the **Starter Pack**: ESP32, breadboard, wires, USB-C cable.

From this kit: 0.96" OLED, 3D-printed case.

## Step 1: Understand the architecture

```
   Dashboard Architecture:
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   ESP32       │────→│  HTTPS       │────→│  REST API    │
   │  (client)     │     │  Client      │     │  (weather,   │
   │               │     │  (WiFi)      │     │   github,    │
   │  ┌─────────┐│     │              │     │   crypto)    │
   │  │ WiFi    ││     └──────────────┘     └──────────────┘
   │  │ connect ││
   │  └─────────┘│                    ↓
   │              │          ┌──────────────────┐
   │              │          │  JSON RESPONSE    │
   │              │          │  (parse in code)  │
   │              │          └────────┬──────────┘
   │              │                   │
   │              │          ┌────────▼──────────┐
   │              │────→   │  OLED DISPLAY      │
   │              │        │  (show data)       │
   └──────────────┘        └──────────────────────┘

   Cycle every 5 minutes:
   1. Fetch API data (JSON)
   2. Parse relevant values
   3. Display on OLED
   4. Wait 5 minutes
   5. Repeat
```

## Step 2: Wire the OLED display

Standard I2C connection (same as all the other guides):

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
   │                                         │
   │  Pin mapping:                          │
   │  ┌────────────┬────────────┐           │
   │  │ OLED Pin   │ ESP32 Pin  │           │
   │  ├────────────┼────────────┤           │
   │  │ VCC        │ 3.3V       │           │
   │  │ GND        │ GND        │           │
   │  │ SDA        │ GPIO 21    │           │
   │  │ SCL        │ GPIO 22    │           │
   │  └────────────┴────────────┘           │
   └─────────────────────────────────────────┘
```

## Step 3: WiFi connection

```cpp
#include <WiFi.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

void connectWiFi() {
  WiFi.begin(ssid, password);

  Serial.print("Connecting");
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected!");
    Serial.print("IP: "); Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect.");
  }
}
```

## Step 4: Fetch data from an API

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

// Fetch weather from OpenWeatherMap (free tier)
String fetchWeather() {
  HTTPClient http;
  http.begin("https://api.openweathermap.org/data/2.5/weather?q=Johannesburg&appid=YOUR_API_KEY&units=metric");
  int httpCode = http.GET();

  String result = "";
  if (httpCode == 200) {
    result = http.getString();
  }
  http.end();
  return result;
}

// Parse and return temperature
float getTemperature() {
  String json = fetchWeather();
  if (json == "") return -999;

  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, json);
  if (error) {
    Serial.print("JSON parse failed: ");
    Serial.println(error.c_str());
    return -999;
  }

  return doc["main"]["temp"];
}
```

## Step 5: Fetch multiple APIs

```cpp
// Fetch crypto price (CoinGecko, no API key needed)
float getBitcoinPrice() {
  HTTPClient http;
  http.begin("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=zar");
  int httpCode = http.GET();
  String result = "";
  if (httpCode == 200) {
    result = http.getString();
  }
  http.end();

  StaticJsonDocument<512> doc;
  deserializeJson(doc, result);
  return doc["bitcoin"]["zar"];
}

// Fetch GitHub stars for any repo
int getGitHubStars(const char* owner, const char* repo) {
  HTTPClient http;
  String url = "https://api.github.com/repos/" + String(owner) + "/" + String(repo);
  http.begin(url);
  http.addHeader("User-Agent", "sudostore-dashboard");
  int httpCode = http.GET();
  String result = "";
  if (httpCode == 200) {
    result = http.getString();
  }
  http.end();

  StaticJsonDocument<512> doc;
  deserializeJson(doc, result);
  return doc["stargazers_count"];
}
```

## Step 6: Display on OLED

```cpp
void displayDashboard(float temp, float btcPrice, int ghStars) {
  display.clearDisplay();
  display.setTextSize(1);

  // Header
  display.setCursor(0, 0);
  display.println("My Dashboard");

  // Separator
  for (int i = 0; i < 128; i++) {
    display.drawPixel(i, 10, SSD1306_WHITE);
  }

  // Weather
  display.setCursor(0, 15);
  display.println("Weather:");
  display.setCursor(0, 25);
  if (temp > -900) {
    display.print(temp, 1);
    display.println(" C");
  } else {
    display.println("Error");
  }

  // Crypto
  display.setCursor(0, 38);
  display.println("BTC:");
  display.setCursor(0, 48);
  display.print("R");
  display.println((int)btcPrice);

  // GitHub
  display.setCursor(0, 58);
  display.print("GH: ");
  display.println(ghStars);

  display.display();
}
```

## Step 7: Full dashboard code

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

#define SCREEN_W 128
#define SCREEN_H 64

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASSWORD";

Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

unsigned long lastFetch = 0;
const unsigned long FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

void setup() {
  Serial.begin(115200);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  connectWiFi();
}

void loop() {
  if (millis() - lastFetch > FETCH_INTERVAL) {
    lastFetch = millis();

    float temp = getTemperature();
    float btc = getBitcoinPrice();
    int stars = getGitHubStars("sudobreakstuff", "sudostore");

    displayDashboard(temp, btc, stars);
  }
}
```

## Step 8: Assemble the dashboard

```
   Personal Dashboard Assembly:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │    3D-PRINTED CASE            │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │      OLED DISPLAY       │   │  │
   │  │  │  (weather, crypto, GH)  │   │  │
   │  │  └─────────────────────────┘   │  │
   │  │                                 │  │
   │  │  ┌─────────────────────────┐   │  │
   │  │  │  ESP32 (inside)         │   │  │
   │  │  └─────────────────────────┘   │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ USB-C             │
   └─────────────────────────────────────────┘
```

1. Mount the OLED into the case front
2. Place the ESP32 inside, wire up
3. Close the case, power via USB-C

## Customise it

- Add a button to cycle between different data views
- Display calendar events via Google API
- Show Reddit feed headlines
- Display smart home sensor readings
- Add a second OLED for multiple data streams

## What's next?

Build the **Pomodoro Timer** — your first timer project with physical buttons.
