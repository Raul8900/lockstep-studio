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
| "Google suggests starting at 0.5" | v3 documentation excerpt (starting cutoff 0.5). Labelled "sites tune their own". |
| "A real hand never moves at one steady speed … a smooth, bell-shaped curve of speed" / "In 1985, Flash and Hogan modeled" | Citation confirmed in several later reference lists; the 1985 paper itself was not read. The bell profile is attributed to this work by a later J Neurosci paper. Presented as a model of human reaching, not as a claim about reCAPTCHA. |
| "One published detector checks cursor paths against a model like that" | Abstract excerpt of BeCAPTCHA-Mouse. On screen: "TRAINED ON PUZZLE DRAGS". The name is shown on screen, not spoken. |
| "In a 2024 study of reCAPTCHA version two, any cursor movement cut the number of puzzles needed to pass" | Excerpts of the paper's tables and text. On screen: "ILLUSTRATIVE, NOT TO SCALE" for the two-column picture. |
| "Straight paths and curved ones were not significantly different" (p = 0.57) | Same paper, from the excerpt (t = 0.58, p = 0.57). Not checked in the full PDF. |
| "A 2024 study reports that cookies and browsing history carry substantial weight" | The authors' own report, from the excerpt. On screen: "REPORTED BY RESEARCHERS". |
| "Browsing history is what researchers report. Google hasn't confirmed it." | No Google statement confirming browsing history was found in the excerpts checked. On screen: "GOOGLE: NOT CONFIRMED". |
| "In 2019, researchers trained an AI agent … a score of 0.9, about 97% of the time" | Abstract excerpt (97.4% on a 100 × 100 grid, 96.7% on 1000 × 1000). On screen: "SIMULATOR, NOT THE LIVE SITE". |
| "A 2023 study ran for thirteen months with more than 3,600 people" | Abstract excerpt (13-month live study, more than 3,600 participants, one large public university). |
| "Its authors judged the checkbox costly, with close to no security gain, and say it should be retired" | The authors' own judgement, from the abstract excerpt. On screen: "THE AUTHORS' VIEW". |

Numbers on screen and in the narration, all traced in `docs/sources.md`: 2013, 2014, 2019, 2021,
2023, 2024, 1985 (dates); 0.0 to 1.0 and 0.5 (the v3 scale and suggested cutoff); 0.9 and 97% (the
simulator); 3,600+ and thirteen months (the study); p = 0.57 (the 2024 paper). The narration writes
these numbers as the speech recogniser transcribes them, so the spoken words and the checked
figures are the same.

Simplifications, stated on screen where they matter: the checkbox is reCAPTCHA v2's widget and v3 is
shown as a score with no checkbox; Google's list of signals and their weights is described as not
published; "wobble" is shown as a question, because no source measures micro-wobble and the 2024
test found that the movement mattered and the path's shape did not.

## Defects found during QA and fixed

Found by the build's checks, by the contact sheets, full-size stills, the filmstrip and the
phone-size previews, and by a faithful re-test of each held window.

