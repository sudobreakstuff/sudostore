---
title: "Build a Web Scraper & Alert System"
description: "Monitor any website, get notified when it changes."
image: "/sudostore/assets/web-scraper.jpg"
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "python", "scraping", "alerts"]
faqs:
  - q: "What computer do I need?"
    a: "A Raspberry Pi or any Linux computer. Even an old laptop works."
  - q: "Can I monitor multiple sites?"
    a: "Yes. The config file supports a list of URLs."
  - q: "Does it run forever?"
    a: "Yes. Set it up with a cron job and it runs every 15 minutes."
---

## What you'll build

A program that watches any website for changes and alerts you. When a price drops, a product comes back in stock, or a news article appears — you'll know about it before your friends do.

> **Before you start:** Think about something you check every day — a store for a restock, a job site for new listings, a news site for breaking stories. What if a little robot checked it for you every 15 minutes and texted you when something changed? That's exactly what you're building.

> **🤔 Challenge:** Find one website you want to monitor. Open it in your browser. Where does the information you care about appear? Is it in the price tag, the date, a status label? Identifying this is half the job.

## What you need

**No starter kits, no physical hardware!** Just:
- A Linux computer (Raspberry Pi, old laptop, or even a free cloud instance)
- Python 3.7+ (most Linux systems already have it)
- Internet connection
- Patience for the first run (it takes 10 minutes to set up)

> **💡 Don't have Linux?** You can use Windows with [WSL](https://learn.microsoft.com/en-us/windows/wsl/) (Windows Subsystem for Linux) or install Python directly. The guide works on any system with Python 3.

## Step 1: Understand the concept

Your scraper does 4 things:
1. **Download** the web page HTML
2. **Extract** just the part you care about (using CSS selectors)
3. **Compare** this version with the last version
4. **Alert** you if anything changed

```
  Every 15 minutes:
  ┌──────────────┐
  │ Download HTML │
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │ Extract data  │ ← Use CSS selectors (like .price, #stock)
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │ Compare with  │
  │ last version  │
  └──────┬───────┘
         ↓
  ┌──────────────┐
  │ Changed?      │
  │ YES → Alert!  │
  │ NO → Wait...  │
  └──────────────┘
```

> **🤔 Why not download the whole page?** Most web pages are 500KB+ with ads, tracking and styling. If you just extract the price (say 20 bytes), comparison is instant and uses almost no bandwidth.

## Step 2: Install Python tools

Open a terminal and type these commands one at a time:

```bash
# Create a project folder
mkdir web-monitor && cd web-monitor

# Create a virtual environment (isolated Python installation)
python3 -m venv venv

# Activate it (Linux/Mac)
source venv/bin/activate

# Install the tools you need
pip install requests beautifulsoup4 python-dotenv
```

### What each command does:
- **`mkdir web-monitor`** — creates a folder for your project
- **`python3 -m venv venv`** — creates an isolated Python environment (so your system Python stays clean)
- **`source venv/bin/activate`** — activates the virtual environment (your terminal prompt will change to show `(venv)`)
- **`pip install ...`** — installs Python packages (like apps for Python)

> **🤔 Why a virtual environment?** Without one, if you install something for one project, it might break another project. Virtual environments keep everything separate. Think of it like having separate toolboxes for each project.

> **💡 Test it:** Type `python` in your terminal. If you see `>>>`, you're in Python. Type `print("hello")` — if it prints "hello", Python works. Type `exit()` to leave Python and return to your normal terminal.

## Step 3: Write the scraper

Create a file called `scraper.py` and paste this code:

