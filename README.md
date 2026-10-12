# Angad Sharma — Developer Portfolio

A framework-free portfolio for an SDE and LMS Associate building Moodle, PHP, and MySQL systems — with a real-time 3D hero and evidence-first content.

## Live sites

- Preferred public/SEO URL: [angad.onslate.in](https://angad.onslate.in/)
- GitHub Pages: [angad64553.github.io](https://angad64553.github.io/)

Both platforms use the same source code. The former AWS-hosted site is retired.

## Built with

- Semantic HTML5, one CSS file, vanilla JavaScript — no framework
- Three.js (vendored r128) for the real-time hero scene
- Web3Forms contact delivery
- GitHub Pages and Zoho Catalyst Slate

## Highlights

- Interactive WebGL hero: orbital "learning system" with labels that track 3D nodes
- 3D tilt-and-glare cards, scroll-driven perspective mockups, and a filling timeline
- Dark and light themes, with a CSS 3D fallback when WebGL is unavailable
- Live GitHub profile, contribution calendar, latest commit, and repositories
- Reduced-motion support, keyboard-accessible navigation, and semantic landmarks
- Printable résumé page; Open Graph, JSON-LD, robots, and sitemap metadata

See [DESIGN.md](DESIGN.md) for the design system and motion rules.

## Search indexing

Canonical URLs, social metadata, structured data, and the sitemap point to
`https://angad.onslate.in/`. Use this address for public portfolio links.
GitHub Pages remains accessible with the same content and points to Slate as
the preferred canonical site. The existing Google verification tag is preserved.

Google's existing search results require a separate Search Console update;
changing this repository cannot delete a result from Google's index.
See [SEARCH-INDEXING.md](SEARCH-INDEXING.md) for the exact account steps.

## Deployment compatibility

Keep the existing GitHub Pages deployment settings. The root HTML and relative
asset paths remain directly publishable; no custom domain or redirect is required.
There are no GitHub Actions workflows in this checkout.

Zoho Catalyst Slate settings remain:

- App: `angad-portfolio`; App Name: `angad64553-github-io`
- Framework: Other; Root Path: `./`
- Install Command: `npm install`
- Build Command: `npm run build`
- Build Path: `dist/client`

The existing build script copies the static site, assets, and SEO files into
`dist/client` without rewriting paths for either host.

## Local preview

Run any static server from the project root, for example:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Contact

- Email: [angad64553@gmail.com](mailto:angad64553@gmail.com)
- GitHub: [github.com/angad64553](https://github.com/angad64553)
- LinkedIn: [angad-sharma-64553-](https://www.linkedin.com/in/angad-sharma-64553-)
- Instagram: [@angad.sharma14](https://www.instagram.com/angad.sharma14/)
- Facebook: [angad64553](https://www.facebook.com/angad64553)
- WhatsApp: [+91 70524 78516](https://wa.me/917052478516)

