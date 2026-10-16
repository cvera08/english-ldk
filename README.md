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

- **Source material**: the school's own exam (`INGLES L 2.pdf`), the review
  sheet her mom put together (`REPASO PRIMERO.pdf`) and, from October 2026,
  photos of mom's notebook and of the photocopiable tests of the course book
  (*GO! International 1*, Richmond/Santillana). Exams are cumulative — each one
  can bring back everything before it — so the app keeps one bank of words and
  leans on a "Repaso general" mode that mixes every topic.
- **Waves, and "Lo nuevo".** Every topic or word can say which wave it was added
  in (`since: 4`). The newest wave gets its own "Lo nuevo" quiz across all topics,
  a NUEVO chip on all-new topics, and a "+N nuevas" chip on older topics that
  grew — so new material stays easy to spot even when it's mixed into old topics.
- **A memory of what costs her.** Every answer updates a per-word record in the
  browser. Words she misses and hasn't yet got right twice in a row first try
  show up under "Lo que más le cuesta"; the end-of-round "Practicar lo que fallé"
  replays that round's misses. Neither touches a saved best score.
- **Everything is tap-only.** No text inputs anywhere, on purpose: this is meant
  to be played on an iPad or phone by a pre-reader. Even the exam's "write the
  missing letters" exercises became multiple-choice spelling questions here.
- **Question types, all generated from `content.js`.** Four work for any word:
  picture → word, word (+ 🔊) → picture, 🔊 only → picture, and picture → correct
  spelling (with two auto-generated wrong spellings). Words that qualify also get
  formats lifted from the course book's tests: *count and choose* (number words),
  *Is it a dog? Yes, it is / No, it isn't*, *THIS IS AN ERASER ✔/✘*, and *I have…
  / Do you have a snake?* (pets). No manual authoring of wrong answers needed.
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
                  mutations, the special question types, scoring — no DOM, so
                  it's easy to test in isolation
js/audio.js       speechSynthesis wrapper + the right/wrong/complete blips
js/storage.js     localStorage: best score per topic, per-word miss memory
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

For the next batch, give the new topics (or single words inside old topics)
`since: 5`, and bump `CONTENT.VERSION` so you can see on the device that it
picked up the push. That's the whole change — the menu, "Repaso general", "Lo
nuevo", the question types and the score screen all pick it up automatically.

Useful word flags (documented at the top of `content.js`): `frame: true` lets a
countable singular thing appear in "Is it a …?" / "This is a …" sentences,
`count: N` marks a number word, `noSpeech: true` keeps the browser voice away
from a word it mangles. For a word with no good emoji, add a small hand-drawn
icon to `ICONS.custom` in `js/icons.js` instead (see `yogurt`, `rug`, `pillow`
for the pattern) — the pictures here are our own drawings, not the course
book's, since the site is public.

Quick sanity check, no browser and nothing to install:

```bash
node tests/check.js
```

It builds a few hundred sessions for every topic (and the Repaso / Lo nuevo
mixes) and checks that every question is well formed: exactly one correct
option, no duplicate options, true sentences marked true, the right article,
counting questions that count what they say.

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
