# Visual Storyboard — “Your painkiller doesn't know where it hurts”

17 sequences · 93.14 s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 7-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 800 px |
| Bottom UI band | 1470–1920 | Backdrop and non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Look.** `anatomy-plate` (light theme) — Warm paper, ink-blue and vermilion, serif headlines, line-drawn anatomy: body chemistry told like an old field guide. Medicine, the body, how a drug moves through it.

**Backdrop.** paper with fixed grain and fibres and a slow drifting colour wash; background gradient #F7F1E5 → #F3EBDB → #EDE3CF.

**Colour language.** Ink-blue = the drug (ibuprofen, the tablet) and its route through the blood · Vermilion = the enzyme factories (COX), the prostaglandin marks and the numbers · Violet = the organs and the blood · Red = the costs, the limits and negation · Green = the stomach's protective lining (and relief) · Ink = the body outline and the words being said now.

**Type.** Fraunces for headlines, Lora for glosses and body, Courier Prime for labels and counters. Smallest label 19–22 px; primary labels ≥ 24 px.

**Captions.** Fraunces 800, 74 px, centred on y 1350, 1–5 words per phrase (66 phrases, 26 of them two-line); the spoken word takes its role colour and an underline draws in beneath it. Words not yet spoken are dimmed. Position never changes.

**Illustrations.** 3 subjects from Microsoft Fluent Emoji (MIT licence), line set, tint: brain, pill, warning.

**Scene changes.** 0.7 s, default `slideLeft`; each scene can choose its own arrival (zoom into a point, pull back, pan, slide, cut, flash). The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · The tablet flies to the ankle

**Time:** 0:00.00 → 0:01.83  (1.83 s)  
**Narration:** “Your painkiller knows where it hurts.”  
**Caption phrases:** Your painkiller | knows where it hurts.

| | |
|---|---|
| **Objects on screen** | A line-drawn body in ink; a blue tablet; a crosshair ring with four ticks. |
| **Position and size (1080 × 1920)** | Body centred on x 540, from y 406 (head) to y 1204 (feet). Ankle at (486, 1168). Ring radius 50 px. |
| **Background** | Paper backdrop with a faint dashed loop (the bloodstream) around the body. |
| **Movement** | The tablet flies in a straight line from the top right to the ankle; the crosshair locks on the ankle with a small overshoot. |
| **Timing and easing** | Ease-in-out 0.45 s for the flight; ease-out-back 0.3 s for the lock; the ring breathes while held. |
| **Camera** | Static camera. |
| **Colour and emphasis** | Ink-blue tablet, ink crosshair. |
| **Text overlays** | THE MYTH (top left, vermilion mono). |
| **Transition out** | Cross-fade into the next sequence. |
| **Sound** | A whoosh on the flight, a lock click on “hurts”. |
| **Purpose** | Draw the myth the viewer already believes, as a picture, before it is challenged. |

## 02 · It doesn't: the crosshair shatters

**Time:** 0:01.83 → 0:03.78  (1.95 s)  
**Narration:** “It doesn't.”  
**Caption phrases:** It doesn't.

| | |
|---|---|
| **Objects on screen** | The same crosshair breaks into eight ticks; eight blue molecules leave the ankle and settle on the loop. |
| **Position and size (1080 × 1920)** | Ticks run from radius 90 to 180 px around the ankle; molecules end on the loop at 1/8 intervals. |
| **Background** | Paper backdrop, faint loop. |
| **Movement** | The ticks fly outward on “doesn't”; the molecules spread along the loop; the tablet fades out. |
| **Timing and easing** | Ease-out-expo 0.6 s from the cue. |
| **Camera** | Static. |
| **Colour and emphasis** | Red impact on the negation “doesn't”; ink ticks fade as they leave. |
| **Text overlays** | “doesn't” is highlighted red in the caption. |
| **Transition out** | Cross-fade. |
| **Sound** | A riser before, an impact and a deny buzz on “doesn't”. |
| **Purpose** | The myth breaks on the cue word. The crosshair is the picture the viewer is wrong about. |

