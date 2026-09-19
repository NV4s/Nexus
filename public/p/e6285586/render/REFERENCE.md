# Observed reference notes

Everything here was seen on screen, not guessed. Two sources: the arcade build
run locally via the JConfig ES3 loader (2026-08-30), and a full 56-minute
walkthrough recording at 1280x720/30fps — the game's exact native resolution and
its locked frame rate, so recorded frames map 1:1 to the arcade's own output and
one frame is exactly 0.0333s, the unit the config comments are written in.

No captured frame, sprite or audio file is in this repo. These are written
descriptions of layout and behaviour, which is what the renderer needs.

---

## Combat HUD

Screen is 1280x720. Positions below are from a full-resolution frame.

**Top left — timer.** Large white integer with the fractional part in smaller
type and a `Sec.` suffix: `58` `.33` `Sec.` The clock runs to hundredths, and
that precision is visible. Below it an orange arc icon and the label `TIME`.

**Top centre — info bar.** A small character portrait box (the radio operator)
with the label `INFO.` beneath its left edge, and a single line of white
subtitle text spanning the centre.

**Top right — life.** Three chevron glyphs in circular frames, dark red when
spent. Orange label `LIFE` with a heart glyph beneath.

**Bottom left — weapon and ammo.** A large white magazine count with a small
`Mag Count` label above it; a column of brass cartridge icons; a blue horizontal
bar; the weapon name (`HANDGUN`); a hexagonal blue weapon badge with a gun
glyph; orange label `WEAPON`. The handgun's count displays as an infinity glyph
when unlimited rather than a number.

**Bottom centre — position.** The pedal widget, and the label beneath it is
`POSITION`. One unified graphic: `L` and `R` halves separated by a dark notch.
The pressed side lifts into a raised bright-orange trapezoid; the released side
lies flat and dark. Confirmed as a live state readout — different frames show
each side raised.

**Bottom right — score.** Orange `SCORE` label over a large white value. Bonus
awards stack directly beneath it as they are earned:
`3 HIT!+` with its value in cyan, `SIDE ATTACK x 2 +` with its value in green.

**Corrections this forces on the current build:** score moves from top-left to
bottom-right; life moves from top-left to top-right and becomes chevrons rather
than crosshairs; ammo becomes a magazine count plus cartridge icons at bottom
left instead of dot pips; the pedal widget moves from two boxes at bottom-right
to one unified graphic at bottom-centre; the timer gains hundredths.

## Screen-state banners

Large centred banners over gameplay, each a wide horizontal plate:

- `WAIT` — desaturated blue/violet. Shown while the area will not yet let you
  advance.
- `ACTION` — red/orange. Shown when the area is live and engageable.
- `SUCCESS!` — gold, set at a slight angle, after a completed event.
- Cover-start prompts appear as a red-backed line beneath the banner
  (a "start from right cover" style instruction).

## Events

**Evade.** A bordered panel centred on screen: a title bar reading `EVADE!`
above an instruction line telling the player to step on the indicated pedal
quickly. Then a large centred countdown numeral (`2`, `1`) over live gameplay,
resolving to the `SUCCESS!` banner.

**Player damage.** A red vignette flooding the frame plus a cracked-glass
starburst centred on the impact point, like a round through the screen itself.

**Markers.** Green diamond badges with short caption tags float over objective
targets in the world.

## Boss encounters

- Boss health is a **vertical segmented bar labelled `BOSS`**, drawn in yellow.
  Its position is not fixed to one edge — see the second-pass correction below;
  it was observed top-right.
- A separate horizontal health bar appears above a boss at closer range,
  shading green to yellow as it depletes.
- Weak points are called out by the info bar, and the corresponding part is
  visibly distinct on the model.

## Area result screen

Appears on area clear. Diagonal hazard striping, heavy red plates on dark.

- Small `STAGE n` label above a very large `AREA nn` numeral, left side.
- Stacked red rows on the right, each a label plate with its value and the
  points awarded to the right of it:
  - `CLEAR TIME` — formatted `01'25"27` (minutes, seconds, hundredths) with its
    point award
  - `ACCURACY` — a percentage with one decimal, with its point award
  - `HEADSHOTS` — a count with the suffix `HIT`
