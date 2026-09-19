---
title: "Build a Web Scraper & Alert System"
description: "Monitor any website, get notified when it changes — via WhatsApp or email."
published: 2026-09-10
level: "intermediate"
tags: ["diy-kit", "intermediate", "python", "scraping", "alerts", "automation"]
faqs:
  - q: "What computer do I need?"
    a: "A Raspberry Pi or any Linux computer. Even an old laptop works."
  - q: "Can I monitor multiple sites?"
    a: "Yes. The config file supports a list of URLs."
  - q: "How do I get WhatsApp notifications?"
    a: "Use the WhatsApp Business API or a service like Twilio. The guide covers setup."
---

## What you need

From the **Starter Pack**: nothing physical — this is a software project. You need:

- A Linux computer (Raspberry Pi, old laptop, or even a Docker container)
- Python 3.7+
- Internet connection

From this kit: nothing physical — all software.

## Step 1: Understand the architecture

```
   Web Scraper Architecture:
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │  SCHEDULER   │────→│  SCRAPER      │────→│  DIFF ENGINE  │
   │  (runs every │     │  (downloads   │     │  (compares    │
   │   N minutes) │     │   HTML)       │     │   old vs new) │
   └──────────────┘     └──────────────┘     └──────┬───────┘
                                                    │
                                          ┌──────────▼──────────┐
                                          │  NOTIFICATION       │
                                          │  ENGINE             │
                                          │  (WhatsApp/email)  │
                                          └──────────────────────┘

   What happens:
   1. Scheduler wakes up the scraper every N minutes
   2. Scraper downloads the HTML from the target URL
   3. Diff engine compares current HTML with previous version
   4. If different → notification engine alerts you
   5. Save current HTML as "previous" for next run
```

## Step 2: Install dependencies

```bash
# Create a project folder
mkdir web-monitor && cd web-monitor

# Create a Python virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install requests beautifulsoup4 python-dotenv
```

**Result:** All dependencies installed in a virtual environment.

## Step 3: Project structure

```
   web-monitor/
   ├── config.yaml       ← what to monitor
   ├── .env              ← API keys (not committed)
   ├── scraper.py        ← main script
   ├── monitor.py        ← orchestrator
   └── history/          ← saved snapshots
       ├── example.com_20260910_1400.html
       └── example.com_20260910_1430.html
```

**config.yaml:**
```yaml
sites:
  - name: "Product Page"
    url: "https://example.com/product/123"
    selector: ".price"    # only watch this part of the page
    alert: "whatsapp"     # how to notify

  - name: "News Page"
    url: "https://example.com/news"
    selector: "body"      # watch the whole page
    alert: "email"
```

## Step 4: The scraper

```python
# scraper.py
import requests
from bs4 import BeautifulSoup
from datetime import datetime
import hashlib
import json
import os
from pathlib import Path

HISTORY_DIR = Path("history")
HISTORY_DIR.mkdir(exist_ok=True)

def get_snapshot_url(url: str, selector: str) -> str:
    """Download the page and extract the target element."""
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

def get_hash(content: str) -> str:
    """Get a hash of the content for change detection."""
    return hashlib.sha256(content.encode()).hexdigest()

def save_snapshot(site_name: str, content: str):
    """Save current snapshot with timestamp."""
    now = datetime.now()
    filename = f"{site_name}_{now.strftime('%Y%m%d_%H%M')}.html"
    filepath = HISTORY_DIR / filename
    with open(filepath, 'w') as f:
        f.write(content)
    return filepath

def get_last_snapshot(site_name: str) -> str | None:
    """Find the most recent snapshot for this site."""
    files = sorted(HISTORY_DIR.glob(f"{site_name}_*.html"))
    if len(files) >= 2:
        with open(files[-2], 'r') as f:
            return f.read()
    return None

def check_site(site: dict) -> dict:
    """Check a single site for changes."""
    name = site["name"]
    url = site["url"]
    selector = site.get("selector", "body")

    current = get_snapshot_url(url, selector)
    current_hash = get_hash(current)

    last_hash = None
    last_content = get_last_snapshot(name)
    if last_content:
        last_hash = get_hash(last_content)

    changed = current_hash != last_hash

    return {
        "name": name,
        "url": url,
        "changed": changed,
        "current_hash": current_hash,
        "last_hash": last_hash,
        "content": current
    }
```

**Result:** The scraper can download a page, extract the target content and detect changes by comparing hashes.

## Step 5: Notifications

```python
# notifications.py
import smtplib
from email.mime.text import MIMEText
import requests as http_requests
from dotenv import load_dotenv
import os

load_dotenv()

def send_email(subject: str, body: str):
    """Send an email alert."""
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = os.getenv("EMAIL_FROM")
    msg["To"] = os.getenv("EMAIL_TO")

    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT"))) as server:
        server.starttls()
        server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASS"))
        server.send_message(msg)

def send_whatsapp(message: str):
    """Send a WhatsApp message via Twilio."""
    account_sid = os.getenv("TWILIO_SID")
    auth_token = os.getenv("TWILIO_TOKEN")
    from_number = os.getenv("TWILIO_FROM")
    to_number = os.getenv("TWILIO_TO")

    if not all([account_sid, auth_token, from_number, to_number]):
        print("Twilio not configured, skipping WhatsApp")
        return

    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    http_requests.post(url, data={
        "To": to_number,
        "From": from_number,
        "Body": message,
    }, auth=(account_sid, auth_token))
```

## Step 6: The monitor (orchestrator)

```python
# monitor.py
import time
from scraper import check_site
from notifications import send_email, send_whatsapp
import yaml

def load_config():
    with open("config.yaml") as f:
        return yaml.safe_load(f)

def run_checks():
    config = load_config()

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

            # Save the new snapshot
            from scraper import save_snapshot
            save_snapshot(site["name"], result["content"])
        else:
            print(f"  → No change")

if __name__ == "__main__":
    run_checks()
```

**Result:** Run `python monitor.py` — it checks every site in config.yaml, alerts you when something changes, and saves history.

## Step 7: Automate with a cron job

```bash
# Open crontab
crontab -e

# Run every 15 minutes
*/15 * * * * cd /home/pi/web-monitor && venv/bin/python monitor.py >> monitor.log 2>&1
```

**Result:** The scraper runs every 15 minutes without you doing anything.

## Step 8: Assemble (it's software!)

```
   Web Scraper Setup:
   ┌─────────────────────────────────────────┐
   │                                         │
   │  ┌─────────────────────────────────┐  │
   │  │    Your Linux Computer        │  │
   │  │                                 │  │
   │  │  venv/   config.yaml          │  │
   │  │  monitor.py  .env             │  │
   │  │  scraper.py  notifications.py  │  │
   │  │  history/  monitor.log        │  │
   │  │                                 │  │
   │  └─────────────────────────────────┘  │
   │                     ↓ cron runs       │
   │                     every 15 min     │
   └─────────────────────────────────────────┘
```

1. Create the project folder and virtual environment
2. Install dependencies
3. Configure `config.yaml` with your target sites
4. Set up API keys in `.env` (WhatsApp or email)
5. Set up the cron job
6. Done — it runs forever

## Customise it

- Monitor prices on your favourite stores
- Track job listings for specific roles
- Watch for new content on your favourite blogs
- Add Discord notifications instead of WhatsApp
- Store history in a database instead of files

## What's next?

Build the **Pomodoro Timer** — your first hardware timer project.