## 03 · The imagined route

**Time:** 0:03.78 → 0:08.22  (4.43 s)  
**Narration:** “It seems to. You swallow one, the ankle feels better, so the”  
**Caption phrases:** It seems to. | You swallow one, | the ankle feels better, | so the pill must

| | |
|---|---|
| **Objects on screen** | The body; the crosshair locked on the ankle; a blue tablet at the top right. |
| **Position and size (1080 × 1920)** | Tablet at (800, 586). Route is a quadratic curve to the ankle, control point (720, 760). |
| **Background** | Paper backdrop; the loop is faint. |
| **Movement** | A dashed route draws itself from the tablet to the ankle while the sentence is spoken. |
| **Timing and easing** | Ease-in-out over the sentence; the tablet pops in on “swallow”. |
| **Camera** | Static camera. |
| **Colour and emphasis** | Ink-blue dashed route, ink crosshair. |
| **Text overlays** | WHY IT SEEMS TRUE (top left). |
| **Transition out** | Slide left. |
| **Sound** | A pop when the tablet appears; a whoosh as the route draws. |
| **Purpose** | Show the explanation the viewer has in their head: the pill must have gone to the ankle. |

## 04 · It feels better

**Time:** 0:08.22 → 0:09.90  (1.68 s)  
**Narration:** “pill must have gone there.”  
**Caption phrases:** have gone there.

| | |
|---|---|
| **Objects on screen** | The same picture; the route is complete; a green check mark beside the ankle. |
| **Position and size (1080 × 1920)** | Check 66 px, offset (+84, −70) from the ankle. |
| **Background** | Paper backdrop. |
| **Movement** | The check draws in with an overshoot on “feels better”. |
| **Timing and easing** | Ease-out-back 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Good green = relief. |
| **Text overlays** | WHY IT SEEMS TRUE. |
| **Transition out** | Zoom out to the whole body. |
| **Sound** | A chime on the check. |
| **Purpose** | The evidence the myth feeds on: the ankle improves, so the route looks real. |

## 05 · The tablet dissolves into the blood

**Time:** 0:09.90 → 0:13.34  (3.45 s)  
**Narration:** “The pill dissolves and passes into your blood.”  
**Caption phrases:** The pill dissolves | and passes into your blood.

| | |
|---|---|
| **Objects on screen** | The body with purple stomach and kidney outlines; the tablet dissolving at the top right; sixteen blue molecules spreading onto the loop. |
| **Position and size (1080 × 1920)** | Molecules from (800, 586) to their loop positions; the loop is at a = 300, b = 414 about (540, 796). |
| **Background** | Paper backdrop with a faint loop, brightening. |
| **Movement** | Molecules spread from the dissolving tablet and then ride the loop; a protein ring appears on every third molecule. |
| **Timing and easing** | Ease-in-out 0.35 s per molecule, staggered 0.02 s; loop speed 0.035 cycles per second. |
| **Camera** | Zoom out from the ankle (the scene starts close and pulls back). |
| **Colour and emphasis** | Blue molecules, violet proteins and organs. |
| **Text overlays** | THE FLOOD (top left). |
| **Transition out** | Zoom out (transition). |
| **Sound** | A splash as it dissolves; a stamp as each protein sticks. |
| **Purpose** | Show the tablet's content becoming part of the bloodstream, not travelling to the ankle. |

## 06 · Its level peaks

**Time:** 0:13.34 → 0:17.82  (4.48 s)  
**Narration:** “Its level peaks within one to two hours. It sticks to blood proteins,”  
**Caption phrases:** Its level peaks | within one to two hours. | It sticks to blood proteins,

