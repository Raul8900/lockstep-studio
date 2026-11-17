# Production review notes

Primary engineering claims checked against Airbus Safety First and AAIB printed page 5. Gaps and vent are enlarged; only the inner structural geometry contains the vent, scratch is passenger-side and outer is exterior-side. Air path ends at z=-0.48 between inner z=0 and outer z=-1.05. Normal outer pane is intact. A distinct amber annotation indicates load; backup is explicitly conditional. Physical leaders use the current Three camera projection.

The initial narration-only ASR reported pane/pain homophones. Clarifying those sentences with “windowpane” preserves the mechanical meaning and the revised recording passes with 0% WER; windowpane/window pane spacing variants are excluded by the existing normalizer. No human listening judgment is claimed. The final mixed audio and encoded frames are checked by the full build; measured results are recorded in final_verification.md after that pass.

All visuals are original procedural Canvas/Three geometry. Original bundled CC0 filtered-air ambience; no score and no event effects. Kokoro voice is local. Software, asset and rendering API incremental cost: ₹0 on existing hardware. Authoring uses the existing Codex session; token/model billing is not exposed here. Rendering uses zero authoring-model calls.


First-export review found that 780-pixel captions could reach the approximate Shorts button column. Final caption maxW is 720 pixels, with wrapping rather than smaller type. The cutaway camera has a slightly broader, smooth orbit and dolly to preserve visible depth during explanation. A full picture rebuild verified these changes; narration and its timing are unchanged.


Final technical, visual and mechanical checks are recorded in final_verification.md. All hard build checks pass. Low-motion intervals are intentionally retained for label reading. The exact delivered copy was decoded and matched by SHA256. No human listening was performed.
