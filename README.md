# The Digital Garden — Roman Bogachev

A production-ready personal homepage with a restrained high-fantasy atmosphere, a stable profile sidebar and an accessible project workspace.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Technical notes

- The original cinematic environment remains local as an optimized JPEG and stays fixed behind the responsive two-column layout.
- Semantic tabs, responsive CSS and vanilla JavaScript switch only the selected project content; arrow keys, Home and End are supported.
- GSAP core 3.15.0 is vendored locally for the entrance timeline and eased pointer parallax. There is no build step or remote runtime dependency.
- Particle count is capped, butterfly count is reduced on mobile, canvas DPR is limited to `1.5`, and ambient drawing is throttled to roughly 30 fps.
- Lantern flicker uses 32 source-image coordinates extracted from the supplied red-spot markup, with layered candle-like brightness and radius variation. Its canvas shares the background parallax timing so the glows remain locked to the image. The stream remains part of the static background without an additional animation layer.
- The ambient canvas is initialized during idle time. Heavy effects are reduced on mobile, suspended when the tab is hidden, and disabled for reduced-motion or data-saver preferences.
- `Elven Lullaby` is encoded as 64 kbps AAC/M4A. Playback is attempted automatically at 50% volume, with a first-interaction fallback when browser autoplay policy blocks sound.