| | |
|---|---|
| **Objects on screen** | A small level curve in the top left: an axis and a bell-shaped curve peaking at 1–2 hours. |
| **Position and size (1080 × 1920)** | Curve x 90–270, baseline y 600; peak dot at (180, 490); label above it. |
| **Background** | Paper backdrop. |
| **Movement** | The curve draws left to right; the peak dot pops at “peaks”. |
| **Timing and easing** | Ease-in-out over the sentence. |
| **Camera** | Static. |
| **Colour and emphasis** | Vermilion curve and label (numbers are vermilion). |
| **Text overlays** | “1–2 HOURS” in mono above the peak. |
| **Transition out** | Cross-fade. |
| **Sound** | A tick as the curve starts; a blip on the peak. |
| **Purpose** | The peak time from the label, as a number on screen. |

## 07 · One loop round the whole body

**Time:** 0:17.82 → 0:24.03  (6.21 s)  
**Narration:** “so it mostly stays in the bloodstream. Blood reaches every organ, and the drug travels with it.”  
**Caption phrases:** so it mostly stays | in the bloodstream. | Blood reaches every organ, | and the drug | travels with it.

| | |
|---|---|
| **Objects on screen** | The loop band (blue, translucent) round the body; molecules flowing; the organs pulse in turn. |
| **Position and size (1080 × 1920)** | Band width 28 px along the loop. Pulses at the stomach, kidneys, head and ankle. |
| **Background** | Paper backdrop. |
| **Movement** | The band fades in on “so it mostly stays”; each organ pulses as the drug reaches it. |
| **Timing and easing** | Pulses 0.5 s, attack 0.1 s; the band fades over 0.4 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet pulses on organs; blue band. |
| **Text overlays** | THE FLOOD. |
| **Transition out** | Zoom into the ankle (the next scene grows out of it). |
| **Sound** | A thump on each organ as it lights. |
| **Purpose** | Show that the drug reaches every organ in one loop, and that it mostly stays in the blood. |

## 08 · COX-2 switches on in hurt tissue

**Time:** 0:24.03 → 0:27.86  (3.82 s)  
**Narration:** “Hurt tissue switches on an enzyme called COX-2. It makes”  
**Caption phrases:** Hurt tissue switches on | an enzyme called COX-2. | It makes prostaglandins.

| | |
|---|---|
| **Objects on screen** | The ankle, close up; a warm vermilion glow; three factories (COX-2) appearing; twelve vermilion marks thrown off them. |
| **Position and size (1080 × 1920)** | Camera zoom 1.9 centred on the ankle, easing to 1.35. Factories 46 px wide at (466, 1110), (506, 1110), (486, 1150). |
| **Background** | Paper backdrop. |
| **Movement** | The glow grows; the factories switch on in turn; the marks spread from the factories on “prostaglandins”. |
| **Timing and easing** | Ease-out 0.3 s per factory, staggered 0.06 s; marks ease out over 0.8 s. |
| **Camera** | Zoom in: 1.9 → 1.35 over the sentence. |
| **Colour and emphasis** | Vermilion factories and marks; warm glow. |
| **Text overlays** | THE FACTORY (top left); “COX-2” label beside the factories. |
| **Transition out** | Cross-fade. |
| **Sound** | A blip on COX-2; a pop when the marks are thrown. |
| **Purpose** | Show the enzyme that the injury switches on, and what it makes. |

## 09 · Prostaglandins sensitise the nerves

**Time:** 0:27.86 → 0:33.74  (5.88 s)  
**Narration:** “prostaglandins. They make nerves more sensitive to the chemicals injury releases.”  
**Caption phrases:** They make nerves more sensitive | to the chemicals | injury releases.

