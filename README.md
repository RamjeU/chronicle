# Chronicle

An interactive globe and timeline of human history: who existed when, and who could have known whom.

- **Globe:** a real-Earth globe you can spin. Scrub or play through 300,000 years and see who existed, with documented and plausible contact links drawn as arcs.
- **Timeline:** every entry side by side on a log or linear scale, with date uncertainty shown.
- **Ask:** type a question such as "Did Khalid ibn al-Walid know about Tamil people?" or pick two entries. The answer shows whether they overlapped and the chain of recorded links that could have carried knowledge between them, each with a source and a confidence tier.

No account, API key or server is needed. Questions are read by a rule-based matcher, and every answer comes from the data files.

## Run it

```bash
cd frontend
npm install
npm run dev        # open the address Vite prints
npm test           # reasoning engine and question matcher
cd .. && python3 scripts/validate.py   # checks the data files
```

## How it works

- `data/entities.json`: entries with start and end years (negative = BCE), uncertainty margins, a location and sources.
- `data/contacts.json`: links between entries with a kind, a time window, a confidence tier (documented or plausible) and sources.
- `data/aliases.json`: names people use ("China", "Tamil people", "Islam") mapped to the entries they could mean.
- `frontend/src/lib/contact.ts`: finds the shortest, best-attested chain of links that share a window of time. A chain of two or more links must share at least five years.
- `frontend/src/lib/ask.ts`: reads a question. When a name covers several entries, it picks the one closest in time to the other entry and says so.
- `frontend/src/lib/time.ts`: Allen interval algebra and uncertainty-aware overlap.
- `frontend/public/textures/`: Earth imagery (NASA Blue Marble via the three-globe package).

"Not recorded" means unrecorded in this dataset, never impossible. Oral and non-written histories are underrepresented. Sources are starting points (mostly encyclopedia articles) and should be checked against scholarly work. Corrections to the data files are welcome.

## Hosting

The site is static, so any static host works for free.

- **GitHub Pages:** in the repository settings, set Pages to deploy from GitHub Actions, then run the "Deploy to GitHub Pages" workflow from the Actions tab. It never runs on its own.
- **Vercel, Netlify or Cloudflare Pages:** set the root directory to `frontend`, the build command to `npm run build` and the output directory to `dist`.
- **Streamlit** runs Python apps, so this React site would not run there as it is.

## Roadmap

1. Globe, timeline, contact graph, knowledge engine and question matcher (done)
2. An optional language-model layer for free-form questions, constrained to the data (needs a small server and an API key)
3. Grow the dataset, especially oral-tradition and non-written histories, and add a map view with regions
