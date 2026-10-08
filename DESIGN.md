# Portfolio design system

An evidence-first engineering portfolio: a real-time WebGL hero, restrained motion,
and content that links to real code. Dark is the default theme; light is a full
peer, not an afterthought.

## Files

- `index.html` — all page content and structured data.
- `site.css` — the only stylesheet (tokens, components, résumé, print, thank-you page).
- `main.js` — theme, navigation, scroll spy, reveals, tilt, scroll-driven 3D,
  live GitHub data, and the Web3Forms contact form.
- `scene.js` — the Three.js hero (ES module). Uses the vendored
  `assets/vendor/three.r128.min.js`, loaded after the window `load` event.

## Palette

Matches `og-image-generated.png` and `favicon.svg`.

| Token      | Dark      | Light     | Use                                   |
|------------|-----------|-----------|---------------------------------------|
| `--bg`     | `#06080f` | `#f5f6fb` | Page                                  |
| `--accent` | `#8b9bff` | `#3b4fd8` | Primary actions, kickers, ring 1      |
| `--cyan`   | `#5eead4` | `#0b7f77` | Gradients, ring 2, data               |
| `--warm`   | `#f5c46b` | `#a8680c` | Ring 3, code functions, highlights    |

Space Grotesk (400/500) for text and display, IBM Plex Mono for labels, dates,
and code. Both are self-hosted WOFF2.

## Section order

Hero → stack marquee → Work (`#projects`) → About → Experience → Skills →
GitHub → Credentials → Contact. Work comes first because it is the evidence.

## Motion

1. **Hero scene** — a faceted icosahedron core, a counter-rotating wire shell,
   a Fibonacci-sphere network, three tilted orbit rings with glowing nodes, and a
   star field. The rig is positioned over `[data-scene-anchor]`, so layout stays in
   CSS. Pointer movement steers the system; scrolling adds a depth-parallax lag.
   DOM labels (`[data-scene-label]`) track the projected ring nodes and dim
   when a node passes behind the core. Rendering stops off-screen, in hidden tabs,
   and under reduced motion (one static frame is drawn). Light theme switches
   from additive to normal blending.
2. **Fallback** — a CSS 3D orb with orbiting rings is visible until the first
   WebGL frame, and stays if WebGL, the script, or data-saver mode blocks the scene.
3. **Project mocks** — `[data-scroll-3d]` elements receive `--p` (0→1) from
   scroll and straighten from a tilted perspective into place.
4. **Cards** — `[data-tilt]` gives bounded pointer tilt (5°, 7° for the profile
   card) with a cursor-following glare. Mouse only; never on touch.
5. **Reveals** — `[data-reveal]` fades and lifts once. The `motion` class is set
   in `<head>`; if `main.js` never runs, it is removed after 4s so content shows.
6. **Timeline** — the rail fills with scroll (`--fill`).

All of it is disabled by `prefers-reduced-motion`.

## Content rules

- No unverifiable metrics or self-awarded badges.
- Mock interfaces are labeled "Concept UI"; project links point to real repos.
- One job title everywhere: **SDE & LMS Associate at AeroBay**.

## Verification

```bash
node --check main.js && node --check scene.js
python3 tests/verify_content.py   # fingerprints of content; regenerate on intentional copy changes
npm run build
python3 -m http.server 8000
```

Check 320, 390, 768, 1024, and 1440px; both themes; the mobile menu; reduced
motion; and contact validation without sending a real message.