| | |
|---|---|
| **Objects on screen** | The same close-up; four violet nerve paths around the ankle thicken. |
| **Position and size (1080 × 1920)** | Nerve paths about 90 px long around the ankle; widths 2 → 5.5 px. |
| **Background** | Paper backdrop. |
| **Movement** | The nerves draw in, then thicken on “sensitive”. |
| **Timing and easing** | Ease-out 0.4 s; the thickening ease-in-out 0.4 s. |
| **Camera** | Camera held at 1.35 on the ankle. |
| **Colour and emphasis** | Violet = nerves (the secondary family). |
| **Text overlays** | THE FACTORY. |
| **Transition out** | Cross-fade. |
| **Sound** | A tick on “nerves”; a thump on “sensitive”. |
| **Purpose** | The mechanism of pain amplification, drawn as thicker nerves, not as a claim about pain alone. |

## 10 · Blocked everywhere at once

**Time:** 0:33.74 → 0:38.72  (4.98 s)  
**Narration:** “Ibuprofen blocks both versions of that enzyme, everywhere it works. The sore”  
**Caption phrases:** Ibuprofen blocks both | versions of that enzyme, | everywhere it works. | The sore ankle is where

| | |
|---|---|
| **Objects on screen** | Six blue molecules converge on the ankle factories; the camera pulls out; every factory in the body gets a blue block bar on the same beat. |
| **Position and size (1080 × 1920)** | Camera zoom 1.35 → 1.0, target from the ankle to the body centre (540, 800). Bars 1.7 × factory width. |
| **Background** | Paper backdrop. |
| **Movement** | Molecules move in on “ibuprofen”; the camera pulls out during “blocks”; all bars draw on at once on “blocks”. |
| **Timing and easing** | Ease-in-out 0.9 s for the pull-out; bars ease-out 0.22 s from the cue. |
| **Camera** | Zoom out (pull back) to show everywhere. |
| **Colour and emphasis** | Blue bars = the block; vermilion factories. |
| **Text overlays** | BLOCKED (top left, blue) appears on “blocks”. |
| **Transition out** | Cross-fade. |
| **Sound** | A deny buzz and an impact on the cue. |
| **Purpose** | The key claim: the block is body-wide and simultaneous, shown at once. |

## 11 · The busiest factory loses most

**Time:** 0:38.72 → 0:43.37  (4.65 s)  
**Narration:** “ankle is where that enzyme is busiest, so the block removes the most there.”  
**Caption phrases:** that enzyme is busiest, | so the block removes | the most there.

| | |
|---|---|
| **Objects on screen** | The ankle close up again; twelve marks; most of the ankle's marks drift back into their factories and disappear; the stomach has none in frame. |
| **Position and size (1080 × 1920)** | Camera zoom 1.0 → 1.28 onto the ankle. Marks drift 85 % of the way back for indices 3–11. |
| **Background** | Paper backdrop. |
| **Movement** | The zoom starts on “sore ankle”; the marks converge and fade on “removes the most there”. |
| **Timing and easing** | Ease-in-out 2.6 s for the zoom; marks fade over 0.4 s from the cue. |
| **Camera** | Zoom in on the ankle. |
| **Colour and emphasis** | Vermilion marks fading; blue bars stay. |
| **Text overlays** | THE FACTORY; BLOCKED. |
| **Transition out** | Fade to ink (the cost begins). |
| **Sound** | A whoosh as the zoom starts; a whoosh on “removes”. |
| **Purpose** | Explain why the sore spot looks like the target: where the enzyme is busiest, the block removes the most. This is an illustration of the inference, not data. |

## 12 · The stomach's shield thins and cracks

**Time:** 0:43.37 → 0:55.18  (11.80 s)  
**Narration:** “The same block runs everywhere. Your stomach makes its own prostaglandins to help guard its lining. Block it, and ulcers and bleeding can happen. The label calls them serious. Your”  
**Caption phrases:** The same block | runs everywhere. | Your stomach makes its own | prostaglandins to help | guard its lining. | Block it, and ulcers | and bleeding can happen. | The label calls them | serious. | Your kidneys use

