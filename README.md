# Chronicle

An interactive globe and timeline of human history: who existed when, and who could have known whom.

- **Globe:** a real-Earth globe you can spin. Scrub or play through 300,000 years and see who existed, with documented and plausible contact links drawn as arcs.
- **Timeline:** every entry side by side on a log or linear scale, with date uncertainty shown.
- **Connections:** pick any two entries to see whether they overlapped and what chain of links could have carried knowledge between them.

## Run it

```bash
cd frontend
npm install
npm run dev        # open the address Vite prints
npm test           # checks the "could they have known?" engine
cd .. && python3 scripts/validate.py   # checks the data files
```

## Layout

- `data/entities.json`: entries with start and end years (negative = BCE), uncertainty margins, a location and sources.
- `data/contacts.json`: links between entries with a kind, a time window, a confidence tier (documented or plausible) and sources.
- `frontend/src/lib/contact.ts`: finds the shortest, best-attested chain of links that share a window of time.
- `frontend/src/lib/time.ts`: Allen interval algebra and uncertainty-aware overlap.
- `frontend/src/components/`: globe, scrubber, timeline and page sections.
- `frontend/public/textures/`: Earth imagery (NASA Blue Marble via the three-globe package; see the README there).

## Roadmap

1. Timeline, globe, contact graph and knowledge engine (done)
2. Ask in plain language: a model turns a question into a graph query and explains the result from retrieved links only (needs a small server and an API key)
3. Grow the dataset, especially oral-tradition and non-written histories, and add a map view with regions

Sources in the dataset are starting points (mostly encyclopedia articles) and should be checked against scholarly work.