- A full-width `AREA SCORE` bar beneath, with the total and the suffix `Pts.`

The plate colour is themed per stage — stage 1's result is red, stage 4's is
green — so the result screen carries the stage's palette.

## Total result screen

- `CONGRATULATIONS!` in large gold type over a `MISSION COMPLETE` sub-banner.
- The same row treatment as the area result: `CLEAR TIME` (formatted
  `22'09"66`), `ACCURACY` percentage, `HEADSHOTS` count with `HIT`.
- `TOTAL SCORE` on a full-width plate with `Pts.`
- A stylised character silhouette fills the right third.

## Continue screen

- `CONTINUE?` heading with `SHOOT TO SELECT` beneath.
- A large circular countdown dial centred, flanked by choice plates — the
  refusing option sits on the right.
- A grid of stage chips (`STAGE 1` through `FINAL STAGE`) beneath, with the
  reached stage highlighted.
- A credit counter at the bottom in `n / n` form.

## Name entry

- `NAME ENTRY` heading, rank numeral and `TOTAL SCORE` shown top left.
- Three character slots.
- An on-screen A-Z grid plus punctuation, with `SHOOT TO SELECT`, a back arrow
  and an `OK` plate.
- A circular countdown dial, seen at 27 seconds.

## Ranking table

- Heading `RANKING` with the mode (`1-PLAYER SOLO`).
- Columns `RANK`, `PLAYER 1`, `SCORE`.
- Each row: ordinal, three-character initials on a red plate, score with `Pts.`,
  and small secondary stats (stage reached, accuracy, clear time).
- Default entries use the cast's initials.

## Stage select

- `SELECT STAGE` heading with a countdown dial (18 seconds observed).
- Two large choices: start from the beginning (green, marked for new players)
  and start from stage 4 (orange).
- A row of stage chips `STAGE 1` .. `FINAL STAGE` beneath.
- `SHOOT TO SELECT` footer.

## Attract mode

- A banner rides the top of the screen throughout, framed by chevrons.
- Cycles between a pedal tutorial card — a foot over an L/R pedal pair with an
  up arrow, on a pale blue ground deliberately unlike the in-game palette — and
  live gameplay footage.
- Credit line at the bottom: an insert prompt, and in-demo a `CREDIT(S) n / n`
  counter. Independently confirms `varGameCost = 2` from `testmode.xml`.

## Enemy and combat detail

- Enemy fire renders as **elongated orange tracers**, short streaks oriented
  along travel — not round dots.
- Muzzle flashes are warm orange, bright and brief.
- Shield carriers hold **large translucent panels** at chest height, wide enough
  to cover the torso and plainly leaving the head exposed. Matches the
  implemented hitbox model: shield covers the body box, never the head box.
- A mounted-gun section exists where a large gatling occupies the lower third of
  the frame and the ammo area shows several weapon slots at once.

## Still missing

- Most frame-accurate timings. One landed (damage vignette, below); the
  red-bullet window, shots-to-kill per archetype and the score values compressed
  inside `TimeCrisisGame.u` are still unmeasured. Automated colour detection is
  too blunt for the red telegraph — it is a localised glow on one enemy, not a
  screen-wide flood.
- Per-area layouts for all 52 areas.
- Six of the eight bosses in detail.

---

## Second pass — full walkthrough analysis

3394 frames at 1fps across the whole 56 minutes, reduced by farthest-point
sampling to 240 covering maximum visual variety, plus dense 30fps windows for
timing.

### Measured, not guessed

- **Damage vignette lasts 25 frames = 0.833s.** Counted directly in a 30fps
  window. `TUNING.HIT_FLASH` was 0.5 by guess and is now this value.

### Boss gauge — correction

The gauge is **not** fixed to the left edge. It appears **top-right**, labelled
`BOSS`, as a vertical segmented bar. A separate horizontal bar with a numeric
percentage (e.g. `46.9 %`) appears near the bottom during some encounters. An
automated left-edge probe found only one instance across the whole video for
exactly this reason.

### Mounted gun sections

A weapon called `MOUNTED MACHINE GUN` takes over: the gun body occupies the
bottom third of the frame, and the ammo readout shows an **infinity glyph**
rather than a count. The handgun shows the same glyph when unlimited.

