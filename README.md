# Daily movements

A small personal timer for a daily routine of gentle movements. Seventeen
exercises, one minute each, with fifteen seconds of rest between them.
Twenty-one minutes in all. Bells mark each change: one soft strike when
a rest begins, two when the next exercise begins, three when the routine
is over.

The routine is modeled after Spencer's routine at Wildcard Wellness
(https://wildcardwellness.co/). This page is a timer for personal use
and is not affiliated with him. Beside each move it shows a small line
figure of the movement and a short note of our own for a newcomer;
Spencer's own guidance is on his site.

## Using it

Open `index.html` in a browser. Everything is inside this folder, so it
works offline and without a server.

The title, "Daily movements", is the way home: pressing it returns to
the start screen with no option chosen and the list closed. During a
session it asks first, like End, and a second press goes.

The start screen is two short paragraphs and a choice: **I want the
full original routine** or **I want to customize my routine**. Whatever
you choose, a sentence above Begin states exactly what pressing it will
start: the routine's length, how many exercises, and the timing. Begin
cannot be pressed until a choice is made, and the choice is remembered,
so the next time is one press. Either choice opens the list of
exercises beside the text (below it on a phone) as a checklist. A
ten-second "Get ready" count comes before the first exercise.

The original routine always runs at its own timing, 60 seconds a move
with 15 of rest and all 17 moves, whatever the custom settings say.

The bells are explained in the second paragraph. Each bell's name
carries a small speaker mark; press it to hear that bell before you
begin.

Every move in the list carries a small circled i at the end of its row.
Press it, or rest the pointer on it, for that move's note: a storyboard
of two or three stills, a sentence on how the move goes, and a line to
keep in mind. It opens below the mark when the window has room for it
there, and above the mark otherwise. A press pins the note open; a
press anywhere else, or Escape, closes it.

During a session:

- A line figure of the move runs beside the count, repeating the
  movement for as long as the exercise lasts. During "Get ready" and
  each rest there is no figure and no mark: those moments are for
  settling and resting, not for the next move. The figure's place is
  kept, so nothing shifts when it appears. It freezes with a pause. If
  the system asks for reduced motion it holds one still instead.
- The same circled i sits beside the move's name, a little apart from
  it, and opens its note.
- The move's name always sits on one line. Its size is fitted once the
  fonts are in, so that the longest name and the mark after it fit the
  line, and every move uses that same size.
- **Pause** / **Resume**, or press the space bar.
- **Skip** moves to the next exercise or rest, or press the right arrow.
- **End** asks once more before it stops.
- Three bells mark the end. They are booked on the audio clock like the
  others, so they ring on time even if the page is slow to notice.

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
`index.html`, each with its body area. Order matters. Two names are
adapted from Spencer's list: "Backstep wave lunges" (his "Back step")
and "Tiptoe body waves" (his "Tiptoe arm swings"; renamed for how the
move is actually done, a body wave with a rise onto the toes).

The notes are the `NOTES` object right below, keyed by the move's name:
two strings per move, how it goes and what to keep in mind, written as
full sentences. The figures live in `figures.js`, keyed by name as
well. Each is a view, a period in seconds, the phases to show as
stills, and either a list of key poses that are cycled through or a
function of the phase. There are three views. Side on and front on, a
pose is a set of joint angles: limbs are measured from straight down,
the torso and head from straight up, all positive toward the right, and
a hand can instead be given a point to reach for. Three-quarters on,
each limb is placed by two angles, one in the plane of walking and one
out to the side, so that a movement forward and a movement sideways
both show; the marches use it, since the knee comes forward while the
hands go out to the sides. A move with no figure simply shows none.

## Design notes

Rules that settled over the first day of building, kept here so a future
change can be checked against them:

- Nothing on the page moves unless you moved it. Panels open below or
  beside, never by pushing the Begin button around.
- The moves are listed once. The list is also the selection tool.
- Every block in the column shares one measure, so the paragraphs, the
  choices, the settings box, and the sentence above Begin have the same
  left and right edges.
- Prose is set in Petrona; controls and labels in IBM Plex Mono. Italic
  is the page's own voice: the title, "Get ready", "Rest", "Thank you".
- No word is left hanging alone on a line. Headings balance, paragraphs
  wrap "pretty", and figures like "15-sec" never break at the hyphen.
- The sentence above Begin always states exactly what Begin will start,
  with the minutes and the number of exercises in bold.
- One way to customize: time available, then durations, then a balanced
  pick you can edit by hand. The original routine always runs at the
  default timing whatever the custom settings say.
- Spencer is credited in the text and linked. The notes and drawings
  are ours, written and drawn for a newcomer; they describe the
  movements in our own words and point nowhere else. His own guidance
  stays on his site.
- The title is the way home, and home is a blank menu: no option
  chosen, the list closed, Begin waiting. The custom timing is kept.
- The figure is a reference, not a performance: hairlines in ink, the
  far limbs paler, the head a dot, a ground line under the feet. It
  keeps its place through every phase and never pushes the text around.
- The drawings follow how the moves are actually done here, checked
  against videos of them, not a generic version: the wave is continuous,
  the arm circles go up the sides and down the front, the golf swing is
  a pendulum of the whole body with the feet planted, the marches have a
  beat between knees, the rope keeps its length and passes under the
  feet while the body is in the air. A movement that never pauses is
  drawn at a steady pace rather than settling at each pose.
- A straight arm swung toward the viewer has to look shorter in a flat
  drawing. Where that would mislead, in the arm circles and the clap of
  the step backs, the figure is turned a little, thirty degrees, with
  both arms in ink, so the arm reads as coming forward instead.
- Rows in the list are the same size on a phone and a laptop; the body
  area tags hide on phones so every row stays one line.

## Putting it online later

The folder is a plain static site. Any static host will serve it as is:
Cloudflare Pages, Netlify, GitHub Pages, or a folder on an existing
site. Nothing needs to be built. Once it has an address, "Add to Home
Screen" on a phone gives it an icon of its own.

## Fonts

Petrona and IBM Plex Mono are self-hosted in `fonts/`, both under the
SIL Open Font License. The license files must stay beside the font files.
