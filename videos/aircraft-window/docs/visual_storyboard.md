# Visual Storyboard — “The tiny hole in aeroplane windows”

6 sequences · 40.78 s · 1080 × 1920 · 30 fps. The look, story shape and pacing were decided in docs/creative_brief.md. Timestamps are taken from the recorded narration; the animation code reads the same word timings, so picture and voice cannot drift apart.

## Conventions that apply to every sequence

**Canvas and safe areas.** Designed natively for 9:16; nothing is cropped from a wider layout.

| Zone | y range | Use |
|---|---|---|
| Top UI band | 0–270 | Backdrop only |
| Chapter bar | 286–340 | 4-segment progress bar (y 292) and chapter label (y 334) |
| Diagram zone | 372–1210 | All essential graphics, x 70–1010 |
| Caption band | 1250–1450 | Burned-in captions, centred on x 540, y 1350, max width 720 px |
| Bottom UI band | 1470–1920 | Backdrop and non-essential spill only |

Below y 900, numbers and names stay left of x ≈ 910, where both platforms stack their action buttons; only repeated or decorative elements extend further right.

**Look.** `cabin-daylight` (light theme) — Quiet aircraft cabin daylight, teal air and amber mechanical load.

**Backdrop.** the palette's vertical gradient alone; background gradient #F1F3F2 → #E6EEEF → #D5E0E4.

**Colour language.** Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure.

**Type.** Space Grotesk for headlines, DM Sans for glosses and body, IBM Plex Mono for labels and counters. Smallest label 19–22 px; primary labels ≥ 24 px.

**Captions.** Space Grotesk 800, 68 px, centred on y 1350, 1–5 words per phrase (36 phrases, 6 of them two-line); the spoken word takes its role colour and an underline draws in beneath it. Words not yet spoken are dimmed. Position never changes.

**Scene changes.** 0.6 s, default `fade`; each scene can choose its own arrival (zoom into a point, pull back, pan, slide, cut, flash). The incoming scene is already drawn and moving before the outgoing one has gone.

---

## 01 · Passenger question

**Time:** 0:00.00 → 0:04.44  (4.44 s)  
**Narration:** “At thirty-five thousand feet, why put a hole in a pressurized window?”  
**Caption phrases:** At thirty-five | thousand feet, | why put a hole | in a pressurized | window?

| | |
|---|---|
| **Objects on screen** | An ordinary rounded window, seen through the scratch protector; push toward the hole. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | Question and cruise setting |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Passenger question |

## 02 · Reveal layers

**Time:** 0:04.44 → 0:15.32  (10.88 s)  
**Narration:** “In this Airbus design, look through the scratch pane you can touch. Behind it, a tiny vent pierces the inner windowpane. Beyond that is the outer windowpane.”  
**Caption phrases:** In this Airbus design, | look through the | scratch pane you can | touch. | Behind it, | a tiny vent pierces | the inner windowpane. | Beyond that is the | outer windowpane.

| | |
|---|---|
| **Objects on screen** | The lit assembly rotates and separates into three real extruded panes. Physical leaders stay attached. Only the inner pane has a vent. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | Scratch / Inner / Outer |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Reveal layers |

## 03 · Air enters gap

**Time:** 0:15.32 → 0:26.21  (10.89 s)  
**Narration:** “The vent lets cabin air into the gap between the structural panes. It is not a hole to the outside. That puts cabin pressure on both sides of the inner pane. The outer pane”  
**Caption phrases:** The vent lets cabin | air into the gap | between the structural | panes. | It is not a | hole to the outside. | That puts cabin | pressure on both sides | of the inner pane. | The outer pane

| | |
|---|---|
| **Objects on screen** | A teal path crosses the inner vent and terminates inside the structural gap. Outer pane remains intact. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | Cabin air → gap |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Air enters gap |

## 04 · Normal load

**Time:** 0:26.21 → 0:28.33  (2.12 s)  
**Narration:** “normally carries the pressure difference.”  
**Caption phrases:** normally carries the | pressure difference.

| | |
|---|---|
| **Objects on screen** | Airflow recedes; a distinct amber pressure-load graphic identifies the outer pane. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | Normal load → outer |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Normal load |

## 05 · Backup condition

**Time:** 0:28.33 → 0:33.87  (5.54 s)  
**Narration:** “If the outer windowpane fails, the inner windowpane can take the pressure load. The”  
**Caption phrases:** If the outer | windowpane fails, | the inner windowpane | can take the pressure | load. | The scratch pane

| | |
|---|---|
| **Objects on screen** | Explicit hypothetical: the outer pane becomes a ghost outline, then the pressure-load annotation moves to the inner pane. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | If the outer pane fails |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Backup condition |

## 06 · Return to cabin

**Time:** 0:33.87 → 0:40.78  (6.92 s)  
**Narration:** “scratch pane protects against passenger contact. Three layers. Different jobs.”  
**Caption phrases:** protects against | passenger contact. | Three layers. | Different jobs.

| | |
|---|---|
| **Objects on screen** | The same three panes recombine, returning to the passenger view. Protector role and final three-layer takeaway. |
| **Position and size (1080 × 1920)** | Model x 240–840, y 650–1110; leaders above. |
| **Background** | Pale cabin daylight |
| **Movement** | Absolute-time camera orbit and smooth separation. |
| **Timing and easing** | Word anchors with cubic easing. |
| **Camera** | Perspective camera, slow continuous movement. |
| **Colour and emphasis** | Teal: cabin air; amber: differential-pressure load; blue: structural acrylic; grey: scratch protector; muted red: hypothetical failure. |
| **Text overlays** | Three layers. Different jobs. |
| **Transition out** | Soft fade / same model continuation |
| **Sound** | Quiet original filtered-air ambience; no effects. |
| **Purpose** | Return to cabin |
