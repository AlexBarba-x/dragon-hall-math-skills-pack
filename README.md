# Dragon Hall Math Skills Pack

A **kid-solo** interactive math tutor. A child can open the page, pick a mission, learn one idea at a time, check answers, and unlock the next skill — no grown-up on the main path.

Live site (after GitHub Pages is on):

**https://alexbarba-x.github.io/dragon-hall-math-skills-pack/**

`index.html` sends you to **`app.html`**. There is no build step.

## How a kid uses it

1. Open `app.html` (or the live URL).
2. Pick a mission. Mission 1 is open. The next one unlocks after 4 correct answers in a row.
3. Read one short step. Tap **Next**.
4. Try a problem. Tap **Check**. Use **Hint** for one next scaffold — not the full answer.
5. After two misses, Pip shows a worked model, then a new twin problem.
6. Stars save in `localStorage` on that device.

Kid voice: short sentences, large tap targets, plain-language glosses.

## The four missions

| Mission | Skill | Practice shape |
|---|---|---|
| Mix & Minus | Signed mixed-number addition | Convert → common bottom → add → simplify (includes negatives) |
| Divide & Compare | Quotient → inequality | Compute a division, then write/compare with < > ≤ ≥ |
| Power Moves | Exponent laws | Product, quotient, and power rules, plus a zero exponent |
| Pay Day | Base pay + percent of sales | Name the base; earnings both ways |

Items are **original isomorphic practice**. They are not copied from any commercial worksheet.

## Paper practice (optional)

`print.html` is still a printable packet with an adult-only last page. Old static lesson pages remain under `lessons/` for reference. They are not the default path.

## Grown-up corner

A tiny **Grown-up** link on the home screen can reset stars, open the print packet, and explain the design. Keep that page off the kid path.

## Tests

```bash
node tests/tutor-engine.test.js
```

## Turn on GitHub Pages

1. Repository **Settings → Pages**
2. **Deploy from a branch** → `main` / `/(root)`
3. Visit `https://alexbarba-x.github.io/dragon-hall-math-skills-pack/`

## Attribution

Pedagogy adapted from [Dragon Hall Commons](https://github.com/AlexBarba-x/commons) (CC BY-SA 4.0). Voice and interactive items were rewritten so a child can learn by doing. This site does not copy commercial test-prep items, choices, or branding.
