# Over Coffee — Game Design Spec

**Repo:** https://github.com/rivendale/over-coffee  
**Platform:** Mobile-first web app (PWA). Portrait. Thumb-driven.  
**Pitch:** Crumple a thought, throw it into the mug, let morning-you deal with it over coffee.

This is not a sleep app, a meditation app, or a habit tracker. It is a physical metaphor for postponement. The promise is “this thought has a place,” not “you will rest.”

## Why this name

Rejected: anything with sleep, rest, calm, unwind, night, dream, hush, zen.

**Over Coffee** is the sentence already in use: “I’ll think about that over coffee.” Coffee is a *when*, not a mood.

Alternates if the name ever needs a sibling: Crumple, Swish, The Mug, First Cup, Percolate.

## Problem

A disciplined person still either rehearses unfinished business at the edge of the day, or wakes between 1–4 a.m. already on, treating the dark as office hours.

Useful science (not “games make you sleepy”):

- Cognitive offloading — a stored thought does not have to be rehearsed to be kept.
- Worry postponement / constructive worry — a named later appointment plus one next step.
- Stimulus control — bed is not a desk. The mug is the desk.
- Low-arousal play — no shooter, RPG, streak, or high score at 3 a.m.
- Amber UI — kitchen night-light, not a phone.

The toss is the implementation intention: if a thought shows up at the wrong time, it goes in the mug.

## Principles

1. No promised state. Copy never says sleep, relax, unwind, breathe, or “you did it.”
2. The mug always accepts. Missing is flavor, not failure.
3. No streaks, XP, leaderboard, or pet.
4. Night parks. Morning opens. List locked until the wake hour.
5. One thought is enough. Later mode hard-stops after two throws.
6. Local only. No account.
7. Thumb-sized. No clock in Later mode.
8. Forgiving physics.
9. Short sessions.
10. After the splash, Done is first. Not Another.

## Modes

**Later** — write one line, optional next sip, crumple, flick. No list. No clock. Landed line: “Coffee will take it from here.”

**Morning** — after wake hour, scraps come out of the coffee. Handle or keep for tomorrow. Before wake hour: “Not yet. This is for coffee.” Empty: “Nothing in the mug.”

## Loop

notice → name it → optional next sip → crumple → throw → mug holds until wake hour → morning reads

## Art

Dark wood counter, one warm lamp out of frame.

| Token | Hex |
|---|---|
| Night wood | `#1A100C` |
| Table | `#3A2418` |
| Lamp | `#E8A15A` |
| Cream | `#F3E6D0` |
| Coffee | `#2A1810` |
| Foam | `#C4A07A` |
| Paper | `#EDE4D4` |

Type: Fraunces + DM Sans. No cool white. No blue buttons.

## Copy allowed

mug, coffee, later, morning, thought, scrap, throw, next sip, parked, not yet.

## Data

`localStorage` key `over-coffee-v1`. Thoughts never leave the device.

## v1 / not v1

Ships: Later loop, Morning list, wake-hour lock, amber canvas mug, PWA.

Out: accounts, audio bed, shuffle stream, health-kit, social, points.

## Success

She throws one thing and puts the phone down. In the morning the mug has that thing. The delight is the paper and the splash, not a score.