### Score popup format

Awards stack under the score at bottom right, each as a label plus value:
`n HIT!+` with its points, and `SIDE ATTACK x n +` with its points. Hit-chain
awards were seen at 1, 12, 15 and 17 hits, so the chain counter is uncapped in
display.

### Content confirmed on screen

- Stage 2 is the **train** sequence, matching the recovered `Train1/2/3`
  sequence names, and includes helicopter and mounted-gun sections.
- Stage 4 is the **jungle**, matching `SE_ST4_Object_JungleAmb`.
- Stage 5's boss is **Wild Fang**; Stage 1's is **H.A.C.S.**, whose weak point
  is called out by the info bar.
- Result screen plates are **tinted per stage** — stage 1 red, stage 4 green.

### What automated detection could not do

Detecting every area boundary by image analysis proved unreliable. Result
screens, the damage vignette and cutscene fades all present as "wide saturated
plate over dark ground", and the walkthrough's result screens vary in length.
Enumerating all 52 areas needs frame-by-frame review rather than a threshold,
and is still outstanding.

---

## Third pass — remaining screens and states

### Crisis event

A bordered panel: title bar `CRISIS`, an instruction line about shooting the
markers, and a green circular target glyph. Markers then appear in the world as
green concentric rings to be shot.

**Crisis result** is its own screen, and the only place a letter grade appears:

- `CLEAR TIME` with a seconds value to one decimal and a `Sec.` suffix
- `TARGET` with a count, marked by a green glyph
- `BULL'S EYE` with a count, marked by a green plus glyph
- `BONUS SCORE` with `+nnnnn Pts.`
- `RANK` — a single letter in a large gold disc (an `A` was observed)

### More banners

- `RELOAD` — gold plate, centre screen, shown when the magazine is empty.
- `STAGE n START` — announces a stage, paired with a red cover-start instruction
  line beneath.
- Cover-start lines specify a side (left or right), so the script dictates which
  slot an area begins from. This matches the route `entry` field already in the
  data model.

### Weapon inventory

The bottom-left carries a **row of four to five hexagonal weapon slots**, not a
single weapon. The active one is highlighted and its name shown above the ammo
count. Slots seen holding different weapons simultaneously, including a grenade
slot with its own magenta badge. The current build models one active weapon and
needs a slot row.

### Danger cues

- **Hazard triangles** — yellow-and-black warning glyphs pinned over the source
  of incoming fire.
- **Red ring vignette** — a thick red ring around the screen edge during a
  danger state, distinct from the damage flash, which floods the whole frame.
- Converging orange tracer lines telegraph a shot's path before it lands.

### Boss presentation

- An in-world **`BOSS` diamond badge** floats over the boss, in the same family
  as the green objective markers.
- A **horizontal health bar** sits near the top, filled green and shading to
  yellow as it drops.
- Stage-tinted scenes carry through to the banners: an `ACTION` plate was seen
  over a green-tinted stage 4 scene.

### Continue screen — full detail

- `CONTINUE?` heading, `SHOOT TO SELECT` beneath.
- `YES` on a dark plate at the left, `NO` on a light plate at the right, with a
  red circular countdown dial between them (20 seconds observed).
- An `INSERT n CREDIT(S)` line.
- Stage chips in a two-row grid — `STAGE 1..3` above, `STAGE 4`, `STAGE 5`,
  `FINAL STAGE` below — with reached stages filled orange.
- A `CREDIT(S) n / n` counter at the foot.

### Audio structure

A silence pass over the recording found 60 transition points. Long gaps mark
major boundaries — the intro runs to 0:25, then sustained gaps at roughly 9:00,
13:08, 19:54, 23:06, 35:27 and 40:31, each 5 to 18 seconds. These line up with
stage and cutscene changes and give a usable skeleton for where stages begin and
end, without needing per-area image detection.

Music is continuous within an area and drops out entirely across these
boundaries, so the audio track is a more reliable structural signal than the
image detectors were.

---

## Fourth pass — audio-guided seeking

