<!-- Authored per video. `lockstep report` inserts this file into docs/production_report.md
     after the measured sections. Keep the four headings; write what is true for this video. -->

## Technical accuracy review

How the claims were checked: every number and factual claim traces to `docs/sources.md`. The full
pages could not be opened in this session (a page fetch was refused by the session's permission
check), so every claim was checked against search-engine excerpts of the page or paper, not full
text. Rows marked "excerpt" below are in that state. Rows marked "paraphrase" are the excerpt's
wording, not the page's.

| On screen / spoken | Status |
|---|---|
| "In 2013, Google said its risk analysis covers everything you do around a challenge" | Excerpt of Google's 2013 post (paraphrase). Labelled as Google's description. |
| "In 2014, the checkbox arrived, and many people passed with one click" | Excerpt of Google's 2014 launch post (paraphrase). |
| "If it can't tell, you get a puzzle" | Excerpt of the 2014 post (falls back to a puzzle when unsure) and of a 2021 survey. |
| "Google doesn't publish the full list" / "Google doesn't say" | No full signal list or weights found in the excerpts of Google's pages. Stated as not published by Google. |
| "A 2021 survey describes the checkbox recording cursor movement, where you click, and how long the pointer hovers" | Survey's description (secondhand). On screen: "SURVEY'S DESCRIPTION, NOT GOOGLE". |
| "Google's own FAQ calls a cookie essential" | FAQ excerpt (paraphrase): the `_GRECAPTCHA` cookie is essential and supports the risk analysis. |
| "Version three has no checkbox" / "one means very likely a good interaction, zero means very likely a bot" | v3 documentation excerpt; the quoted phrasing was confirmed in the excerpt. |
| "Google suggests starting at point five" | v3 documentation excerpt (starting cutoff 0.5). Labelled "sites tune their own". |
| "A real hand never moves at one steady speed … a smooth, bell-shaped curve of speed" / "In 1985, Flash and Hogan modeled" | Citation confirmed in several later reference lists; the 1985 paper itself was not read. The bell profile is attributed to this work by a later J Neurosci paper. Presented as a model of human reaching, not as a claim about reCAPTCHA. |
| "One published detector checks cursor paths against a model like that" | Abstract excerpt of BeCAPTCHA-Mouse. On screen: "TRAINED ON PUZZLE DRAGS". The name is shown on screen, not spoken. |
| "In a 2024 study of reCAPTCHA version two, any cursor movement cut the number of puzzles needed to pass" | Excerpts of the paper's tables and text. On screen: "ILLUSTRATIVE, NOT TO SCALE" for the two-column picture. |
| "Straight paths and curved ones were not significantly different" (p = 0.57) | Same paper, from the excerpt (t = 0.58, p = 0.57). Not checked in the full PDF. |
| "A 2024 study reports that cookies and browsing history carry substantial weight" | The authors' own report, from the excerpt. On screen: "REPORTED BY RESEARCHERS". |
| "Browsing history is what researchers report. Google hasn't confirmed it." | No Google statement confirming browsing history was found in the excerpts checked. On screen: "GOOGLE: NOT CONFIRMED". |
| "In 2019, researchers trained an AI agent … a score of point nine about ninety-seven percent of the time" | Abstract excerpt (97.4% on a 100 × 100 grid, 96.7% on 1000 × 1000). On screen: "SIMULATOR, NOT THE LIVE SITE". |
| "A 2023 study ran for thirteen months with more than thirty-six hundred people" | Abstract excerpt (13-month live study, more than 3,600 participants, one large public university). |
| "Its authors judged the checkbox costly, with close to no security gain, and say it should be retired" | The authors' own judgement, from the abstract excerpt. On screen: "THE AUTHORS' VIEW". |

Numbers on screen, all traced in `docs/sources.md`: 2013, 2014, 2019, 2021, 2023, 2024, 1985 (dates);
0.0 to 1.0 and 0.5 (the v3 scale and suggested cutoff); about 97% and 97.4% / 96.7% (simulator);
3,600+ and 13 months (study); p = 0.57 (2024 paper). "13 MONTHS" and "3,600+" are the study's figures.

Simplifications, stated on screen where they matter: the checkbox is reCAPTCHA v2's widget and v3 is
shown as a score with no checkbox; Google's list of signals and their weights is described as not
published; "wobble" is shown as a question, because no source measures micro-wobble and the 2024
test found that the movement mattered and the path's shape did not.