```python
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import hashlib
import os
from pathlib import Path

HISTORY_DIR = Path("history")
HISTORY_DIR.mkdir(exist_ok=True)

def scrape(url, selector="body"):
    """Download a page and extract the target element."""
    response = requests.get(url, timeout=30, headers={
        "User-Agent": "Mozilla/5.0 (Web Monitor)"
    })
    response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")

    if selector and selector != "body":
        element = soup.select_one(selector)
        content = str(element) if element else "NOT FOUND"
    else:
        content = soup.get_text(strip=True)

    return content

def has_changed(site_name, content):
    """Check if the content changed since last time."""
    content_hash = hashlib.sha256(content.encode()).hexdigest()

    # Find previous snapshots for this site
    files = sorted(HISTORY_DIR.glob(f"{site_name}_*.html"))
    if len(files) >= 2:
        with open(files[-2], 'r') as f:
            previous = f.read()
        previous_hash = hashlib.sha256(previous.encode()).hexdigest()
        return content_hash != previous_hash

    return True  # First time checking — consider it "changed"

def save_snapshot(site_name, content):
    """Save the current version with a timestamp."""
    now = datetime.now()
    filename = f"{site_name}_{now.strftime('%Y%m%d_%H%M')}.html"
    filepath = HISTORY_DIR / filename
    with open(filepath, 'w') as f:
        f.write(content)
```

### What each part does:
- **`requests.get(url)`** — downloads the web page (like your browser does)
- **`BeautifulSoup(text, "html.parser")`** — turns HTML into something Python can search through
- **`soup.select_one(".price")`** — finds the FIRST element with class "price" (like CSS selectors in developer tools)
- **`hashlib.sha256()`** — creates a unique fingerprint (hash) of the content. If the content changes, the hash changes too.

> **🤔 How do I know what CSS selector to use?** Right-click the element on the webpage → "Inspect" → look at the HTML. The `class="price"` part means the selector is `.price`. The `id="stock"` part means the selector is `#stock`.

> **💡 Try this:** Open a product page in your browser. Right-click the price → Inspect. Look for `class` or `id`. Try that selector in the code. If it returns "NOT FOUND", try a different one.

## Step 4: Set up notifications

Create `.env` (this file stores secrets — never share it):

```
# Email alerts
EMAIL_FROM=your_email@gmail.com
EMAIL_TO=your_email@gmail.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# WhatsApp alerts (Twilio)
TWILIO_SID=ACxxxxxxxxxxxxx
TWILIO_TOKEN=your_twilio_token
TWILIO_FROM=+1234567890
TWILIO_TO=+2782xxxxxxx
```

> **🤔 Twilio?** Twilio is a service that sends SMS/WhatsApp messages via API. You can use their free trial (sends ~100 messages). For WhatsApp, you need the WhatsApp Business API. For personal projects, email alerts are easier to set up.

> **💡 Gmail setup:** You need an "App Password" for Gmail, not your normal password. Go to Google Account → Security → App Passwords → Generate one for "Mail".

## Step 5: Run it

Create `monitor.py`:

```python
from scraper import check_site
from notifications import send_email, send_whatsapp
import yaml

def run_checks():
    with open("config.yaml") as f:
        config = yaml.safe_load(f)

    for site in config["sites"]:
        print(f"Checking: {site['name']}...")
        result = check_site(site)

        if result["changed"]:
            print(f"  → CHANGE DETECTED!")
            message = f"ALERT: {site['name']} changed!\nURL: {site['url']}"
            if site.get("alert") == "whatsapp":
                send_whatsapp(message)
            elif site.get("alert") == "email":
                send_email(f"Change: {site['name']}", message)
        else:
            print(f"  → No change")

if __name__ == "__main__":
    run_checks()
```

Run it:
```bash
python monitor.py
```

> **🎉 You just built a website monitor!** It checks your site, detects changes, and sends alerts.

## Step 6: Automate it

Make it run every 15 minutes without you doing anything:

```bash
# Open your cron schedule editor
crontab -e

# Add this line (adjust the path):
*/15 * * * * cd /home/pi/web-monitor && venv/bin/python monitor.py >> monitor.log 2>&1
```

## Troubleshooting

**"Module not found" errors?**
- Make sure you activated the virtual environment: `source venv/bin/activate`
- Or use the full path: `venv/bin/python monitor.py`

**Scraper returns "NOT FOUND"?**
- The selector is wrong — use browser DevTools to find the right one
- Some sites block bots — add `headers={"User-Agent": "Mozilla/5.0"}` (already in the code)

**"Connection timed out"?**
- Check your internet connection
- The target site might be down or blocking your IP
- Try adding a longer timeout: `timeout=60`

## What's next?

Build the **Digital Pet** — your first hardware project.
