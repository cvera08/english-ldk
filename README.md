# English LDK 🌟📚

[![play](https://img.shields.io/badge/play-cvera08.github.io%2Fenglish--ldk-ff6fb5)](https://cvera08.github.io/english-ldk/)

A tap-only English vocabulary quiz for a six-year-old in first grade (Uruguay),
built to review for cumulative school exams — built as a small static web app,
same spirit as `magic-math-kids` and `memory-ldk`.

**▶️ Play it here: https://cvera08.github.io/english-ldk/**

No install, no build step, no accounts, no ads, no tracking. Open the page and play.

On an iPhone or iPad, open that link in Safari, tap the Share icon, then
**Add to Home Screen** — it gets its own icon and opens full-screen, no address
bar, like a real app.

## Why it's built this way

- **Source material**: the school's own exam (`INGLES L 2.pdf`) and the review
  sheet her mom put together (`REPASO PRIMERO.pdf`), both in `~/Downloads` as of
  September 2026. Exams are cumulative — by test 3, vocabulary from tests 1 and 2
  can reappear — so the app leans on a "Repaso general" mode that mixes every
  topic instead of only drilling the newest one.
- **Everything is tap-only.** No text inputs anywhere, on purpose: this is meant
  to be played on an iPad or phone by a pre-reader. Even the exam's "write the
  missing letters" exercises became multiple-choice spelling questions here.
- **Four question types**, generated automatically for any word in `content.js`:
  picture → word, word (+ 🔊) → picture, 🔊 only → picture, and picture → correct
  spelling (with two auto-generated wrong spellings). No manual authoring of
  wrong answers needed.
- **No image files.** Every picture is inline SVG or emoji, built in code
  (`js/icons.js`) — including one reusable hand-drawn kid figure used for every
  body/face word, just pointing at a different spot each time.
- **Read aloud**: uses the browser's built-in `speechSynthesis`, no audio files.

## Project structure

```
index.html        markup for the three screens: home / quiz / end
styles.css        design tokens, layout, animations

js/content.js     the topics and words ← edit this to add a new exam's vocabulary
js/icons.js       every picture (emoji + hand-drawn SVG), including the body diagram
js/engine.js      pure quiz logic: session building, distractors, spelling
                  mutations, scoring — no DOM, so it's easy to test in isolation
js/audio.js       speechSynthesis wrapper
js/storage.js     localStorage best-score tracking per topic
js/confetti.js    the end-screen celebration
js/ui.js          the only file that touches the DOM
js/main.js        entry point
```

### Adding a new exam's vocabulary later

Append words to an existing topic, or a whole new topic object, in
`js/content.js`:

```js
{
    id: 'colors',
    icon: '🎨',
    name: { es: 'Los colores', en: 'Colors' },
    words: [
        { en: 'red', es: 'rojo', icon: ICONS.emoji('🔴') },
        // ...
    ],
}
```

That's the whole change — the menu, the "Repaso general" mix, all four question
types and the score screen all pick it up automatically. For a word with no good
emoji, add a small hand-drawn icon to `ICONS.custom` in `js/icons.js` instead
(see `glue`, `eraser`, `uniform`, etc. for the pattern).

## Running it locally

```bash
git clone https://github.com/cvera08/english-ldk.git
cd english-ldk
python3 -m http.server 8000
```

Then open `http://localhost:8000`. It also runs by opening `index.html` directly
from disk — plain scripts, no build step, nothing to install.

## How it's published

Plain GitHub Pages, serving the `master` branch straight from its root — no
build step, no workflow file, so there's nothing to fail. Every push to
`master` is live within a minute or two.

## Status

Live and in use for real exam review. Git history goes back to the first local
version, so any change can be undone if something regresses.