## Defects found during QA and fixed

Found by reading the contact sheets and full-size stills, and by `scan` and `meta`.

| Found | Cause | Fix |
|---|---|---|
| The signal ring crossed the headline "AROUND THE CHALLENGE" (old-test scene) | Ring radius and headline position were set independently | Card moved to the centre line; ring radius reduced; headline placed above the ring |
| The crossed-out checkbox stayed on screen for the rest of the score scene, over the scale | The cross was drawn at constant progress, not faded | The cross fades out with the box, before the scale appears |
| "NO CHECKBOX" stayed on screen beside "ABOUT 97%" | The label had no end | Fades out before the score scale |
| "VERSION 3" overlapped "2019" (simulator section) | Two headlines at the same position | The version headline fades before the simulator section |
| "START 0.5" overlapped "EACH SITE SETS ITS OWN" | Both at the same height | Labels separated; the cutoff labels now have their own window |
| The cutoff labels came back during the "point nine" section | They were gated by the scale's visibility | Gated to their own window, from the checkbox to "but" |
| A nearly empty frame at the score section's handoff (about 121 s) | The simulator faded in after the scale had gone | The two fades now overlap |
| "THE TEST" label was clipped at the left edge (takeaway scene) | Label centred on a point too far left | Left-aligned to the right of the path |
| "HOW YOU GOT THERE" ran almost edge to edge | 88 px headline | Reduced to 72 px |
| The recogniser heard "reCAPTCHA" as "Ray Capcha" | Default reading of the brand name | IPA override on the narration (check-voice now matches it) |
| The recogniser heard "BeCAPTCHA-Mouse" as "B-CAP Shemouse" | Unfamiliar compound name | The narration says "one published detector"; the name appears on screen as a labelled caveat |
| "a researchers' finding" (ungrammatical) | Script wording | "what researchers report" |
| "rise and fall in speed" heard as "fallen speed" | Phrasing | "a smooth, bell-shaped curve of speed" |
| "want it retired" heard as "wanted retired" | "it" dropped by the voice | "say it should be retired" |
| A continuity gap of 0.2 s at the score section's start in the storyboard | Boundary written from a different cue | Corrected; the docs step reports no continuity gaps |
| A source attributed to a "2016 study" and a robot-arm anecdote presented as fooling reCAPTCHA | Careless summary in the research notes | Corrected in `docs/sources.md`; a duplicate uncertain bullet removed |

## Creative self-assessment

What works: the hook's picture (the trail already lit before the tap, labelled "STARTED HERE") makes
the claim visible in the first second; the bell-shaped speed curve and the steady line are a clear
picture of one idea; the verdict branches (PASS and PUZZLE) show the outcome without numbers; the
simulator's "NOT THE LIVE SITE" caveat and the coral "NOT CONFIRMED" stamp keep the claims honest on screen.

What is weakest: the browser chapter is abstract (a meter and a person icon stand for "weight" and
"seems human"); the takeaway's lower third is nearly empty (only the trail remains); the two-column
puzzle comparison is an illustration and reads as data at a glance; the "wobble" chapter is text-led;
the simulator grid is faint on a phone; the dot field for 3,600 people is dim until it fills.

A second pass would: read the full texts of the Google pages and the three papers and correct any
wording that differs; give "a score built from many signals" its own picture, since it is the claim
the viewer most needs; fill the takeaway's lower third; check the simulator grid's contrast at phone size.

## What was not verified

- Full texts of Google's pages and of the papers. Every claim was checked against search excerpts. A
  page fetch was refused by the session's permission check, so the wording of the 2013 and 2014
  posts, the v3 documentation and the FAQ is paraphrased and needs checking.
- The voice, music, sound design and mix were not heard. They were checked by measurement only
  (loudness, speech-to-bed ratio, sync) and by a speech recogniser transcribing the narration back.
- Playback inside the phone apps: the safe-zone shading and the mobile previews are approximations,
  because neither platform publishes exact pixels.
- Whether the 2019 simulator result or the 2024 study holds for today's reCAPTCHA. The video
  presents both as what the studies found, and labels the simulator as a simulator.
- Micro-wobble as a measured feature. No source establishes it, and the video says Google does not say.
