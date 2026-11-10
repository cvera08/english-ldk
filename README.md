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
  (*GO! International 1*, Richmond/Santillana), and in November the school's
  five-page picture review sheet. Exams are cumulative — each one can bring back
  everything before it — so the app keeps **one bank of words**, never starts
  over, and leans on a "Repaso general" mode that mixes every topic.
- **Stages, and "Lo nuevo".** Every topic or word can say which wave it was
  added in (`since: 4`); the waves in order are shown as stages, numbered with a
  plant that grows: Etapa 1 🌱 (up to the third exam), Etapa 2 🌿 (October),
  Etapa 3 🌳 (the November sheet). The newest stage is the big "Lo nuevo" card
  and puts a NUEVO / "+N nuevas" chip on the topics it touched; older stages stay
  one tap away under "Por etapas"; topics are grouped under the stage they
  first appeared in. Each stage keeps its own best score. New material stays
  easy to spot even when it grows an old topic (the colors did exactly that).
- **Sheets: the school's own list.** The bank holds more than any one sheet
  does (the classroom, the family, the house… were never on it), so a school
  sheet is a *subset*: `CONTENT.SHEETS` lists the spellings printed on it, and
  its card ("Repaso de la hoja", 74 words for the November *Repaso Primero*)
  plays only those words, wrong answers included, with a best score of its own.
  The rest of the bank stays in "Repaso general" and the topics. The next sheet
  is one more object in that list; its card appears by itself.
- **Words that look the same are not always the same word.** An *orange* is a
  fruit and a color. The bank keeps both (one spelling, two pictures) and the
  engine never offers one as the other's wrong answer.
- **A memory of what costs her.** Every answer updates a per-word record in the
  browser. Words she misses and hasn't yet got right twice in a row first try
  show up under "Lo que más le cuesta". The end-of-round "Practicar lo que fallé"
  remembers the *exercise*, not just the word: miss the spelling of *purple* and
  the review starts with that same spelling question (fresh, shuffled options),
  and only then — when the list is short enough to keep the round under 12
  questions — asks each word once more in a different format. "Lo que más le
  cuesta" does the same, from the format each word was last missed in (a word
  recorded before formats were kept gets a random one), and fits the 8/12/16
  length picked on the menu. Neither touches a saved best score.
- **Everything is tap-only.** No text inputs anywhere, on purpose: this is meant
  to be played on an iPad or phone by a pre-reader. Even the exam's "write the
  missing letters" exercises became multiple-choice spelling questions here.
- **Question types, all generated from `content.js`.** Four work for any word:
  picture → word, word (+ 🔊) → picture, 🔊 only → picture, and picture → correct
  spelling (with two auto-generated wrong spellings). Wrong answers always come
  from the same topic as the word (*yellow* among *red* and *blue*), like the
  exam's own PEN / PENCIL and TABLE / SOFA pairs. Words that qualify also get
  formats lifted from the course book's tests: *count and choose* (number words),
  *Is it a dog? Yes, it is / No, it isn't*, *THIS IS AN ERASER ✔/✘*, and *I have…
  / Do you have a snake?* (pets). No manual authoring of wrong answers needed.
- **No image files.** Every picture is inline SVG or emoji, built in code
  (`js/icons.js`) — including one reusable hand-drawn kid figure used for every
  body/face word, just pointing at a different spot each time.
- **Read aloud**: uses the browser's built-in `speechSynthesis`, no audio files.
- **A unicorn on the progress bar** 🦄 trots along the front of the pink fill as she
  answers (the same one the math game, *magic-math-kids*, has). It is decorative:
  it never catches a tap.

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

tests/check.js    the sanity checks (node tests/check.js)
manifest.json     home-screen metadata; favicon.svg, apple-touch-icon.png, icon-512.png
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
`since: 6`. It becomes Etapa 4 by itself (the names live in `CONTENT.stage()` if
you'd rather call them trimesters or phases), "Lo nuevo" moves to it, and the
stage it replaces drops into "Por etapas" with its record intact. The menu,
"Repaso general", the question types and the score screen all pick it up
automatically. Before pushing, see [Releasing](#releasing).

Useful word flags (documented at the top of `content.js`): `frame: true` lets a
countable singular thing appear in "Is it a …?" / "This is a …" sentences,
`count: N` marks a number word, `noSpeech: true` keeps the browser voice away
from a word it mangles. For a word with no good emoji, add a small hand-drawn
icon to `ICONS.custom` in `js/icons.js` instead (see `yogurt`, `rug`, `pillow`
for the pattern) — the pictures here are our own drawings, not the course
book's, since the site is public.

## Tests

No browser and nothing to install:

```bash
node tests/check.js
```

It checks the word bank (unique pictures, homonyms), the stages, the sheets (every
listed word exists, no repeats, the November sheet is exactly its 74 words),
`storage.js`
against an in-memory `localStorage` (best scores, the per-word memory, damaged
or unavailable storage), the wiring between `index.html` and `ui.js` (missing
files, load order, every id the JS touches), the build number, and builds a few
hundred sessions per topic, stage and mix, asserting every question is well
formed: exactly one correct option, no duplicates, true sentences marked true,
the right article, counting questions that count what they say.

What it can't see is the page itself. Before a release, play the app in a real
browser — ideally WebKit, the engine of Safari on iPhone — at a phone width
(320 and 375 px): every mode to the end, the review round, the scores and reset.

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

### Releasing

She uses it live on a phone, so test first and push once.

1. `node tests/check.js`, then play it in a browser (see Tests).
2. Bump `BUILD` and `RELEASED` in `js/content.js`, and the `?v=` on the
   stylesheet and every script in `index.html`, to the same number
   (`tests/check.js` fails if they disagree).
3. Push to `master`. The Pages build takes about a minute.

Why the `?v=`: GitHub Pages lets a browser keep each file for 10 minutes, and a
Home Screen app has no refresh button. Because every asset URL carries the build
number, a page and its scripts always come from the same release. To get a new
version she closes the app (swipe it away) and opens it again; inside those 10
minutes the old one can still show, so the version stamp under *Ver puntajes*
says what the device has, and *buscar actualización* next to it loads the latest
straight away. Saved scores live in the browser and are untouched either way.

## Status

Live and in use for real exam review. Git history goes back to the first local
version, so any change can be undone if something regresses.
