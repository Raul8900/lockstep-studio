## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| "Your painkiller knows where it hurts. It doesn't." | The premise, stated so it can be undercut. Popular write-ups already make the same point (Howitworksdaily, 2013: painkillers "don't 'know' – they go everywhere"); the video goes further, to why the sore spot still looks targeted. |
| Peak "within one to two hours" (on screen: 1–2 HOURS) | Health Canada ibuprofen monograph (2005), p.1 and p.3 (mean Tmax 2.04 h). The label is dated: check the current label before any re-publication. |
| "It sticks to blood proteins, so it mostly stays in the bloodstream" | Monograph: highly bound to plasma protein; distribution volume 0.1–0.2 L/kg. "Mostly stays" is our inference, not measured per tissue. |
| "Blood reaches every organ, and the drug travels with it" | General physiology; qualitative only. No circulation time is stated (not verified, and not in the video). |
| "Hurt tissue switches on an enzyme called COX-2. It makes prostaglandins." | Faki and Er 2021 (RMMJ): COX-2 is rapidly induced by growth factors and pro-inflammatory cytokines and rises in inflamed epithelium. |
| "They make nerves more sensitive to the chemicals injury releases." | Monograph p.1: prostaglandins are "believed to sensitise" tissues to pain-producing mediators. Narrated as settled; the label's word is "believed". A simplification. |
| "Ibuprofen blocks both versions of that enzyme, everywhere it works." | Cryer and Feldman 1998: all available NSAIDs inhibit COX-1 and COX-2 to varying degrees. "Everywhere it works" means wherever the drug reaches and COX is present. |
| "The sore ankle is where that enzyme is busiest, so the block removes the most there." | Inference: inhibition removes prostaglandin in proportion to enzyme activity. Not measured for ibuprofen. The mark counts on screen are a schematic illustration, not data. |
| "Your stomach makes its own prostaglandins to help guard its lining." | Takeuchi 2012: COX-1 is constitutive in the stomach; PGE2 prevents NSAID-induced lesions in experimental models. Simplified: the review also describes a hypermotility mechanism. |
| "Block it, and ulcers and bleeding can happen. The label calls them serious." | Monograph p.5: serious GI toxicity, including peptic ulceration and bleeding, occasionally fatal. |
| "In people with kidney problems, ibuprofen can cut that flow." (on screen: IN KIDNEY PROBLEMS) | Monograph p.14: renal blood flow and filtration fell in mild renal impairment after 1,200 mg a day for a week. |
| "Paracetamol, or acetaminophen, has almost no anti-inflammatory effect." | Mallet et al. 2023 (J Pain Res), body text. |
| "It works mostly in the brain and spinal cord. Scientists still argue about exactly how." | Mallet et al. 2023: analgesia is mediated by AM404 formed in the central nervous system, and the mechanism is debated. A 2026 review argues for an additional peripheral action; the narration does not contradict it. |
| "Opioids like morphine work largely through the nervous system." | PNAS 2010 abstract: "In addition to its central effects, morphine can also produce peripheral analgesia." "Largely" is our reading of that abstract. |
| End card: "Read the label." and "Ask a pharmacist about your stomach and kidneys." | Not narrated. Supported by the monograph's contraindications (active peptic ulcer; impaired kidney function) and dosing (p.5 and p.17). |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| "It doesn't" landed at 3.22 s, after the three-second undercut | "exactly" in the first take, and a 0.34 s pause | Dropped "exactly" and cut the pause to 0.22 s; "doesn't" now lands at 2.73 s. |
| The voice check heard "route" as "root" | A recogniser error on one word | Rewrote the sentence ("Scientists still argue about exactly how."); 0 errors in 226 words. |
| The caption draft left orphan fragments ("blood.", "flow.") and one six-word phrase | Draft made from punctuation alone | Hand-wrote the 66-phrase list and split the six-word phrase. |
| The head factory sat at y ≈ 344, above the diagram zone and under the progress bar | A placement offset | Moved into the head (y 470). |
| The bleeding drop fell 60 px past the stomach | Fall distance | Reduced to 26 px. |
| The body outline showed behind the end card | Fade level | The body fades to 8 % behind the card. |
| Template scenes and storyboard left over from the scaffold | Scaffold files | Replaced with seven beat scenes and a rewritten storyboard. |
| 66 static stretches flagged by the continuous-motion check | Pauses with little movement | A slow push-in and gentle breathing on every scene. 14 short holds remain (see below). |
| Speech-to-music ratio 21.7 dB (target 15–17 dB) | Music too quiet in the mix | Music raised 5 dB in `video.json`; the ratio is now 16.8 dB. |
| The kidney label "FLOW DOWN" read as a general effect | Label wording | Changed to "IN KIDNEY PROBLEMS", matching the narration. |

## Creative self-assessment

- **What works.** The structure follows the brief: myth, why it seems true, the flood, the factory, the costs, where the myth breaks, and the truth. The block shown everywhere at once is the clearest picture. The costs are drawn as changes (the shield thins and cracks, the warning appears, the flow slows) rather than as lists. The callback answers the opening line.
- **Weakest.** The 14 remaining static holds are short (0.4–0.9 s each). They are spread across the why, factory, cost and breaks scenes, and one falls on the end card (91.4–92.1 s). The zoomed factory frames crop the head. The mark counts for "busiest" are schematic, and the level chart has no units. The end card's subline (34 px) is small on a phone. A second pass would add larger idle motion in the cost, factory and breaks beats (for example a slow glow behind the stomach and kidneys), and check the subline at phone size.
- **The look.** The cream ground belongs to the same family as the previous video's (riso-sticker). The serif display type, the line-art body and the absence of sticker borders make the two read as different.

## What was not verified

- **Listening.** Nobody listened to the mix. It was checked by measurement (loudness −14.0 LUFS, true peak −4.0 dBTP, speech-to-music ratio 16.8 dB) and by speech recognition on the final mix (0 errors in 226 words).
- **Platform apps.** Playback inside Reels or Shorts was not tested. The phone previews use generic interface overlays and only approximate the keep-out areas.
- **Continuous motion.** 14 holds remain, each 0.4–0.9 s, listed in section 6 of the production report. Most sit in pauses between captions while the camera keeps breathing. The end-card hold (91.4–92.1 s) is the takeaway held still; the molecules keep moving, but the detector sees little change there. The detector is a frame-difference threshold, not a perceptual test. I accepted these rather than adding more movement.
- **Medical sources.** The mechanisms rest on a 2021 review, a 2012 review, a 2023 review and abstracts. The 1971 and 1972 Nature papers, the StatPearls chapters and the NSAID review PMC4508078 could not be read here. The dosing and warnings come from a 2005 Health Canada monograph; check them against the current label before any re-publication.
- **Circulation time.** Not verified, and not in the video.
- **Ibuprofen's reversibility and platelet effect.** Not verified here. The video mentions only aspirin's permanent platelet effect.
- **Platform loudness.** Some platforms normalise loudness differently from −14 LUFS.