| Found | Cause | Fix |
|---|---|---|
| Voice intelligible in the mix: 5.81% word error (24 of 413) — a FAIL | The recogniser writes "2013", "0.5", "97%" and "3,600" where the script said "twenty thirteen", "point five", "ninety-seven percent" and "thirty-six hundred"; the comparison normalises the two forms differently. The spoken words were correct. | The narration now uses the forms the recogniser transcribes; cue keys, captions and the caption highlight follow. The clean check now shows 0 word errors in 425 words, and the mix check shows 0.0%. The threshold was not changed. |
| 59 static holds of 0.4–0.9 s in the first full build (a flagged check) | Pauses between sentences where only small elements moved. The validator measures the average change across the whole frame, so small moving items do not register. | A slow breathing light in every scene, a light travelling along the trail (hook and payoff), history rows that scroll inside the browser windows, a drifting band in the watch list, breathing light at the 1985 peak, on the waiting checkbox, on the scale, behind the dot field and the simulator, and a breathing light across the end card. Each held window was reproduced with the build's encode settings before and after the fix. The final build reports no holds. |
| The history rows ran past the bottom of the small browser window (watch scene) | Row positions were fixed and the window was too short | Rows scroll inside the window; the window is taller; its label moved down |
| The incoming scene was blank for 0.3–0.7 s at three cuts (watch, cursor, score) | Headlines, the list and the axes faded in after the scene started | Drawn from the scene's first frame; the filmstrip confirms no empty frames at those cuts |
| A hard-edged amber band in the limits scene read as a block | A rectangle used as a sweep | Replaced by a soft glow |
| The speech-to-music ratio was 18.2 dB, outside the 15–17 dB target | Music bus level | Music bus raised 1.5 dB in `video.json` (`mix.music_db` −2.5); the ratio is now 16.9 dB and loudness stays at −14.1 LUFS |
| Score scene: a crossed checkbox and "NO CHECKBOX" stayed on screen; "VERSION 3" overlapped "2019"; "START 0.5" overlapped "EACH SITE SETS ITS OWN"; cutoff labels came back during the "0.9" section | Labels with no end time or the same screen position | Each label fades out or has its own time window; the simulator and scale handoff overlaps |
| "THE TEST" clipped at the left edge; the end headline ran nearly edge to edge | Label placed too far left; headline too large | Label moved beside the path; headline reduced to 72 px |
| The recogniser heard "reCAPTCHA" as "Ray Capcha" and "BeCAPTCHA-Mouse" as "B-CAP Shemouse" | Default reading of unfamiliar names | IPA override for reCAPTCHA; the detector's name is not spoken, and it is shown on screen as a labelled caveat |
| A build refused to start after the script was edited following recording | The build checks the recording against the script | Re-recorded (the text was unchanged, so the audio was identical) |
| A continuity gap of 0.2 s in the storyboard | A boundary written from a different cue | Corrected; the docs step reports no continuity gaps |
| A source attributed to a "2016 study", a robot-arm anecdote presented as fooling reCAPTCHA, and a duplicate uncertain bullet | Careless summary in the research notes | Corrected in `docs/sources.md` |

## Creative self-assessment

What works: the hook shows the claim in the first second (a trail already lit before the tap,
labelled "STARTED HERE"); the bell-shaped speed curve and the steady line show one idea clearly; the
verdict branches (PASS and PUZZLE) show the outcome without numbers; the simulator's "NOT THE LIVE
SITE" caveat and the coral "NOT CONFIRMED" stamp keep the claims honest on screen; the captions and
their highlight colours follow the narration.

What is weakest: the browser chapter is abstract (a meter and a person icon stand for "weight" and
"seems human"); the takeaway's lower third is nearly empty (only the trail remains); the light now
breathes constantly, so it may read as slightly "glowy" on a phone and a second pass should calm
its amplitude; the two-column puzzle comparison is an illustration and reads as data at a glance;
the "wobble" chapter is text-led; the simulator grid is faint on a phone; the dot field for 3,600
people is dim until it fills.

A second pass would: read the full texts of the Google pages and the three papers and correct any
wording that differs; calm the ambient light; give "a score built from many signals" its own
picture, since it is the claim the viewer most needs; fill the takeaway's lower third; check the
simulator grid's contrast at phone size; and listen to the mix, which has been checked by
measurement only.

## What was not verified

- Full texts of Google's pages and of the papers. Every claim was checked against search excerpts. A
  page fetch was refused by the session's permission check, so the wording of the 2013 and 2014
  posts, the v3 documentation and the FAQ is paraphrased and needs checking.
- The voice, music, sound design and the final mix were not heard. The mix was checked by
  measurement only: loudness (−14.1 LUFS), true peak (−2.9 dBTP), the voice-to-music ratio (16.9 dB),
  sync (+0 ms) and a speech recogniser transcribing the mix (0.0% word error).
- Playback inside the phone apps: the safe-zone shading and the mobile previews are approximations,
  because neither platform publishes exact pixels. The phone speaker's reproduction of the mix is
  unknown.
- Whether the 2019 simulator result or the 2024 study holds for today's reCAPTCHA. The video
  presents both as what the studies found, and labels the simulator as a simulator.
- Micro-wobble as a measured feature. No source establishes it, and the video says Google does not say.
- The MP4 is about 123 MB, above GitHub's 100 MB file limit, so it is kept out of git (it is
  git-ignored) and handed over directly. Rebuilding it needs `bin/lockstep build captcha-checkbox`.