| | |
|---|---|
| **Objects on screen** | The body with its factories dimmed and blocked; a purple stomach outline with a green protective arc on its left. |
| **Position and size (1080 × 1920)** | Stomach outline J-shape at (492–552, 696–774). Arc radius 52 px at (521, 736). |
| **Background** | Paper backdrop. |
| **Movement** | The arc draws in on “stomach”; on “block it” it thins from 6 px to 1.6 px and turns red; a red crack appears on “ulcers”; a red drop falls on “bleeding”. |
| **Timing and easing** | Arc ease-out 0.6 s; colour blend 0.4 s from the cue; crack 0.3 s; drop falls 26 px over 0.7 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Green = the protective lining, turning red = the cost. |
| **Text overlays** | THE COST (top left, red). |
| **Transition out** | Cross-fade. |
| **Sound** | A deny buzz on “block it”; a rip on “ulcers”. |
| **Purpose** | The cost: the same block that quiets pain takes away some of the stomach's protection. |

## 13 · The kidney flow slows

**Time:** 0:55.18 → 1:02.48  (7.30 s)  
**Narration:** “kidneys use prostaglandins to keep blood flowing. In people with kidney problems, ibuprofen can cut that flow.”  
**Caption phrases:** prostaglandins to keep | blood flowing. | In people with | kidney problems, | ibuprofen can cut that flow.

| | |
|---|---|
| **Objects on screen** | Two kidney outlines (violet, turning red) with flow dots moving in from the midline; a warning icon with a callout to the stomach. |
| **Position and size (1080 × 1920)** | Kidneys at (500, 842) and (580, 842). Flow path from (540, 760). Warning icon 92 px at (300, 690). |
| **Background** | Paper backdrop. |
| **Movement** | Flow dots move in from the midline; they slow after “cut”; the outlines turn red; the warning draws in on “serious”. |
| **Timing and easing** | Flow phase slows over 0.5 s after the cue, to 25 % of speed; the outline colour blends over 0.3 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Violet flow; red warning. |
| **Text overlays** | “FLOW DOWN” label (red) after “cut”. |
| **Transition out** | Slide. |
| **Sound** | A pop on the kidneys; a stall tone on “serious”; a deny buzz on “cut”. |
| **Purpose** | The second cost: blood flow to the kidneys falls in people with kidney problems, per the label. |

## 14 · Not every painkiller

**Time:** 1:02.48 → 1:16.66  (14.18 s)  
**Narration:** “Not every painkiller plays this game. Paracetamol, or acetaminophen, has almost no anti-inflammatory effect. It works mostly in the brain and spinal cord. Scientists still argue about exactly how.”  
**Caption phrases:** Not every painkiller | plays this game. | Paracetamol, | or acetaminophen, | has almost no | anti-inflammatory effect. | It works mostly in | the brain and spinal cord. | Scientists still argue | about exactly how.

| | |
|---|---|
| **Objects on screen** | The factories dim to a quarter; a brain drawn on the head; a dashed spinal line; two blue tablets (paracetamol bottom left, opioids bottom right) with dashed routes to the brain. |
| **Position and size (1080 × 1920)** | Brain 150 px at (540, 440). Tablets 110 px at (170, 1040) and (840, 1040). Labels in mono at y 1100. |
| **Background** | Paper backdrop. |
| **Movement** | The factories fade on “not”; the brain draws on; the spinal line draws in; the paracetamol tablet and route appear on “paracetamol”. |
| **Timing and easing** | Factories ease over 0.5 s; brain pops in over 0.5 s; routes draw over 0.6 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Blue = the drugs; violet = the brain; red title = a limit. |
| **Text overlays** | WHERE THE MYTH BREAKS (top left, red); “PARACETAMOL” and “OPIOIDS” labels. |
| **Transition out** | Slide left. |
| **Sound** | A deny buzz on “not”; a pop on each tablet; a chime on the brain. |
| **Purpose** | The limit of the picture: other painkillers reach the nervous system instead of the factories. |