The image detectors kept failing because result plates, the damage vignette and
cutscene fades all look alike. The audio track does not have that problem: music
runs continuously inside an area and cuts out at every screen transition. Seeking
to the 60 detected audio gaps and testing only those frames found 22 distinct
screens, where blind scanning of all 3394 frames had produced noise.

Use the audio as the structural index. It is the technique that worked.

### RECOVERED: the accuracy bonus formula

Stage clear screens print the accuracy and its award side by side:

| Accuracy shown | Award shown |
|---|---|
| 61.4 % | +61400 |
| 57.8 % | +57800 |

The award is **1000 points per percent** — `accuracy(0..1) * 100000`. Both
samples reproduce exactly. `TUNING.ACCURACY_BONUS` was 5000 by guess and is now
this observed value. This is the first score-table constant recovered from the
game rather than invented, and it came from the screen, not the packages.

### Stage clear screen

Distinct from the area result, and laid out differently:

- Header: `STAGE` then the numeral in a white box, then `CLEARED`.
- Rows, each a label plate with the value large and the points award to its
  upper right:
  - `CLEAR TIME` formatted `02'51"92`
  - `ACCURACY` as a percentage to one decimal
  - `HEADSHOTS` as a count with `HIT`, shown as `---` when none were scored
- `TOTAL SCORE` on a full-width plate with `Pts.`
- Heavy red on dark, with the gameplay scene faintly visible behind.

Observed: stage 1 cleared at `02'51"92` / 61.4% / 6 headshots / 706000 total;
stage 2 at `02'13"67` / 57.8% / no headshots / 1063320 total. The totals are
cumulative across the run, not per stage.

### Game mode select

Precedes stage select. `SELECT A GAME MODE` heading, a `PLAYER 1` plate carrying
the player character's name, a large `1-PLAYER SOLO` option, and the same
`SHOOT TO SELECT` footer used throughout the front end.

### Boss gauge — settled

Earlier passes disagreed with each other. Resolved: the gauge is a **vertical
bar at the far left edge**, labelled `BOSS`, drawn green and depleting downward.
Separately, a `BOSS` diamond badge floats over the boss in the world, in the
same family as the green objective markers. Both exist; they are different
elements, which is what caused the confusion.

### Still not extracted

Per-area results for all 52 areas. The walkthrough surfaces **stage** clears
reliably, but individual area results are brief and many are skipped by the
player, so the audio index finds stage boundaries rather than area boundaries.
Enumerating every area needs a slower playthrough than this recording provides.

---

## Fifth pass — complete boss roster and stage timeline

All eight bosses located in the walkthrough, with the mechanics each one
demonstrates. Timestamps are into the 56-minute recording.

| At | Boss | Mechanics shown |
|---|---|---|
| 5:40 | H.A.C.S. | Paired powered-armour units with thrusters; weak point called out by the info bar |
| 7:28 | Multi-legged walker | Phase numeral in the gauge; auto-repairing part; weak point on the reverse |
| 8:46 | Attack helicopter | Airborne, engaged from a mounted gun |
| 17:00 | Wild Dog | Tractor-beam attack; undefended-spot targeting; bike pursuit section |
| 29:19 | Keith | Sword and blade attacks; hazard triangles; multi-phase |
| 41:10 | Wild Fang | Numeric health percentage readout; two forms |
| 45:53 | Iron Giant | Armour that resists fire; electrical attacks; multi-part |
| 49:59 | Robert | Final human boss, carrier deck |

### Boss gauge — final reading

The vertical bar at the left edge carries a **numeral showing phases remaining**,
counting down (a `2` was observed becoming a `1`). The bar is yellow at high
health and red when low, and a separate horizontal bar with an in-world `BOSS`
diamond badge tracks the current target's health.

### Boss mechanics confirmed against the implemented schema

Three of the fields designed into `content/bosses.js` are directly confirmed by
in-game callouts:

- **Auto-repairing parts** — the info bar warns that a body-section weapon
  repairs itself, which is the `repair: seconds` field.
- **Armour that resists small-arms fire** — the info bar warns against wasting
  bullets on armour, which is the `armor` fraction.
- **Weak points** — repeatedly called out and visually distinct, which is
  `weak: true` on a part.
- **Phase gating** — the gauge numeral counts phases down, which is the
  `phases[]` array.

