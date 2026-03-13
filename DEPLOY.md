# WriteClean — Deployment Guide

## File Structure
```
writeclean/
├── index.html              ← Homepage + grammar tool
├── blog.html               ← Blog index
├── privacy.html            ← Privacy policy
├── 404.html                ← Custom 404 page
├── sitemap.xml             ← Submit to Google Search Console
├── robots.txt              ← Search engine crawl rules
├── manifest.webmanifest    ← PWA manifest
├── _headers                ← Netlify/Vercel caching headers
├── _redirects              ← Netlify clean URLs + 404 routing
├── css/
│   └── style.css           ← All site styles
├── js/
│   └── main.js             ← Grammar tool + UI logic
└── blog/
    ├── free-grammar-checker-no-signup.html
    ├── grammarly-alternative.html
    ├── students-grammar.html
    ├── email-grammar.html
    ├── humanize-ai-text.html
    ├── grammar-seo.html
    ├── esl-grammar.html
    ├── freelance-proposals.html
    ├── academic-grammar.html
    └── business-writing.html
```

---

## Step 1 — Add Your Anthropic API Key

Open `js/main.js` and find this line (around line 55):
```js
const response = await fetch('https://api.anthropic.com/v1/messages', {
```

The file currently has no API key — the key must be passed via a backend proxy or Netlify Edge Function for security. **Never put your API key directly in client-side JS.**

### Option A: Netlify Edge Function (Recommended)
1. Create `netlify/edge-functions/grammar.js`
2. Move the fetch call there with your key in Netlify environment variables
3. Call `/api/grammar` from main.js instead

### Option B: Quick test (local only)
Add to fetch headers: `'x-api-key': 'YOUR_KEY'`
⚠️ Remove before deploying publicly — exposes key in browser dev tools.

---

## Step 2 — Deploy to Netlify (Free)

1. Go to netlify.com → New site → Deploy manually
2. Drag and drop the entire `writeclean/` folder
3. Done — your site is live in 60 seconds

Or connect GitHub:
1. Push this folder to a GitHub repo
2. Netlify → New site from Git → select repo
3. Build command: (none) | Publish directory: `.`
4. Deploy

The `_headers` and `_redirects` files are automatically picked up by Netlify.

---

## Step 3 — Replace Domain References

Search and replace `https://writeclean.ai` with your actual domain in:
- `index.html` (og:url, canonical, JSON-LD)
- `blog.html`
- `privacy.html`
- `sitemap.xml` (all `<loc>` tags)
- All 10 files in `blog/` (canonical tag + JSON-LD)

---

## Step 4 — Submit to Google Search Console

1. Go to search.google.com/search-console
2. Add Property → URL prefix → your domain
3. Verify via HTML tag (paste into `<head>` of index.html)
4. Sitemaps → enter `sitemap.xml` → Submit
5. URL Inspection → homepage URL → "Request Indexing"

---

## Step 5 — Submit to Bing

1. Go to bing.com/webmasters
2. Add site → Import from Google Search Console (1-click)

---

## Launch Checklist

- [ ] API key set up via backend proxy
- [ ] Domain references updated in all files
- [ ] Deployed to Netlify/Vercel
- [ ] Google Search Console verified + sitemap submitted
- [ ] Bing Webmaster Tools connected
- [ ] Product Hunt launch scheduled
- [ ] Reddit r/sideprojects post written
- [ ] AlternativeTo.net listing created

---

## Performance Targets (check with PageSpeed Insights)

- LCP (Largest Contentful Paint): under 2.5s
- CLS (Cumulative Layout Shift): under 0.1
- INP (Interaction to Next Paint): under 200ms
- Mobile PageSpeed score: 90+

The single-file CSS + JS architecture should hit 95+ on desktop and 90+ on mobile out of the box.