## 15 · Scientists still argue

**Time:** 1:16.66 → 1:20.41  (3.75 s)  
**Narration:** “Opioids like morphine work largely through the nervous system.”  
**Caption phrases:** Opioids like morphine | work largely through | the nervous system.

| | |
|---|---|
| **Objects on screen** | The same brain and tablets; the opioid route draws to the brain; a large blue question mark at the right. |
| **Position and size (1080 × 1920)** | Question mark 150 px at (780, 640). Opioid route to the brain. |
| **Background** | Paper backdrop. |
| **Movement** | The opioid route draws on “opioids”; the question mark fades in on “scientists”; the brain glows on “nervous system”. |
| **Timing and easing** | Routes ease 0.6 s; the question mark fades 0.5 s; the glow fades 0.5 s. |
| **Camera** | Static. |
| **Colour and emphasis** | Blue question mark = what is still argued over. |
| **Text overlays** | WHERE THE MYTH BREAKS. |
| **Transition out** | Zoom out to the whole body. |
| **Sound** | A blip on “scientists”; a swell on “nervous system”. |
| **Purpose** | Honest uncertainty: the mechanism is still debated; opioids act through the nervous system. |

## 16 · The crosshair, crossed out

**Time:** 1:20.41 → 1:27.55  (7.14 s)  
**Narration:** “So it doesn't know where your pain is. It doesn't need to. The sore spot is just the busiest factory, and the pill”  
**Caption phrases:** So it doesn't know | where your pain is. | It doesn't need to. | The sore spot is just | the busiest factory, | and the pill shuts down

| | |
|---|---|
| **Objects on screen** | The body fades to 80 %; the ankle's crosshair is crossed out in red; the ankle factories glow when “busiest” is spoken; marks come back. |
| **Position and size (1080 × 1920)** | Cross 110 px at the ankle, red, drawn on from the cue. Glow 100 px. |
| **Background** | Paper backdrop; a faint loop with molecules. |
| **Movement** | The cross draws on “doesn't know”; the factories glow on “busiest”; marks rise on the same cue. |
| **Timing and easing** | Cross ease-out 0.5 s; glow ease-in-out 0.4 s; marks ease-out 0.7 s, staggered 0.02 s. |
| **Camera** | Zoom out (the transition pulls back to the whole body). |
| **Colour and emphasis** | Red cross = negation; vermilion factories. |
| **Text overlays** | THE TRUTH (top left). |
| **Transition out** | Cross-fade. |
| **Sound** | A deny buzz on “doesn't”; a lock on “busiest”. |
| **Purpose** | Return to the opening picture and answer it: the pill does not need to know. |

## 17 · The block everywhere, then the end card

**Time:** 1:27.55 → 1:33.14  (5.59 s)  
**Narration:** “shuts down every factory it reaches.”  
**Caption phrases:** every factory it reaches.

| | |
|---|---|
| **Objects on screen** | Blue bars on every factory at once; the body fades to 20 % as the end card appears; “READ THE LABEL.” and a pharmacist line in the centre. |
| **Position and size (1080 × 1920)** | End card: headline 92 px at (540, 880); subline 34 px at (540, 960), max width 820 px. |
| **Background** | Paper backdrop with the drug molecules still moving on the loop. |
| **Movement** | Bars draw on at “shuts”; the body fades and the end card fades in after the last word. |
| **Timing and easing** | Bars ease-out 0.25 s; the body fade and the card fade ease-out 0.5 s. |
| **Camera** | Static after the zoom. |
| **Colour and emphasis** | Ink headline; dim subline. |
| **Text overlays** | THE TRUTH; end card text (not narrated). |
| **Transition out** | End of video. |
| **Sound** | A chime after the last word; the music resolves to D major. |
| **Purpose** | Leave the viewer with the answer and the one safety action the label supports: read it, and ask a pharmacist about the stomach and kidneys. |