The schema was designed from symbol names before any of this was seen. It holds.

### Accuracy formula — third confirmation

`FINAL STAGE CLEARED` shows 58.8% paying +58800, matching the two earlier
samples. Three independent confirmations of 1000 points per percent.

### Stage timeline

Derived from clear screens, boss encounters and the audio gaps:

| Stage | Runs to | Environment |
|---|---|---|
| 1 | 8:24 clear | Resort hotel, poolside, terrace |
| 2 | 12:37 clear | Train exteriors, mounted gun, helicopter |
| 3 | ~19:18 | Highway, bike pursuit, tractor-beam boss |
| 4 | ~22:06+ | Jungle, sniper and crisis events |
| 5 | ~44:46 | Industrial, Wild Fang |
| Final | 51:25 cleared | Carrier deck, Iron Giant then Robert |

### Additional mechanics seen

- A **tractor beam** attack that pulls the player's view, matching the
  `TractorBeam` action in the symbol table.
- **Bike pursuit sections** with two riders abreast on a highway, matching the
  stage 3 `Bike1`/`Bike2` sequence names.
- A **part-level health bar** at bottom left, separate from the boss's own
  gauge, tracking a destructible component.

---

## Sixth pass — area results, weapon slots, firing

### The per-area result screen exists after all

Found at 11:24. Earlier passes concluded area results were not reliably in the
recording; that was wrong. Layout, distinct from the stage clear:

- `STAGE n` small, above a very large `AREA nn` numeral, left side
- `CLEAR TIME` formatted `01'28"35`
- `ACCURACY` percentage with its award to the right
- `HEADSHOTS` count, shown as `---` when none
- `AREA SCORE` on a full-width bar with `Pts.`

**The area score is per-area, not cumulative.** One area scored 66320 while the
running total on the HUD read 940180. Stage clear screens carry the cumulative
figure; area results carry only that area's.

### Accuracy formula — fourth confirmation

49.5% paid +49500. With the three earlier samples that is four independent
confirmations of 1000 points per percent.

### Weapon slot row

The bottom-left carries a row of four to five hexagonal slots. The active
weapon's name prints above the ammo readout and changes as it switches —
`HANDGUN`, `MOUNTED MACHINE GUN`, `ROCKET LAUNCHER`, `GRENADE` all observed.
Event weapons show an infinity glyph for ammo rather than a count. Slot badges
are colour-coded, with the grenade slot magenta.

### Firing and targeting

- Muzzle flashes are warm orange, bright and brief.
- Enemy fire renders as elongated orange tracers along the travel path.
- Mounted-weapon sections add **red circular lock-on rings** drawn over valid
  targets, distinct from the green objective diamonds.
- Destructibles burst into large yellow-orange explosions with debris.

### Lives

Three chevron pips, top right under a `LIFE` label. Three were present in every
frame examined, so a life actually being lost was never captured in this run.

### Not in this recording

- **A second-round clear.** The video ends at `FINAL STAGE CLEARED`, then the
  total result, name entry and the ranking table. The playthrough stops at the
  first clear, so the 2nd round and All Clear states are absent.
- **Ammo carrier drops.** `DropAmmoNums` in the config gives the quantities
  (20 / 5 / 1) and the tips text describes the mechanic, but a carrier being
  shot and dropping was not caught in the sampled frames.

### Loading screen

Found while re-checking the first half. Black ground with horizontal red streak
bands sweeping across it, and `NOW LOADING` set right-aligned near the bottom in
a thin red face. Sits between areas and before cutscenes.

### Second round — checked again, still absent

Re-examined the first half specifically. The three unexamined screen transitions
there are two loading screens and a helicopter transit cutscene. No mode or
stage select appears anywhere after the opening ones at 0:35 and 0:44, and a
second round would require one.

One artefact worth recording: the same helicopter cutscene frame appears at both
20:08 and 23:28. Together with the long audio gaps at 19:54 and 23:06 and a
cluster of damage flashes between them, that is a player dying and continuing,
replaying the section — not a second loop of the game.

So `SeqCond_Is2ndRound`, `SeqAct_GoToSecondRound` and the All Clear state remain
known from the symbol table but unobserved. They stay invented.
