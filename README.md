# Over Coffee

Crumple a thought. Toss it in the mug. Deal with it in the morning.

A mobile-first web game. Not a sleep app. Not a wellness tracker. No streaks, no scores, no account.

**Play:** open `index.html` on a phone, or enable GitHub Pages on this repo (`main` / root).

## Why this exists

Some thoughts show up at the wrong hour. The useful move is not to solve them in the dark. It is to give them a named later: coffee.

The toss is the whole mechanic. Missing still counts. The mug always takes it.

Design rationale, tone rules, and the two-mode spec live in [DESIGN.md](./DESIGN.md).

## Modes

- **Later** — write one line, optional next sip, crumple, flick toward the mug. Locked list. No clock.
- **Morning** — after the wake hour you set, the scraps come out of the coffee. Handle them or keep them for tomorrow.

Thoughts stay in `localStorage` on the device.

## Stack

Plain HTML, Canvas, and CSS. PWA shell so it can sit on a home screen. No build step.

## License

MIT
