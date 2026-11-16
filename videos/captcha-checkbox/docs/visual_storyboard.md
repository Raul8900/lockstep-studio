# Visual Storyboard — “The 'I'm not a robot' box”

35 sequences · 163.72 s · 1080 × 1920 · 30 fps. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 9-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |
| Bottom UI band | 1470–1920 | Backdrop, perspective floor, non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Backdrop.** Charcoal vertical gradient (#05080D → #090E17 → #04060A); three slow fog blobs (cyan, violet, deep cyan); a 60 px dot lattice drifting upward at 7 px/s; six faint vertical traces with pulses travelling top to bottom; a perspective floor grid below y 1500; vignette; a fixed, barely visible dither (about 1.5 code values) that prevents banding in the dark gradients.

**Colour language.** Cyan #27E1FF = the checkbox, the cursor and the path a hand takes · Amber #FFA91E = numbers, dates and the score · Violet #A073FF = data: cookies, history, browser details and signals · Coral #FF5F70 = limits, puzzles, caveats and negation · Mint #4DFFB5 = a pass or a good score · White = what is being said now.

**Type.** Inter Display 800–900 for headlines, Inter 500–700 for glosses, JetBrains Mono 600–800 for labels, code and counters. Smallest label 19–22 px; primary labels ≥ 24 px; headlines 54–250 px.

**Captions.** Inter Display ExtraBold 74 px, white with a 15 px near-black outline, 1–5 words per phrase (140 phrases, 12 of them two-line). Words not yet spoken sit at 44 % opacity; the spoken word scales to 107.5 %, lifts 5 px, and key terms take their semantic colour with a soft halo. Each phrase pops in over 0.14 s (ease-out-back). Position never changes.

**Light.** A two-stage bloom (soft-thresholded quarter- and eighth-resolution blurs added back) gives every bright stroke a glow; captions and the chapter bar are drawn after it so they stay crisp.

**Scene changes.** 0.84 s, ease-in-out-cubic, one of: zoom-in (dive into a point), zoom-out (pull back), pan-down / pan-up (camera travels), cross-fade. The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · The tap, already on its way

**Time:** 0:00.00 → 0:04.64  (4.64 s)  
**Narration:** “You tap a box that says you're not a robot. Researchers say the test”  
**Caption phrases:** You tap a box | that says you're not | a robot. | Researchers say the | test started before

| | |
|---|---|
| **Objects on screen** | Checkbox widget with its label “I'M NOT A ROBOT”; a cursor arriving along a hand-like path; the trail behind it. |
| **Position and size (1080 × 1920)** | Widget 780 × 190 px at x 150, y 706. Box 120 px on its left. Trail from (118, 1126) to the box. |
| **Background** | Standard backdrop; no fade in. Frame 0 is already composed and moving. |
| **Movement** | The cursor lands on the box at “tap”; a cyan ring spreads from the box; the box ticks mint after “robot”. A faint sheen runs along the trail. |
| **Timing and easing** | Click ring 0.55 s ease-out. Tick: ease-out 0.4 s from “robot”. |
| **Camera** | Static camera; the frame stays alive through a slow sheen along the path. |
| **Colour and emphasis** | Cyan for the box and the path; mint for the tick. |
| **Text overlays** | “I'M NOT A ROBOT” (widget label only). |
| **Transition out** | Fade. |
| **Sound** | Lock click on “tap”; chime on the tick; blip when the trail lights. |
| **Purpose** | Open on the thing the viewer has actually done: tapped a box. |

## 02 · The test started earlier

**Time:** 0:04.64 → 0:06.84  (2.20 s)  
**Narration:** “started before your finger got there.”  
**Caption phrases:** your finger got there.

| | |
|---|---|
| **Objects on screen** | The trail lights up from its start; a label at the start of the path; a white pulse runs back along the trail to the box. |
| **Position and size (1080 × 1920)** | Label “STARTED HERE” at (158, 1118), cyan. Pulse runs the full path from start to box. |
| **Background** | Unchanged. |
| **Movement** | On “started” the trail turns cyan from its start point; the pulse runs along the path and ends at the box on “there”. |
| **Timing and easing** | Trail light-up: ease-out 0.45 s from “started”. Pulse: linear over the span from “started” to “there”. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan path; white pulse. |
| **Text overlays** | “STARTED HERE”. |
| **Transition out** | Fade. |
| **Sound** | Blip on “started”; impact on “there”. |
| **Purpose** | Make the earlier start visible: the path is the test, the tap is its last step. |

## 03 · Letters to read

**Time:** 0:06.84 → 0:10.74  (3.89 s)  
**Narration:** “For years, the test was reading wobbly letters.”  
**Caption phrases:** For years, | the test was reading | wobbly letters.

| | |
|---|---|
| **Objects on screen** | Distorted letters “R7kQ2” on a coral-edged card with an answer field and a blinking caret. |
| **Position and size (1080 × 1920)** | Card 700 × 250 px centred at (540, 720). Letters at 124 px, JetBrains-style display face. |
| **Background** | Standard backdrop. |
| **Movement** | Letters wobble individually (small rotation and vertical drift); the caret blinks twice a second. |
| **Timing and easing** | Continuous idle motion; the wobble never stops. |
| **Camera** | Static camera. |
| **Colour and emphasis** | Coral: the old test is friction. |
| **Text overlays** | “TYPE THE LETTERS”. |
| **Transition out** | Continues into the shrink. |
| **Sound** | Tick on “years”; a short deny on “wobbly”. |
| **Purpose** | Establish the old test in one picture: read the letters, type them. |

## 04 · Shrink to the challenge

**Time:** 0:10.74 → 0:14.16  (3.42 s)  
**Narration:** “In twenty thirteen, Google said its risk analysis covers”  
**Caption phrases:** In twenty thirteen, | Google said its risk | analysis covers

| | |
|---|---|
| **Objects on screen** | The same card, shrinking to about 56 % of its size at the centre. |
| **Position and size (1080 × 1920)** | Card scales from 1.0 to 0.56 about (540, 720), between “in” and “thirteen”. |
| **Background** | Standard backdrop. |
| **Movement** | Smooth ease-in-out shrink; the letters keep wobbling. |
| **Timing and easing** | Shrink: ease-in-out cubic 0.5 s from “in”. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral card; the picture is smaller as the idea gets bigger. |
| **Text overlays** | None yet. |
| **Transition out** | Continues into the ring. |
| **Sound** | Soft tick. |
| **Purpose** | Make the challenge small so the signals around it can take the space. |

## 05 · Signals around the challenge

**Time:** 0:14.16 → 0:18.89  (4.73 s)  
**Narration:** “everything you do around a challenge, not only the answer you type.”  
**Caption phrases:** everything you do | around a challenge, | not only the answer | you type.

| | |
|---|---|
| **Objects on screen** | Twenty-two violet dots in a ring around the card; the typed answer is one white dot inside the field, ringed when highlighted. |
| **Position and size (1080 × 1920)** | Ring radius 240–266 px about (540, 720). Headline “AROUND THE CHALLENGE” at y 430. “ANSWER” label at y 1110. |
| **Background** | Standard backdrop. |
| **Movement** | Dots pop in one by one from “everything” and slowly orbit; at “not only the answer” the ring dims and the answer ring pulses. |
| **Timing and easing** | Dots: ease-out-back 0.25 s each, 30 ms apart. Answer ring pulses from “answer”. |
| **Camera** | Slow orbit (0.05 rad per second) keeps the frame alive. |
| **Colour and emphasis** | Violet for the signals; white for the answer. |
| **Text overlays** | “AROUND THE CHALLENGE” · “ANSWER”. |
| **Transition out** | Card and ring fade out before the checkbox arrives. |
| **Sound** | Dots pop with a tick each; pulse on “answer”. |
| **Purpose** | Show that the answer is one input among many, which is what the 2013 wording says. |

## 06 · The checkbox arrives

**Time:** 0:18.89 → 0:21.74  (2.85 s)  
**Narration:** “In twenty fourteen, the checkbox arrived, and”  
**Caption phrases:** In twenty fourteen, | the checkbox arrived, | and many people passed

| | |
|---|---|
| **Objects on screen** | A cyan checkbox at the centre; nothing else yet. |
| **Position and size (1080 × 1920)** | Box 240 px at (540, 760), scaling up from 0.82. |
| **Background** | Standard backdrop. |
| **Movement** | Box pops in with an overshoot on “fourteen”. |
| **Timing and easing** | Ease-out-back 0.4 s from “fourteen”. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan: the checkbox. |
| **Text overlays** | None yet. |
| **Transition out** | Cross-fade from the signals. |
| **Sound** | Stamp on “fourteen”. |
| **Purpose** | Introduce the checkbox as the new, simpler test. |

## 07 · Many pass, one click

**Time:** 0:21.74 → 0:24.17  (2.43 s)  
**Narration:** “many people passed with one click.”  
**Caption phrases:** with one click.

| | |
|---|---|
| **Objects on screen** | Twelve mint ticks in a grid under the box; the box ticks when clicked; a cyan ring on the click. |
| **Position and size (1080 × 1920)** | Grid 4 × 3 at x 300–780, y 960–1092. Caption label “MANY PASSED” at y 1180. Headline “ONE CLICK” at y 470. |
| **Background** | Standard backdrop. |
| **Movement** | Ticks land one after another, 35 ms apart, from “many”. On “click” the box glows and ticks mint. |
| **Timing and easing** | Ticks: ease-out 0.25 s each. Ring: ease-out-cubic 0.55 s from “click”. |
| **Camera** | Static. |
| **Colour and emphasis** | Mint ticks: passes. Cyan ring: the click. |
| **Text overlays** | “MANY PASSED” · “ONE CLICK”. |
| **Transition out** | Zoom-out into the next scene's tap. |
| **Sound** | Ticks sound; lock on “click”. |
| **Purpose** | Show many people passing with a single click, which is why it felt like a test you pass. |

## 08 · The tap is small; the test is big

**Time:** 0:24.17 → 0:29.15  (4.97 s)  
**Narration:** “The click feels like the test. It's really a request for a verdict. The”  
**Caption phrases:** The click feels like | the test. | It's really a request | for a verdict. | The evidence was

| | |
|---|---|
| **Objects on screen** | The checkbox; a cursor arriving and tapping; a large grey ring around the box labelled “THE TEST”; a cyan request line down to a “?” verdict node. |
| **Position and size (1080 × 1920)** | Box 230 px at (540, 640). Test ring radius 270 px. Verdict node r 60 at (540, 1000); “VERDICT” label at y 1090. |
| **Background** | Standard backdrop. |
| **Movement** | Cursor eases in and taps on “click”; the test ring grows on “test”; the request line draws down on “request”; the node pulses on “verdict”. |
| **Timing and easing** | Cursor: ease-out 0.85 s. Ring: ease-out 0.5 s from “test”. Request: 0.5 s draw from “request”. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan for the click and the request; grey for the test ring. |
| **Text overlays** | “THE TEST” · “VERDICT”. |
| **Transition out** | Ring fades as the evidence arrives. |
| **Sound** | Lock on “click”; whoosh on “test”; zip on “request”; chime on “verdict”. |
| **Purpose** | The tap is a request for a verdict, not the test itself. |

## 09 · Evidence gathers round the box

**Time:** 0:29.15 → 0:31.15  (2.00 s)  
**Narration:** “evidence was gathered around it.”  
**Caption phrases:** gathered around it.

| | |
|---|---|
| **Objects on screen** | Fourteen violet dots fly in from the periphery and settle in an orbit around the box. |
| **Position and size (1080 × 1920)** | Dots start at radius 430 px and settle at 200 px about (540, 640). Label “EVIDENCE” at y 1180. |
| **Background** | Standard backdrop. |
| **Movement** | Dots move inward from “evidence”, 35 ms apart, and then orbit slowly. |
| **Timing and easing** | Ease-in-out 0.5 s each; dots fade out before the verdict splits. |
| **Camera** | Slow orbit. |
| **Colour and emphasis** | Violet: the evidence, which is data. |
| **Text overlays** | “EVIDENCE”. |
| **Transition out** | Dots converge and leave before the split. |
| **Sound** | Tick per dot. |
| **Purpose** | Show what the verdict is built from: evidence gathered around the click. |

## 10 · The verdict splits

**Time:** 0:31.15 → 0:35.47  (4.32 s)  
**Narration:** “If it looks human, you pass. If it can't tell, you get a puzzle.”  
**Caption phrases:** If it looks human, | you pass. | If it can't tell, | you get a puzzle.

| | |
|---|---|
| **Objects on screen** | Two branches from the verdict node: left to a mint tick (PASS); right to a coral puzzle sheet (PUZZLE). |
| **Position and size (1080 × 1920)** | PASS node at (300, 1120), r 62. PUZZLE piece sheet 130 px at (780, 1120). Labels at y 1200. |
| **Background** | Standard backdrop. |
| **Movement** | Left branch draws from “looks human”; the tick draws from “pass”. Right branch draws from “can't tell”; the puzzle appears on “tell”; its label on “puzzle”. |
| **Timing and easing** | Branch draws: 0.4 s. Tick: 0.35 s draw. Puzzle: ease-out 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Mint for the pass; coral for the puzzle. |
| **Text overlays** | “PASS” · “PUZZLE”. |
| **Transition out** | Zoom-out to the next chapter. |
| **Sound** | Chime on the pass; lock on the tick; deny on “tell”; stamp on the puzzle. |
| **Purpose** | State the outcome honestly: pass when it looks human, puzzle when it cannot tell. |

## 11 · A list nobody publishes

**Time:** 0:35.47 → 0:39.84  (4.38 s)  
**Narration:** “So what does it watch? Google doesn't publish the full list. A”  
**Caption phrases:** So what does it watch? | Google doesn't publish | the full list. | A twenty twenty-one

| | |
|---|---|
| **Objects on screen** | A panel of five rows; each row a grey bar with a left icon; the rows lock to coral with a padlock on “publish”. |
| **Position and size (1080 × 1920)** | Headline “WHAT IT WATCHES” at y 470. Panel 780 × 470 at (150, 540). Caveat “NOT PUBLISHED BY GOOGLE” at y 1100. |
| **Background** | Standard backdrop. |
| **Movement** | Rows appear in turn from “what”; on “publish” the bars turn coral and padlocks slide in. |
| **Timing and easing** | Rows: ease-out 0.4 s, 0.12 s apart. Lock: ease-out 0.4 s from “publish”. |
| **Camera** | Static. |
| **Colour and emphasis** | Grey bars, then coral padlocks: a list that is locked. |
| **Text overlays** | “WHAT IT WATCHES” · “NOT PUBLISHED BY GOOGLE”. |
| **Transition out** | Cross-fade to the survey. |
| **Sound** | Lock on “publish”. |
| **Purpose** | Open the chapter with the claim the rest must back up: Google does not publish the list. |

## 12 · The survey's signals

**Time:** 0:39.84 → 0:48.26  (8.41 s)  
**Narration:** “twenty twenty-one survey describes the checkbox recording cursor movement, where you click, and how long the pointer hovers. It also records”  
**Caption phrases:** survey describes the | checkbox recording | cursor movement, | where you click, | and how long the | pointer hovers. | It also records

| | |
|---|---|
| **Objects on screen** | A checkbox at the centre with three violet data labels on leader lines: CURSOR MOVEMENT, CLICK LOCATION, HOVER TIME. |
| **Position and size (1080 × 1920)** | Box 200 px at (540, 720). Labels at (250, 900), (830, 900), (540, 1010). Amber “2021 SURVEY” at y 470. Caveat at y 1130. |
| **Background** | Standard backdrop. |
| **Movement** | Labels appear on “cursor”, “where” and “hovers”, each on a leader line; the year rises on “twenty-one”. |
| **Timing and easing** | Labels: ease-out 0.3 s each. |
| **Camera** | Slow hot glow on the box. |
| **Colour and emphasis** | Violet: signals and data; amber: the year; coral caveat: a survey, not Google. |
| **Text overlays** | “2021 SURVEY” · “CURSOR MOVEMENT” · “CLICK LOCATION” · “HOVER TIME” · “SURVEY'S DESCRIPTION, NOT GOOGLE”. |
| **Transition out** | Cross-fade to the browser details. |
| **Sound** | Pop on each label. |
| **Purpose** | Name the signals the 2021 survey describes, and say where the description comes from. |

## 13 · Browser details

**Time:** 0:48.26 → 0:49.76  (1.50 s)  
**Narration:** “browser details and”  
**Caption phrases:** browser details and

| | |
|---|---|
| **Objects on screen** | A small browser window with a tab bar and history rows; the tag BROWSER DETAILS under it. |
| **Position and size (1080 × 1920)** | Window 330 × 230 px at (130, 560). Tag at (295, 860). |
| **Background** | Standard backdrop. |
| **Movement** | Window pops in on “browser”; its history rows light in turn. |
| **Timing and easing** | Rows: ease-out 0.6 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet: browser data. |
| **Text overlays** | “BROWSER DETAILS”. |
| **Transition out** | Cross-fade to the cookie. |
| **Sound** | Pop on “browser”. |
| **Purpose** | Show the browser side of the signals, the part the survey lists. |

## 14 · A cookie that is essential

**Time:** 0:49.76 → 0:55.18  (5.42 s)  
**Narration:** “cookies. Google's own FAQ calls a cookie essential to that analysis.”  
**Caption phrases:** cookies. | Google's own FAQ calls | a cookie essential to | that analysis.

| | |
|---|---|
| **Objects on screen** | A cookie icon with chips; the cookie's name _GRECAPTCHA under it; a mint ESSENTIAL pill; a caveat for Google's FAQ. |
| **Position and size (1080 × 1920)** | Cookie radius 105 px at (720, 680). Name at y 948. ESSENTIAL pill at y 1032. Caveat at y 1150. |
| **Background** | Standard backdrop. |
| **Movement** | Cookie pops on “cookies”; its name fades in on “cookie”; the pill rises on “essential”. |
| **Timing and easing** | Cookie: ease-out-back 0.5 s. Name: 0.3 s fade. Pill: 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet cookie; mint for essential. |
| **Text overlays** | “COOKIES” · “_GRECAPTCHA” · “ESSENTIAL” · “GOOGLE'S OWN FAQ”. |
| **Transition out** | Panning down to the cursor chapter. |
| **Sound** | Pop on “cookies”; chime on “essential”. |
| **Purpose** | Show the one cookie the FAQ names, as essential, and cite the FAQ on screen. |

## 15 · One steady speed, crossed out

**Time:** 0:55.18 → 0:58.48  (3.30 s)  
**Narration:** “A real hand never moves at one steady speed.”  
**Caption phrases:** A real hand | never moves at one | steady speed.

| | |
|---|---|
| **Objects on screen** | A speed-against-time graph: a flat coral line at one steady speed; a cross on it; the labels SPEED and TIME. |
| **Position and size (1080 × 1920)** | Graph base-left (150, 1090), width 800, height 360. Flat line at 70 % of height. Headline “HOW A HAND MOVES” at y 470. Cross at (550, 838). |
| **Background** | Standard backdrop. |
| **Movement** | Axes draw in; the flat line draws from “real”; the cross appears on “never”; the label “ONE STEADY SPEED” on “steady”. |
| **Timing and easing** | Axes: 0.6 s. Line: 0.7 s draw. Cross: 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral: a steady speed is the wrong picture of a hand. |
| **Text overlays** | “HOW A HAND MOVES” · “ONE STEADY SPEED” · “SPEED” · “TIME”. |
| **Transition out** | Cross-fade to the moving cursor. |
| **Sound** | Deny on “never”. |
| **Purpose** | State the claim the chapter is about: a hand never moves at one steady speed. |

## 16 · Speeds up, peaks, eases in

**Time:** 0:58.48 → 1:04.21  (5.73 s)  
**Narration:** “It speeds up, peaks, and eases into the target. In nineteen eighty-five, Flash”  
**Caption phrases:** It speeds up, | peaks, and eases | into the target. | In nineteen eighty-five, | Flash and Hogan

| | |
|---|---|
| **Objects on screen** | A cursor travels a short track to a target ring; the same time is drawn as a bell-shaped speed curve in cyan; a white marker rides the curve; the label PEAK. |
| **Position and size (1080 × 1920)** | Track at y 620 from x 170 to 890; target ring at (900, 620). Bell curve on the graph (peak at y 730). PEAK label at (550, 696). |
| **Background** | Standard backdrop. |
| **Movement** | Cursor and curve move together from “it”; the peak is marked on “peaks”; the cursor eases into the ring on “eases”; the ring pulses on “target”. |
| **Timing and easing** | Cursor: ease-in-out 1.2 s to “target”. Curve: linear with the cursor. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan for the hand's motion. |
| **Text overlays** | “PEAK”. |
| **Transition out** | Track fades after the target; the bell stays. |
| **Sound** | Blip on “peaks”; lock on “target”. |
| **Purpose** | Tie the sentence to a picture: the curve is the cursor's speed. |

## 17 · 1985, Flash and Hogan

**Time:** 1:04.21 → 1:10.11  (5.90 s)  
**Narration:** “and Hogan modeled arm movement this way: a smooth, bell-shaped curve of speed. One published”  
**Caption phrases:** modeled arm movement | this way: a smooth, | bell-shaped curve | of speed. | One published detector

| | |
|---|---|
| **Objects on screen** | Amber “1985”; white “FLASH & HOGAN”; the bell curve in full; a pulse at the peak; the label MINIMUM-JERK MODEL. |
| **Position and size (1080 × 1920)** | Year 150 px at y 560. Names at y 634. Curve as before. Label at y 1150. |
| **Background** | Standard backdrop. |
| **Movement** | Year rises on “nineteen”; names on “flash”; the bell draws through “modeled”; its peak pulses on “bell-shaped”. |
| **Timing and easing** | Year: ease-out 0.3 s. Glow pulse 0.6 s on “bell-shaped”. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber for the date; cyan for the model's curve. |
| **Text overlays** | “1985” · “FLASH & HOGAN” · “MINIMUM-JERK MODEL”. |
| **Transition out** | Cross-fade to the detector. |
| **Sound** | Chime on “flash”; swell on “bell-shaped”. |
| **Purpose** | Credit the model: Flash and Hogan's 1985 minimum-jerk shape. |

## 18 · A detector checks the path

**Time:** 1:10.11 → 1:14.25  (4.15 s)  
**Narration:** “detector checks cursor paths against a model like that.”  
**Caption phrases:** checks cursor paths | against a model | like that.

| | |
|---|---|
| **Objects on screen** | A wobbly cyan cursor path across the frame; a dashed violet model path (smooth) under it; a scanner line sweeping left to right; the detector label; caveats. |
| **Position and size (1080 × 1920)** | Paths at y 880 from x 150 to 930. Scanner x 150 → 930. DETECTOR at y 700. Model label at y 1000. Caveats at y 1110 and 1180. |
| **Background** | Standard backdrop. |
| **Movement** | The scanner sweeps from “detector” to “checks”; the model path draws on “model”. |
| **Timing and easing** | Scanner: linear 0.9 s. Path draw: 0.8 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan path; violet model; coral caveat for the training data. |
| **Text overlays** | “DETECTOR” · “MODEL OF HUMAN MOVEMENT” · “BECAPTCHA-MOUSE, 2020” · “TRAINED ON PUZZLE DRAGS”. |
| **Transition out** | Cross-fade to the comparison. |
| **Sound** | Whoosh on “detector”; tick on “checks”. |
| **Purpose** | Show what the cited detector does, with its caveat on screen: trained on puzzle drags, not checkbox clicks. |

## 19 · Movement cut the puzzles

**Time:** 1:14.25 → 1:21.51  (7.26 s)  
**Narration:** “In a twenty twenty-four study of reCAPTCHA version two, any cursor movement cut the number of puzzles needed to pass.”  
**Caption phrases:** In a twenty twenty-four | study of reCAPTCHA | version two, | any cursor movement | cut the number of | puzzles needed | to pass.

| | |
|---|---|
| **Objects on screen** | Two columns of puzzle icons: coral on the left (no movement), cyan on the right (any movement); an arrow labelled CUT between them; bottom labels MORE and FEWER PUZZLES; an illustrative caveat. |
| **Position and size (1080 × 1920)** | Left column at x 240–360 (six icons); right column at x 780 (three icons); icons 100 px. Arrow at y 770. Caveat at y 1130. |
| **Background** | Standard backdrop. |
| **Movement** | Columns appear in turn from “study”; the arrow draws on “cut”; the bottom labels arrive on “puzzles” and “cut”. |
| **Timing and easing** | Icons: ease-out 0.4 s, staggered. Arrow: 0.5 s draw. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral: more puzzles; mint: fewer puzzles. |
| **Text overlays** | “RECAPTCHA VERSION TWO” · “NO MOVEMENT” · “ANY MOVEMENT” · “CUT” · “MORE PUZZLES” · “FEWER PUZZLES” · “ILLUSTRATIVE, NOT TO SCALE”. |
| **Transition out** | Cross-fade to the straight and curved paths. |
| **Sound** | Slice on “cut”. |
| **Purpose** | Show the comparison's direction without inventing numbers: the stack is illustrative, the direction is from the study. |

## 20 · Straight versus curved

**Time:** 1:21.51 → 1:25.84  (4.32 s)  
**Narration:** “Straight paths and curved ones were not significantly different.”  
**Caption phrases:** Straight paths and | curved ones were | not significantly | different.

| | |
|---|---|
| **Objects on screen** | A straight coral path and a curved cyan path converging on one target ring; labels STRAIGHT and CURVED; NOT SIGNIFICANTLY DIFFERENT; p = 0.57. |
| **Position and size (1080 × 1920)** | Straight path (170, 600) → (860, 790). Curved path (170, 1000) → (860, 790). Ring r 42 at (860, 790). Labels at y 1130 and 1190. |
| **Background** | Standard backdrop. |
| **Movement** | The straight path draws on “straight”; the curved one on “curved”; the ring appears on “curved”; the labels on “significantly” and “different”. |
| **Timing and easing** | Paths: 0.5 s draw each. Labels: ease-out 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral straight; cyan curved; white for the verdict; amber for the p value. |
| **Text overlays** | “STRAIGHT” · “CURVED” · “NOT SIGNIFICANTLY DIFFERENT” · “p = 0.57”. |
| **Transition out** | Cross-fade to the question. |
| **Sound** | Pop on each path. |
| **Purpose** | State the 2024 comparison's result exactly: the difference was not significant. |

## 21 · So is it the wobble?

**Time:** 1:25.84 → 1:29.15  (3.31 s)  
**Narration:** “So is it the wobble? Google doesn't say.”  
**Caption phrases:** So is it the | wobble? | Google doesn't say.

| | |
|---|---|
| **Objects on screen** | A large cyan question mark over a faint wobbly path; the word WOBBLE; the pill GOOGLE DOESN'T SAY. |
| **Position and size (1080 × 1920)** | Question mark 320 px at (540, 690). Path at y 800. WOBBLE at y 1080. Pill at y 1180. |
| **Background** | Standard backdrop. |
| **Movement** | The path draws in; the question mark glows; WOBBLE rises on “wobble”; the pill fades in on “doesn't”. |
| **Timing and easing** | Path: 0.8 s draw. Word: ease-out 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan: the question; coral pill: the limit. |
| **Text overlays** | “WOBBLE” · “GOOGLE DOESN'T SAY”. |
| **Transition out** | Cross-fade to the browser. |
| **Sound** | Impact on “wobble”. |
| **Purpose** | Say the honest limit: the tests show movement matters; Google does not say whether micro-wobble is measured. |

## 22 · The browser window

**Time:** 1:29.15 → 1:32.20  (3.05 s)  
**Narration:** “Then there's the browser. A twenty twenty-four”  
**Caption phrases:** Then there's the | browser. | A twenty twenty-four

| | |
|---|---|
| **Objects on screen** | A large violet-edged browser window sliding in from above; a violet headline THE BROWSER; a cookie icon and a COOKIES label beside it. |
| **Position and size (1080 × 1920)** | Window 520 × 440 at (130, 560). Headline at y 470. Cookie 72 px at (810, 650). Label COOKIES at y 770. |
| **Background** | Standard backdrop. |
| **Movement** | The window slides down into place on “then”; the headline and cookie pop in on “browser” and “cookies”. |
| **Timing and easing** | Slide: ease-out 0.6 s from “then”. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet: browser data. |
| **Text overlays** | “THE BROWSER” · “COOKIES”. |
| **Transition out** | Cross-fade to the weight. |
| **Sound** | Whoosh on “then”; blip on “browser”; pop on “cookies”. |
| **Purpose** | Show the browser as the source of the history and cookies the next sentence names. |

## 23 · Cookies and history carry weight

**Time:** 1:32.20 → 1:40.97  (8.77 s)  
**Narration:** “study reports that cookies and browsing history carry substantial weight in whether a visitor seems human. Browsing history”  
**Caption phrases:** study reports that | cookies and browsing | history carry | substantial weight | in whether a visitor | seems human. | Browsing history is

| | |
|---|---|
| **Objects on screen** | History rows light up inside the window; a violet weight meter fills beside it; a person icon; the caveat REPORTED BY RESEARCHERS. |
| **Position and size (1080 × 1920)** | Meter 76 × 180 px at (772, 820). Label SUBSTANTIAL WEIGHT at y 1062. Person 96 px at (540, 1140). Caveat at y 1206. |
| **Background** | Standard backdrop. |
| **Movement** | Rows light from “browsing”; the meter fills from “carry” to “weight”; the person fades in on “seems”; the caveat on “study”. |
| **Timing and easing** | Meter: ease-out 1.0 s. Rows: ease-out 0.6 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet: data; coral caveat: the claim is reported. |
| **Text overlays** | “SUBSTANTIAL WEIGHT” · “REPORTED BY RESEARCHERS”. |
| **Transition out** | Cross-fade to the stamp. |
| **Sound** | Data blips; swell on “weight”. |
| **Purpose** | Say what the study reports, with the caveat that it is a report. |

## 24 · Research, not confirmed

**Time:** 1:40.97 → 1:44.84  (3.88 s)  
**Narration:** “is what researchers report. Google hasn't confirmed it.”  
**Caption phrases:** what researchers | report. | Google hasn't | confirmed it.

| | |
|---|---|
| **Objects on screen** | History rows dim; the label RESEARCHERS REPORT; a rotated coral stamp GOOGLE: NOT CONFIRMED. |
| **Position and size (1080 × 1920)** | Label at y 1062. Stamp 524 × 76 px centred at (540, 1132), rotated −0.06 rad. |
| **Background** | Standard backdrop. |
| **Movement** | Rows dim on “researchers”; the label appears; the stamp lands on “confirmed”. |
| **Timing and easing** | Rows dim: 0.7 s. Stamp: 0.4 s fade. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral stamp: a negation of confirmation. |
| **Text overlays** | “RESEARCHERS REPORT” · “GOOGLE: NOT CONFIRMED”. |
| **Transition out** | Zoom-in into the score scale. |
| **Sound** | Stamp on “confirmed”. |
| **Purpose** | Keep the claim and its status separate on screen: researchers report it; Google has not confirmed it. |

## 25 · Version three has no checkbox

**Time:** 1:44.84 → 1:48.67  (3.82 s)  
**Narration:** “Version three has no checkbox at all. It returns”  
**Caption phrases:** Version three has | no checkbox at all. | It returns a score

| | |
|---|---|
| **Objects on screen** | The checkbox fades out with a coral cross over it; the headline VERSION 3 in amber; the label NO CHECKBOX. |
| **Position and size (1080 × 1920)** | Box 230 px at (540, 700). Cross 110 px. Headline at y 470. Label at y 1010. |
| **Background** | Standard backdrop. |
| **Movement** | Box fades on “checkbox”; the cross draws; the label appears; the label and headline fade before the score section. |
| **Timing and easing** | Cross: 0.35 s draw. Fades: 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral: no checkbox; amber: the version number. |
| **Text overlays** | “VERSION 3” · “NO CHECKBOX”. |
| **Transition out** | Cross-fade to the scale. |
| **Sound** | Deny on “checkbox”. |
| **Purpose** | Establish the change: version three is silent, with no checkbox. |

## 26 · A score from zero to one

**Time:** 1:48.67 → 1:56.03  (7.37 s)  
**Narration:** “a score from zero to one. One means very likely a good interaction. Zero means very likely a bot. Each”  
**Caption phrases:** from zero to one. | One means very | likely a good | interaction. | Zero means very | likely a bot. | Each site sets its

| | |
|---|---|
| **Objects on screen** | A horizontal score scale: coral at 0 labelled BOT; mint at 1 labelled GOOD INTERACTION; a white needle that sweeps from 0 to 1. |
| **Position and size (1080 × 1920)** | Scale 780 px wide from x 150 to 930 at y 760. Labels 0.0 and 1.0 in amber above the ends. |
| **Background** | Standard backdrop. |
| **Movement** | The needle sweeps from “score” to “one”; the labels pulse on “zero” and “one”. |
| **Timing and easing** | Needle: ease-in-out 1.1 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Coral for bot, mint for good; white needle. |
| **Text overlays** | “0.0” · “1.0” · “BOT” · “GOOD INTERACTION”. |
| **Transition out** | Cross-fade to the cutoff. |
| **Sound** | Tick on “zero” and “one”. |
| **Purpose** | Show the two ends the docs define, in the words the docs use. |

## 27 · Each site sets its cutoff

**Time:** 1:56.03 → 2:00.77  (4.74 s)  
**Narration:** “site sets its own cutoff, and Google suggests starting at point five.”  
**Caption phrases:** own cutoff, | and Google suggests | starting at | point five.

| | |
|---|---|
| **Objects on screen** | The same scale with an amber cutoff line at 0.5 and the label START 0.5; the line EACH SITE SETS ITS OWN above. |
| **Position and size (1080 × 1920)** | Cutoff line at x = 540, from y 650 to 870. Labels at y 560 and y 630. |
| **Background** | Standard backdrop. |
| **Movement** | The line draws on “point”; the label appears on “five”. |
| **Timing and easing** | Line: 0.3 s draw from “point”. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber: the number 0.5. |
| **Text overlays** | “EACH SITE SETS ITS OWN” · “START 0.5”. |
| **Transition out** | Fade out for the simulator. |
| **Sound** | Impact on “point”. |
| **Purpose** | Say that Google suggests 0.5 as a start and that sites set their own. |

## 28 · A simulator, not the site

**Time:** 2:00.77 → 2:08.75  (7.97 s)  
**Narration:** “But a score can be pushed. In twenty nineteen, researchers trained an AI agent to move and click in a simulator they built.”  
**Caption phrases:** But a score can | be pushed. | In twenty nineteen, | researchers trained an | AI agent to move | and click in a | simulator they built.

| | |
|---|---|
| **Objects on screen** | A tilted grid plane in 2.5D; a white agent dot travels a zigzag path across it to a cyan target square; labels 2019 and AGENT; SIMULATOR. |
| **Position and size (1080 × 1920)** | Plane centred at (540, 900), Proj scale 1.5, yaw −0.55, pitch 1.0. Target square 44 px. Labels at y 470 and 520. |
| **Background** | Standard backdrop. |
| **Movement** | The plane fades in during the scale's fade-out; the agent moves from “trained” to “built”; the target lights on “built”. |
| **Timing and easing** | Agent: ease-in-out 3.9 s. Plane fade: 0.5 s. |
| **Camera** | Slow camera-free view; the agent's path keeps the frame moving. |
| **Colour and emphasis** | White agent; cyan target; violet grid (the simulator). |
| **Text overlays** | “2019” · “AGENT” · “SIMULATOR”. |
| **Transition out** | Cross-fade back to the scale. |
| **Sound** | Data hum on “trained”; lock on “built”. |
| **Purpose** | Show what the 2019 study ran: an agent in a simulator it built. |

## 29 · About ninety-seven percent

**Time:** 2:08.75 → 2:15.37  (6.63 s)  
**Narration:** “It reached a score of point nine about ninety-seven percent of the time. The simulator isn't the live site.”  
**Caption phrases:** It reached a score | of point nine | about ninety-seven | percent of the time. | The simulator isn't | the live site.

| | |
|---|---|
| **Objects on screen** | The scale returns with the needle at 0.9; a large amber ABOUT 97%; a coral caveat SIMULATOR, NOT THE LIVE SITE. |
| **Position and size (1080 × 1920)** | ABOUT 97% at 150 px at y 1010. Caveat at y 1140. Needle at 0.9. |
| **Background** | Standard backdrop. |
| **Movement** | The needle settles from 1.0 to 0.9 on “point” and “nine”; the figure rises on “ninety-seven”; the caveat on “isn't”. |
| **Timing and easing** | Needle: ease-in-out 0.45 s. Figure: ease-out 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber for the number; coral for the caveat. |
| **Text overlays** | “ABOUT 97%” · “SIMULATOR, NOT THE LIVE SITE”. |
| **Transition out** | Zoom-out into the limits. |
| **Sound** | Impact on “ninety-seven”; deny on “isn't”. |
| **Purpose** | Give the figure its source and its limit in the same breath: a simulator, not the live site. |

## 30 · Thirteen months, three thousand six hundred

**Time:** 2:15.37 → 2:21.72  (6.35 s)  
**Narration:** “A twenty twenty-three study ran for thirteen months with more than thirty-six hundred people.”  
**Caption phrases:** A twenty twenty-three | study ran for | thirteen months | with more than | thirty-six hundred | people.

| | |
|---|---|
| **Objects on screen** | A timeline of thirteen amber blocks; a field of 3,600 small amber squares filling row by row; the hero figure 3,600+. |
| **Position and size (1080 × 1920)** | Timeline blocks 52 × 22 px at y 520. Dot field 780 × 420 px at (150, 600), 60 × 60 squares. Hero figure 150 px at (540, 1140). |
| **Background** | Standard backdrop. |
| **Movement** | Blocks light from “thirteen”; the field fills from “more” to “people”; the figure rises on “thirty-six”. |
| **Timing and easing** | Blocks: 35 ms apart. Field: linear from “more”. Figure: ease-out 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Amber: the study's numbers. |
| **Text overlays** | “13 MONTHS” · “3,600+”. |
| **Transition out** | Cross-fade to the authors' view. |
| **Sound** | Count on “thirteen”; long data tone on “more”. |
| **Purpose** | Put the study's scale on screen: thirteen months and more than 3,600 people. |

## 31 · The authors' view

**Time:** 2:21.72 → 2:28.60  (6.88 s)  
**Narration:** “Its authors judged the checkbox costly, with close to no security gain, and say it should be retired.”  
**Caption phrases:** Its authors judged | the checkbox costly, | with close to no | security gain, | and say it should | be retired.

| | |
|---|---|
| **Objects on screen** | A cyan checkbox with a coral COSTLY label; a violet security-gain bar almost empty, labelled CLOSE TO NONE; a coral cross over the box; RETIRE IT. |
| **Position and size (1080 × 1920)** | Box 210 px at (330, 760). Bar 330 × 26 px at (600, 730). Labels at y 600, 700, 820 and 1000. |
| **Background** | Standard backdrop. |
| **Movement** | The label THE AUTHORS' VIEW on “authors”; COSTLY on “costly”; the bar fills to a sliver on “close”; the cross draws on “say”; RETIRE IT on “retired”. |
| **Timing and easing** | Bar: 0.8 s fill (qualitative). Cross: 0.35 s draw. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan box; coral judgements; violet for the security measure. |
| **Text overlays** | “THE AUTHORS' VIEW” · “COSTLY” · “SECURITY GAIN” · “CLOSE TO NONE” · “RETIRE IT”. |
| **Transition out** | Cross-fade to the weights. |
| **Sound** | Deny on “costly”; slice on “say”; stamp on “retired”. |
| **Purpose** | Attribute the judgement to the authors and show it as theirs, not the narrator's. |

## 32 · Nobody outside Google knows the weights

**Time:** 2:28.60 → 2:35.10  (6.50 s)  
**Narration:** “Nobody outside Google knows how the signals are weighted. So every study tests from the outside.”  
**Caption phrases:** Nobody outside Google | knows how the signals | are weighted. | So every study | tests from the | outside.

| | |
|---|---|
| **Objects on screen** | A sealed dark box with a coral question mark; eight violet dots orbiting it; six white probes approaching from outside; a pill WEIGHTS NOT PUBLISHED. |
| **Position and size (1080 × 1920)** | Box 230 px at (540, 720). Orbit radius 210 px. Probes from radius 430 to 300 px. Label OUTSIDE at y 470; pill at y 1080. |
| **Background** | Standard backdrop. |
| **Movement** | The orbit turns slowly throughout; the probes travel in from “tests” to “outside”; the pill appears on “weighted”. |
| **Timing and easing** | Probes: ease-in-out, staggered 50 ms. Orbit: 0.22 rad per second. |
| **Camera** | Slow orbit keeps the frame alive. |
| **Colour and emphasis** | Violet: the signals; coral: not published; white: the outside probes. |
| **Text overlays** | “OUTSIDE” · “WEIGHTS NOT PUBLISHED”. |
| **Transition out** | Zoom-out into the takeaway. |
| **Sound** | Deny on “weighted”; tick per probe. |
| **Purpose** | State the method's limit: every study tests from outside the system. |

## 33 · The last step

**Time:** 2:35.10 → 2:36.98  (1.88 s)  
**Narration:** “So the tap is the last step,”  
**Caption phrases:** So the tap is | the last step,

| | |
|---|---|
| **Objects on screen** | The widget from the hook, with its box still unticked; the cursor lands on the box; the label LAST STEP above it. |
| **Position and size (1080 × 1920)** | Widget 780 × 190 px at (150, 706). LAST STEP label at (300, 672). |
| **Background** | Standard backdrop. |
| **Movement** | The cursor lands on the box on “tap”; the LAST STEP label appears on “step”. |
| **Timing and easing** | Cursor: ease-out. Ring: 0.55 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Cyan path and box; the tap is the last step. |
| **Text overlays** | “LAST STEP”. |
| **Transition out** | Cross-fade to the test. |
| **Sound** | Lock on “tap”; blip on “step”. |
| **Purpose** | The callback: the tap as the final step. |

## 34 · The whole path is the test

**Time:** 2:36.98 → 2:39.36  (2.38 s)  
**Narration:** “not the test. It cares how”  
**Caption phrases:** not the test. | It cares how you

| | |
|---|---|
| **Objects on screen** | The full trail lights cyan from its start; the label THE TEST beside the middle of the path. |
| **Position and size (1080 × 1920)** | Trail from (118, 1126) to the box. Label at the path's middle plus (40, −30). |
| **Background** | Standard backdrop. |
| **Movement** | The trail lights up on “not”; THE TEST appears on “test”. |
| **Timing and easing** | Trail light-up: 0.5 s from “not”. Label: ease-out 0.3 s. |
| **Camera** | Sheen along the path keeps it moving. |
| **Colour and emphasis** | Cyan path; white label. |
| **Text overlays** | “THE TEST”. |
| **Transition out** | Cross-fade to the takeaway. |
| **Sound** | Swell on “test”. |
| **Purpose** | The argument in one picture: the test is the whole path, not the tap. |

## 35 · How you got there

**Time:** 2:39.36 → 2:43.72  (4.37 s)  
**Narration:** “you got there.”  
**Caption phrases:** got there.

| | |
|---|---|
| **Objects on screen** | The widget's box ticks mint; the headline HOW YOU GOT THERE; the trail keeps shimmering. |
| **Position and size (1080 × 1920)** | Headline 72 px at y 560. Box ticks at “got”. Trail and widget as before. |
| **Background** | Standard backdrop; the end card keeps moving to the last frame. |
| **Movement** | The tick draws on “got”; the headline rises on “there”; the sheen continues to the end. |
| **Timing and easing** | Tick: ease-out 0.4 s. Headline: ease-out 0.3 s. |
| **Camera** | Static camera; the sheen and the glow keep the last 2.5 s alive. |
| **Colour and emphasis** | Mint tick; white headline. |
| **Text overlays** | “HOW YOU GOT THERE”. |
| **Transition out** | End of video. |
| **Sound** | Chime on “got”; impact on “there”. |
| **Purpose** | The takeaway, still moving on the end card: the tap is the last step. |
