# Chronicle

An interactive map of human history: who existed when, who overlapped, and (soon) who could have known whom.

## Run it

```bash
cd frontend && npm install && npm run dev
python3 scripts/validate.py     # from the project root: checks data/entities.json
```

## Layout

- `data/entities.json`: the dataset (the source of truth). Years are integers, negative = BCE, each with a +/- uncertainty.
- `frontend/src/lib/time.ts`: Allen interval algebra and the "were they contemporaries?" logic, uncertainty-aware.
- `frontend/src/lib/scale.ts`: log and linear time scales.
- `frontend/src/components/`: SVG timeline and side panel.
- `scripts/validate.py`: dataset checks.

## Roadmap

1. Timeline, slice view and compare panel (done)
2. Contact graph: documented trade and travel links between entities, with confidence tiers
3. Natural-language questions answered from the graph, with citations (LLM as the interface)
4. Map view with a time slider; grow the dataset, especially oral-tradition and non-written histories

Sources in the dataset are starting pointers (mostly Wikipedia) and should be verified against scholarly work before relying on them.
