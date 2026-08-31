---
title: "Flashing SudoOS onto an R36S"
description: "A step-by-step guide to putting SudoOS on your R36S handheld, from downloading the image to first boot."
published: 2026-08-30
level: "beginner"
tags: ["sudoos", "handheld", "r36s", "linux"]
---

The R36S is a great little handheld, but it gets a lot better with a proper OS.
SudoOS is a custom Linux build made for it — this guide walks you through the
whole flash from start to finish.

## What you need

- An R36S handheld
- A microSD card (a good brand — the stock cards die fast)
- A computer with a card reader
- The SudoOS image

## Step 1 — Get the image

Download the latest SudoOS image and unzip it. You should end up with a single
`.img` file.

## Step 2 — Flash the card

On Linux, find your card with `lsblk`, then write the image:

```
sudo dd if=sudoos.img of=/dev/sdX bs=4M status=progress conv=fsync
```

Replace `/dev/sdX` with your actual card device. Double-check this — picking the
wrong device will overwrite the wrong disk.

## Step 3 — Boot

Put the card in the R36S and power it on. The first boot takes longer than
normal while the filesystem expands and things settle in. Give it a minute.

## Step 4 — First things first

- Connect to WiFi so updates work
- Check the storage menu — you may want a second card for games
- Play with the theme and keybindings until it feels right

If something doesn't work, reach out — hardware varies between R36S batches
and most issues are a config tweak away.
