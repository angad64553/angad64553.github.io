# Portfolio visual upgrade

The existing HTML, section order, links, written content, data integrations, portrait,
résumé, metadata, and contact delivery are the source of truth. The design is an
engineering workbench informed by Angad's learning-platform and robotics context.

## Design contract

- Porcelain `#EDF2F4`: page and work surface.
- Ink `#172C43`: typography, featured story, and dark-theme foundation.
- Cobalt `#2855D9`: primary actions and circuit traces.
- Signal Teal `#087E83`: system indicators and secondary traces.
- Calibration Gold `#C89B36`: hardware contacts and short rule accents.
- White `#FFFFFF`: elevated surfaces and light-theme model plates.

Space Grotesk handles display and body text. IBM Plex Mono handles small technical
labels, dates, and numerical details. The working scale is 12, 14, 16, 20, 28, 40,
56, and 72px, with responsive interpolation for headlines. Smaller pre-existing
mock-interface and profile annotations remain subordinate. Local WOFF2 fonts use
`font-display: swap`; the primary display face is preloaded.

The hero uses two unequal columns. Below it, section rules establish alignment;
expertise uses spaced, colored dimensional cards, experience uses dated rows, and
projects use alternating editorial spreads. Card materials use distinct tinted
surfaces, colored edges, and compact shadows to emphasize their depth. Existing copy and punctuation are not restyled through
text replacement.

## Motion contract

1. One WebGL renderer: three exploded circuit plates with processor packages,
   IO headers, orthogonal traces, contacts, and a calibration ring. Pointer movement
   changes orientation; scroll separates the layers. Rendering stops after the
   scene settles, outside the viewport, and in hidden tabs. The enlarged assembly
   uses beveled blue and teal boards, bright traces, a luminous processor, machined
   feet, and a calibration rim. No particle loops.
2. A shared scroll value draws each section's calibration rule. Project mockups
   share a small translation using the same value. Text remains visible, including
   when JavaScript fails. No blur/fade-up reveals.
3. Primary/secondary buttons and the navigation action use at most 3px of magnetic
   movement. Text links share an underline interaction. Lenis smooths desktop wheel
   input; touch and native anchors retain browser behavior. Dialog/menu scroll
   locking and keyboard focus remain supported.
4. Expertise, story, and repository cards and the portrait share bounded cursor
   tilt (at most 4.5 degrees), a surface highlight, and a 4px lift. Expertise artwork
   separates into layers during hover; project previews use a smaller fixed tilt.
   Pointer work is batched into one animation frame and stops without new input.
5. Two CSS light fields and a dotted grid react subtly to cursor and scroll.
   These effects remain static on touch, reduced-motion, and low-power devices.

## Progressive enhancement

`visual.css` establishes the color and motion system; `finish.css` applies the
whole-page layout refinement without changing the existing résumé stylesheet.
`script.js` keeps theme, navigation, GitHub, form, and portrait behavior.
`visual.js` coordinates motion and optional loading. `hero-scene.js` owns WebGL
resources and their disposal. The existing Three.js r128 is vendored unchanged;
Lenis 1.3.26 adds only inertial wheel scrolling. No application framework or
competing timeline library was introduced.

The CSS circuit assembly is visible on first paint. WebGL and Lenis load after
the window load event and an idle opportunity, only on fine-pointer viewports
above 820px without reduced motion or data-saving mode. Devices reporting at most
4GB memory or four CPU threads also receive the static treatment. Pixel ratio is
capped at 1.5. Preference changes dispose the scene and smooth-scrolling instance.
WebGL errors and context loss leave the static assembly visible.

The follow-up request explicitly adds richer card colors, hover depth, a stronger
hero image, and background effects. Card accents are cobalt `#2855D9`, violet
`#7650CF`, teal `#087E83`, cyan `#087AA9`, amber `#A96B12`, and rose `#C24573`,
with lighter accessible counterparts in dark mode. Each expertise card has a
different CSS-built dimensional object: interface panels, a processor, database
platters, delivery nodes, a cloud, and tooling blocks. The result retains the
engineering identity while making color and interaction more prominent. The
existing labels, separator characters, and link arrows remain because preserving
written content takes precedence over replacing those details.

## Verification

Run `python3 tests/verify_content.py`, `node --check script.js`,
`node --check visual.js`, `node --check hero-scene.js`, and `npm run build`.
The content test locks the original text, anchor attributes, section sequence,
form configuration, structured data, and non-visual metadata using fingerprints.
Serve the repository or `dist/client` with any static HTTP server for browser review.

Browser checks should cover 320, 390, 768, 1024, and 1440px; both themes; menu and
portrait keyboard behavior; reduced motion at load and after initialization;
data saving; blocked WebGL assets; context loss; and contact validation without
sending a real message. The normal build copies the local fonts, licenses, and
lazy modules into the existing static/Worker output.


## Whole-page refinement

The portrait is now 210 × 240px on large screens, in the upper right of a clearly
partitioned hero panel. Role and location sit to its left; the circuit assembly
occupies the middle and deployment details form a bottom rail. At narrow widths,
the 188 × 215px portrait centers above the role/location row and the static scene.
The existing portrait lightbox remains the interaction for the enlarged image.

The navigation uses a compact floating frame. About has a larger portrait
introduction and connected journey panels. Experience emphasizes the current role
with a dark blue/teal surface. Projects use individual product panels, GitHub has
separate statistic tiles, credentials appear as compact certificate plaques, and
the contact section closes the page in a single framed composition. Section order,
copy, metadata, destinations, and live data are preserved.
