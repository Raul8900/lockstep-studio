## Technical accuracy review

| On screen / spoken | Status |
|---|---|
| 1940; Washington State; Galloping Gertie; people drove across for the ride | WSDOT, HistoryLink (docs/sources.md) |
| 2,800 ft main span (“over half a mile”); 8 ft deep deck | WSDOT “Lessons from failure”, Britannica |
| November 7, four months after opening; about 40 mph | WSDOT records 38–42 mph; Britannica 42; the video says “about forty” |
| Bounce turned into a twist; fell around eleven | WSDOT, HistoryLink, Live Science (accounts give 10–11:02 a.m.) |
| One man fled his car with his daughter's dog Tubby inside | WSDOT, Wikipedia; the dog was the only death (people were injured) |
| Not resonance: the twist fed itself from a steady wind (flutter) | Billah & Scanlan 1991; APS News. The section animation is a simplified picture of that, not a simulation |
| Bridges tested in wind tunnels | WSDOT “Lessons from failure” |
| The 3D bridge | built in code to the real layout (two towers, main span, side spans, suspenders), not to scale in every detail; motion is illustrative and timed to the narration |
| The film | Tacoma Fire Department film, 7 November 1940, public domain (Internet Archive, CEP176) |

## Defects found during QA and fixed

| Found | Cause | Fix |
|---|---|---|
| Tower legs filling two shots | cameras placed beside the deck centre line | chase camera on the centre line; end view between the legs |
| Wind invisible | streaks blowing straight at the camera | streaks thicker, brighter and slanted across the span |
| The twist not visible when “twist” is said | amplitude grew too late | a first rise on the word, then the growth |
| Film caption over the print | name tag below the picture | name tag above, print raised |
| The 1940 film cropped and blurred full frame | 320 px 4:3 film forced to fill 9:16 | new `fit: 'contain'`: the whole film as a framed print over a blurred copy |

## Creative self-assessment

The whole story is animated in code; the real film appears twice, as proof. Strongest: the chase
camera riding the bouncing deck, the twist growing on the bridge, the fall landing on its word.
Weakest: the cross-section is schematic and the streamlined deck in the wind tunnel reads as a disc;
the bridge has no texture detail; the music was chosen from its description, not by ear.

## The person's review

Animation, voice, the real footage and the music were right. The pacing was not: the explanation
and the real film were rushed while the setup had time to spare (the film of the twisting deck
2.3 s, talked over). Kept as built for reference; `lockstep lint` now flags both film appearances
(`pacing`), and the brief's Pacing section says how the time should have been shared.

## What was not verified

How the music sounds against the voice (measured, not heard); playback in the platform apps.
