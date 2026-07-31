# Roman Bogachev — Personal Realm

A dependency-free personal landing page designed as an immersive, modern fantasy RPG menu.

## Run locally

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Technical notes

- Original cinematic environment generated for this project and stored locally as an optimized JPEG.
- Semantic HTML, responsive CSS, and a small vanilla JavaScript canvas layer.
- No runtime or build dependencies.
- Particle count is capped, butterfly count is reduced on mobile, canvas DPR is limited to `1.5`, and ambient drawing is throttled to roughly 30 fps.
- Lantern flicker uses source-image pixel coordinates verified against each physical light, with layered candle-like brightness and radius variation. Its canvas shares the background parallax timing so the glows remain locked to the image. The stream remains part of the static background without an additional animation layer.
- Heavy ambient effects are reduced on mobile, suspended when the tab is hidden, and disabled for reduced-motion or data-saver preferences.
- The user-provided ambient track is encoded as 64 kbps AAC/M4A. Playback is attempted automatically at 50% volume, with a first-interaction fallback when browser autoplay policy blocks sound.
