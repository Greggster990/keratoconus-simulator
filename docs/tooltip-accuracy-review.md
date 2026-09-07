# Tooltip accuracy review

Reviewed 2026-09-07. Scope: all 15 help tooltips, including both control instructions and explanatory context. Checked control descriptions against the current shaders and renderer. Checked medical context against references [2](https://www.ncbi.nlm.nih.gov/books/NBK470435/), [6](https://pubmed.ncbi.nlm.nih.gov/17553566/), and [7](https://pure.manchester.ac.uk/ws/files/157153125/HOAs_in_KC_a_review.pdf). This is an evidence and implementation review, not clinical validation of the simulator.

| Tooltip | Finding and correction |
| --- | --- |
| Effect amount | Zero disables ghosting, not the separate blur and streak effects. Removed the claim that higher-order aberrations dominate keratoconus overall; the study concerns coma’s prominence **among higher-order aberrations**. [6](https://pubmed.ncbi.nlm.nih.gov/17553566/) |
| Ghost copies / pairs | Count behavior is correct, including the shared Ring endpoint. Clarified that count is not a clinical measurement. |
| Separation | Described the actual spacing scale and units, rather than implying every copy has the same distance from the original. Removed the unsupported direct link to cone position. |
| Direction | Scattershot rearranges its generated cloud; it does not rotate a fixed cloud. Removed the claim that ghost direction generally follows the cone apex. |
| Fade | The control description is sound. The chosen decay is a model parameter, not an established patient brightness profile. |
| Shadow softness | Retained the coma analogy with qualifications; removed the categorical exclusion of sharp secondary images. [7](https://pure.manchester.ac.uk/ws/files/157153125/HOAs_in_KC_a_review.pdf) |
| High-contrast bias | Explained suppression of low-contrast ghosts instead of promising stronger ghosts on particular objects. Distinguished image filtering from clinical optics. |
| Shape | Pattern descriptions match the code. Explicitly identified the three modes as illustrative options. |
| Curve | Zero can still wobble with Scatter enabled. Curve has no effect in Scattershot. Removed the unsupported corneal-curvature-to-ghost-arc explanation. |
| Scatter | Positional randomness is not physical light scattering. Removed the unsupported claim about typical ghost spacing. |
| Overall blur | Uniform areas can remain visually unchanged. Removed the absolute claim that some light is always out of focus. |
| Edge blur | Edge selection is a software choice. Removed the claim that coma “shows up first” at edges. |
| Streak length | Clarified units, direction, and brightness dependence. Qualified the tail as a simplified illustration. |
| Streak amount | Strength and length are independent controls. Removed “show the tail first,” which implied an unsupported ordering. |
| Opposite reflection | Shader uses 55% length and half sampling weight, not a guaranteed half-bright output. Removed the unsupported physiological reflection mechanism. |

Reference 6 had the correct article title and DOI but an incorrect PMID. Changed 17561224 (an unrelated snake-venom paper) to 17553566 in both bibliography copies and the page. Added a full-text link for reference 7. Renamed “Fun fact” to “Context” so model explanations are not presented as clinical facts.

The sources support general optical context, not the simulator’s exact ghost geometry or numerical settings. The tooltip corrections do not change rendering behavior. Other explanatory page text and references unused by tooltips were outside this review.

Subsequent control update: Ring now uses Curve for its length and Scatter for its width. Direction remains the axis from the original to the shared opposite ghost. These are simulator geometry controls; the clinical context is unchanged.
