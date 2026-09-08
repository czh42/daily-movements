# Morning movements

A small personal timer for a daily routine of gentle movements. Seventeen
exercises, one minute each, with fifteen seconds of rest between them.
Twenty-one minutes in all. Bells mark each change: one soft strike when
a rest begins, two when the next exercise begins, three when the routine
is over.

The routine is modeled after Spencer's routine at Wildcard Wellness
(https://wildcardwellness.co/). This page is only a timer for personal
use. It carries no instructions for the movements, and it is not
affiliated with him.

## Using it

Open `index.html` in a browser. Everything is inside this folder, so it
works offline and without a server.

The start screen is two short paragraphs and a choice: **I want the
full original routine** or **I want to customize my routine**. Whatever
you choose, a sentence above Begin states exactly what pressing it will
start: the routine's length, how many exercises, and the timing. Begin
cannot be pressed until a choice is made, and the choice is remembered,
so the next morning is one press. Either choice opens the list of
exercises beside the text (below it on a phone) as a checklist. A
ten-second "Get ready" count comes before the first exercise.

The original routine always runs at its own timing, 60 seconds a move
with 15 of rest and all 17 moves, whatever the custom settings say.

The bells are explained in the second paragraph. Each bell's name
carries a small speaker mark; press it to hear that bell before you
begin.

During a session:

- **Pause** / **Resume**, or press the space bar.
- **Skip** moves to the next exercise or rest, or press the right arrow.
- **End** asks once more before it stops.

## Customizing

Choosing **customize** unfolds settings inline, before Begin:

- **How much time do you have?** A minutes field with − and +.
- **Time per exercise** (10 to 120 seconds) and **Rest between
  exercises** (none to 60).
- A short block saying how many exercises that time holds, and that a
  balanced mix across the four body areas (shoulders & arms, spine,
  hips & legs, circulation) has been selected, in the routine's own
  order. When the time holds all 17, all 17 are selected.
- **Reset to default** restores 21 minutes, 60 and 15, and a fresh set.

The set is drawn again whenever the time or durations change how many
exercises fit. **Pick again** under the list draws a new mix with as
many moves as are selected at that moment. Hand edits are kept
otherwise. In the list, click a move's box to add or remove it. A
checked box and full ink mean it is in; an empty box and pale ink mean
it is out. The header counts "10 of 17 selected", and the sentence
above Begin follows every change. Clicking a box while on the original
routine turns it into a custom one at the default timing.

Everything is remembered in this browser under the localStorage key
`morning-qigong-settings`, tied to the browser and to the address the
page is opened from.

For a one-off timing of the original routine, add the seconds to the
address: `index.html?work=45&rest=20&ready=5`.

There is no streak or session count; the page keeps nothing about your
days.

## Changing the exercises

The moves are the `MOVES` list near the top of the script in
`index.html`, each with its body area. Order matters. Two names follow
Spencer's list: "Tiptoe arm swings" and "Backstep wave lunges".

## Putting it online later

The folder is a plain static site. Any static host will serve it as is:
Cloudflare Pages, Netlify, GitHub Pages, or a folder on an existing
site. Nothing needs to be built. Once it has an address, "Add to Home
Screen" on a phone gives it an icon of its own.

## Fonts

Petrona and IBM Plex Mono are self-hosted in `fonts/`, both under the
SIL Open Font License. The license files must stay beside the font files.
