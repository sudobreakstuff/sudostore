---
title: "Build a Personal Dashboard"
description: "ESP32 display showing weather, crypto and GitHub stats."
image: "/sudostore/assets/build-a-personal-dashboard.jpg"
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "esp32", "api", "dashboard"]
faqs:
  - q: "What APIs work?"
    a: "OpenWeatherMap (free tier), CoinGecko (free), GitHub (free). You can add any REST API."
  - q: "Does it need WiFi?"
    a: "Yes. It fetches data from the internet every 5 minutes."
  - q: "Can I show my own data?"
    a: "Yes. Add any API endpoint to the code."
---

## What you'll build

A small device that sits on your desk and shows you data from the internet — weather, cryptocurrency prices, GitHub stats — all on one screen. You decide what it shows.

> **Before you start:** Go to your phone and look at the weather app. How does it know the weather? It asks a server somewhere. Your device will do the same thing — ask a server, get the answer, show it on screen.

> **🤔 Design challenge:** If you could show ANY 3 things on this tiny screen, what would they be? Weather, stocks, calendar, traffic, something else? Write down your 3 ideas before you start.

## What you need

| Part | What it does | ~Price |
|------|-------------|--------|
| ESP32 dev board | The brain | R80 |
| 0.96" OLED display | Shows your data | R60 |
| Jumper wires | Connections | R20 |
| USB-C cable | Power | R15 |

> **💡 No extra sensors needed!** This project uses existing APIs on the internet — it doesn't measure anything physical.

<img src="/sudostore/assets/build-a-personal-dashboard.jpg" alt="Personal dashboard with ESP32 and OLED display" />

## Step 1: Understand the flow

```
  ┌──────────┐     ┌──────────┐     ┌──────────────┐
  │  ESP32    │────→│  WiFi    │────→│  API Server   │
  │          │     │          │     │               │
  │          │     │          │←────│  JSON response │
  └──────────┘     └──────────┘     └──────────────┘
         │
         ↓
    Parse JSON → Show on OLED
```

Every 5 minutes, the ESP32:
1. Connects to WiFi
2. Asks a server for data
3. Gets back a JSON response (structured text)
4. Extracts the important numbers
5. Shows them on the OLED
6. Goes to sleep for 5 minutes

> **🤔 What is JSON?** It looks like text but it's structured data. Example: `{"temperature": 24}` means there's a field called "temperature" with the value 24. Your ESP32 reads this text and understands the structure.

## Step 2: Connect WiFi

```cpp
#include <WiFi.h>

const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);

  Serial.print("Connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected! IP: " + WiFi.localIP().toString());
}
```

> **🤔 What happens at `WiFi.begin(ssid, password)`?** The ESP32 creates a WiFi connection request. Your router sees the request and asks for the password. If the password is correct, the ESP32 joins your network and gets an IP address (like 192.168.1.42) — a number that identifies it on your network.

> **💡 Test it:** After uploading, open Serial Monitor (115200 baud). You should see "Connecting..." then dots while it connects, then "Connected!" with an IP address.

## Step 3: Fetch data from an API

APIs (Application Programming Interfaces) are how different computer programs talk to each other. The weather API is like a waiter — you order ("give me weather for London"), and it serves ("temperature: 24°C").

```cpp
#include <HTTPClient.h>
#include <ArduinoJson.h>

float getTemperature() {
  HTTPClient http;
  http.begin("https://api.openweathermap.org/data/2.5/weather?q=Johannesburg&appid=YOUR_API_KEY&units=metric");

  int httpCode = http.GET();
  String result = "";

  if (httpCode == 200) { // 200 means success
    result = http.getString();
  }

  http.end(); // close the connection
  return result; // returns JSON like {"main":{"temp":24.5}}
}
```

### What each line does:
- **`http.begin(url)`** — sets up the connection to the API URL
- **`http.GET()`** — sends the request and returns the HTTP status code (200 = OK, 404 = not found, etc.)
- **`http.getString()`** — gets the response body as text
- **`http.end()`** — closes the connection (important! Don't leak connections)

> **🤔 How do I get an API key?** Go to [openweathermap.org](https://openweathermap.org/api), sign up for free, and create a "free" API key. It looks like a long string: `abc123def456...`. Copy it into the URL above where it says `YOUR_API_KEY`.

## Step 4: Parse the JSON

JSON is just text — you need to extract the specific numbers you want:

```cpp
float parseTemperature(String json) {
  StaticJsonDocument<1024> doc;
  DeserializationError error = deserializeJson(doc, json);

  if (error) {
    Serial.print("Parse failed: ");
    Serial.println(error.c_str());
    return -999;
  }

  return doc["main"]["temp"]; // Navigate the JSON structure
}
```

> **🤔 What does `doc["main"]["temp"]` mean?** It walks through the JSON like folders: first go into the "main" folder, then find "temp" inside it. For the JSON `{"main": {"temp": 24.5}}`, this returns 24.5.

## Step 5: Multiple APIs

```cpp
float getBitcoinPrice() {
  HTTPClient http;
  // CoinGecko doesn't require an API key!
  http.begin("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=zar");
  http.GET();
  String result = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  deserializeJson(doc, result);
  return doc["bitcoin"]["zar"]; // e.g., 1200000 (ZAR)
}

int getGitHubStars(const char* owner, const char* repo) {
  HTTPClient http;
  String url = "https://api.github.com/repos/" + String(owner) + "/" + String(repo);
  http.begin(url);
  http.addHeader("User-Agent", "sudostore-dashboard"); // GitHub requires this
  http.GET();
  String result = http.getString();
  http.end();

  StaticJsonDocument<512> doc;
  deserializeJson(doc, result);
  return doc["stargazers_count"]; // e.g., 42
}
```

> **💡 More free APIs to try:**
> - Random number: `https://api.randomnumberapi.com/v1/random?min=1&max=100`
> - Joke: `https://official-joke-api.appspot.com/random_joke`
> - Space fact: `http://api.nasa.gov/planetary/apod?api_key=DEMO_KEY`

## Step 6: Display everything

```cpp
void displayDashboard(float temp, float btc, int ghStars) {
  display.clearDisplay();
  display.setCursor(0, 0);
  display.println("My Dashboard");

  // Divider line
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
  display.println((int)btc);

  // GitHub
  display.setCursor(0, 58);
  display.print("GH Stars: ");
  display.println(ghStars);

  display.display();
}
```

## Step 7: Put it all together

```cpp
void loop() {
  static unsigned long lastFetch = 0;

  if (millis() - lastFetch > 5 * 60 * 1000) { // 5 minutes
    lastFetch = millis();

    float temp = parseTemperature(getTemperature());
    float btc = getBitcoinPrice();
    int stars = getGitHubStars("sudobreakstuff", "sudostore");

    displayDashboard(temp, btc, stars);
  }
}
```

## Troubleshooting

**OLED shows "Error" for weather?**
- Check your API key is correct in the URL
- Verify you have WiFi connection (check Serial Monitor)
- Open the API URL in your browser — does it return JSON or an error?

**"Parse failed" in Serial Monitor?**
- The API might have changed its response format
- Open the URL in a browser and check the JSON structure
- Adjust the `doc["..."]["..."]` paths

**Device disconnects from WiFi?**
- Add WiFi reconnect code: `if (WiFi.status() != WL_CONNECTED) WiFi.begin(ssid, password);`

## What's next?

Build the **Pomodoro Timer** — your first timer project with physical buttons.
