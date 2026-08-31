---
title: "Reading and Writing RFID Cards"
description: "How EM410x cards work and how to read, clone and write IDs with the card reader."
published: 2026-08-25
level: "intermediate"
tags: ["rfid", "proxmark3", "hardware"]
---

EM410x cards are the simplest kind of RFID tag — they hold a single read-only
ID and broadcast it whenever a reader powers them. That simplicity makes them
easy to understand and easy to clone, which is exactly what this reader is for.

## How the ID works

Each card has a unique ID written as a series of hexadecimal digits. When you
hold it near a reader, it transmits that ID. The reader just needs to receive
it and turn the signal back into digits.

## Reading a card

Place the card on the reader and run the read command. You'll see the ID appear
on screen — something like `0F0362A1B9`. Keep it: that hex string *is* the card,
for all practical purposes.

## Cloning a card

To clone, write the same hex ID to a blank card:

1. Read the original and copy its ID
2. Place a blank card on the reader
3. Write the ID to the blank card
4. Verify by reading the blank card again

## Good to know

- EM410x is a *legacy* format with no encryption. It is not secure access control.
- Don't clone cards you don't own or have permission to copy.
- Always keep a log of what you write — it makes debugging a lot easier later.

The reader saves every session to a CSV file, which is the fastest way to keep
track of a pile of cards without losing your mind.
