---
title: "Python Basics: Variables, Loops and Functions"
description: "Your first real taste of programming — the three ideas every language is built on, in Python."
published: 2026-09-01
level: "beginner"
tags: ["python", "coding", "beginner"]
---

Nearly everything in programming comes down to three ideas. Learn these in
Python and you'll recognise them in every other language you meet.

## Variables — boxes with names

A variable is a name that points at a value.

```python
name = "Shahid"
age = 22
price = 1099.99
```

You read it as "`name` is now `"Shahid"`". The `=` means *assign*, not *equals*.

## Loops — doing something repeatedly

A `for` loop repeats a block of code, once for each item in a list.

```python
games = ["pong", "tetris", "zelda"]

for game in games:
    print("Loaded", game)
```

The indented lines are the *body* of the loop — everything indented runs once
per item.

## Functions — reusable recipes

A function bundles instructions under a name so you can call them anytime.

```python
def greet(person):
    return "Hey " + person

print(greet("Shahid"))
```

`def` defines the function, `person` is an input, and `return` hands a value
back. Call it with different inputs and you get different outputs.

## Conditions — making choices

```python
price = 1099
if price > 1000:
    print("Big purchase!")
else:
    print("Nice and cheap.")
```

`if` checks a condition and runs one branch or the other.

## Put it together

```python
def total(cart):
    return sum(cart)

items = [300, 450, 850]
print("Total:", total(items))
```

That's a real, useful program: a function, a list and a loop working together.
Everything else you learn is just these three ideas wearing different hats.
