# Portfolio search indexing

Public portfolio: https://angad64553.github.io/

## Verified on 2026-10-10

- The public GitHub Pages homepage returns HTTP 200 and matches local `index.html`.
- Canonical URL, Open Graph URL, and JSON-LD URLs use the GitHub Pages address.
- Live `robots.txt` permits crawling and points to the GitHub Pages sitemap.
- Live `sitemap.xml` lists the homepage and `resume.html` at the GitHub Pages address.
- The old domain `angad07.com` fails DNS resolution from this environment.
- `/portfolio-website/` returns HTTP 404; do not use it as the portfolio link.

These checks do not establish Google's chosen canonical URL or indexing status.
Those are visible in the owner's Google Search Console account.

## Remaining account actions

These requests have NOT been submitted by this repository change.

1. Open [Google Search Console](https://search.google.com/search-console).
   Select or add the URL-prefix property `https://angad64553.github.io/`.
   The homepage already includes a Google verification meta tag. If it does not
   verify for your Google account, use the exact tag provided by Search Console.
2. Inspect `https://angad64553.github.io/`, run **Test live URL**, then choose
   **Request indexing** if the page is eligible. Compare the user-declared and
   Google-selected canonical URLs in the inspection result.
3. Under **Sitemaps**, submit `https://angad64553.github.io/sitemap.xml`.
4. For urgent removal of the retired, unavailable site, select the verified old
   `angad07.com` property, open **Removals → New request → Temporarily remove URL**,
   enter `https://angad07.com/`, and choose **Remove all URLs with this prefix**.
   Review that the selected property and prefix are the OLD domain before submitting.
   This removal is temporary (about six months), and does not transfer ranking
   signals or guarantee that the GitHub URL will appear instead.
5. Keep the retired content unavailable. If the old domain and its serving
   infrastructure are still under your control, choose a permanent approach:
   use HTTP 301/308 redirects to the corresponding GitHub Pages URLs for a site
   migration, or return HTTP 404/410 for permanently removed content. For a
   migration, use Search Console's **Change of Address** after working redirects
   and ownership verification are in place. Do not block crawling in robots.txt.
6. Update portfolio links in your GitHub profile, LinkedIn, and other profiles
   to `https://angad64553.github.io/`.

If the old Search Console property is inaccessible and the page is gone, follow
Google's [Refresh Outdated Content](https://support.google.com/webmasters/answer/7041154)
instructions to request a refresh of the exact old search-result URL.

Indexing and removal requests are reviewed by Google. They do not guarantee a
ranking, an immediate update, or an exact date when old results disappear.

## Google documentation

- [Site moves with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Removals tool and permanent removal](https://support.google.com/webmasters/answer/9689846)
- [Request recrawling](https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl)
