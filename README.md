# Keratoconus Vision Simulator

Upload a photo in the browser and add stacked ghost copies, then optional blur — the everyday look of keratoconus. Sliders update in real time. The photo never leaves the device.

This is not a medical device and not a diagnosis. Keratoconus looks different for every person and every eye.

## Live site

Once GitHub Pages finishes deploying:

**https://greggster990.github.io/keratoconus-simulator/**

Photos stay on the visitor’s device. Sharing the link does not share anyone’s pictures.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL Vite prints.

## Current slices

1. **Ghosts** — count, separation, direction, fade, softness, high-contrast bias, curve, scatter, linear vs scattershot.
2. **Blur** — overall softness plus extra smear on edges.

Streaking comes later, after blur looks right.
