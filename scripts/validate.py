#!/usr/bin/env python3
"""Validate data/entities.json and data/contacts.json. Run from the project root: python3 scripts/validate.py"""
import json, re, sys
from pathlib import Path

TYPES = {"person", "civilization", "event", "technology", "period", "species"}
REGIONS = {"Global", "Africa", "Europe", "Middle East", "Eurasia", "South Asia", "East Asia", "Oceania", "Americas"}
KINDS = {"trade", "diplomatic", "military", "political", "migration", "textual", "legacy", "cultural", "biological"}
# Kinds where a later party learns of an earlier one: the window only has to touch one of the two.
ONE_SIDED = {"textual", "legacy"}
TIERS = {"documented", "plausible"}
PRESENT = 2026
DATA = Path(__file__).resolve().parent.parent / "data"


def span(e):
    """Widest plausible lifetime, allowing for date uncertainty."""
    s = e["start"]["year"] - e["start"]["uncertainty"]
    en = e["end"]
    t = PRESENT if en is None else en["year"] + en["uncertainty"]
    return s, t


def check_entities(data, errors):
    seen = set()
    for i, e in enumerate(data):
        tag = e.get("id", f"#{i}")
        if tag in seen: errors.append(f"{tag}: duplicate id")
        seen.add(tag)
        if not re.fullmatch(r"[a-z0-9-]+", str(e.get("id", ""))): errors.append(f"{tag}: id must be kebab-case")
        if e.get("type") not in TYPES: errors.append(f"{tag}: bad type {e.get('type')!r}")
        if e.get("region") not in REGIONS: errors.append(f"{tag}: bad region {e.get('region')!r}")
        s, en = e.get("start"), e.get("end")
        if not isinstance(s, dict) or not isinstance(s.get("year"), int) or s.get("uncertainty", -1) < 0:
            errors.append(f"{tag}: bad start"); continue
        if en is not None:
            if not isinstance(en.get("year"), int) or en.get("uncertainty", -1) < 0: errors.append(f"{tag}: bad end")
            elif en["year"] < s["year"]: errors.append(f"{tag}: end before start")
        if not e.get("sources"): errors.append(f"{tag}: needs at least one source")
        for u in e.get("sources", []):
            if not u.startswith("http"): errors.append(f"{tag}: source is not a URL: {u}")


def check_contacts(contacts, entities, errors):
    by_id = {e["id"]: e for e in entities}
    seen = set()
    for c in contacts:
        tag = c.get("id", "?")
        if tag in seen: errors.append(f"{tag}: duplicate contact id")
        seen.add(tag)
        if c.get("kind") not in KINDS: errors.append(f"{tag}: bad kind {c.get('kind')!r}")
        if c.get("tier") not in TIERS: errors.append(f"{tag}: bad tier {c.get('tier')!r}")
        if not c.get("sources"): errors.append(f"{tag}: needs at least one source")
        if c.get("a") == c.get("b"): errors.append(f"{tag}: a and b are the same entity")
        if c.get("a") not in by_id or c.get("b") not in by_id:
            errors.append(f"{tag}: unknown entity id"); continue
        f, t = c.get("from"), c.get("to")
        if not isinstance(f, int) or not isinstance(t, int) or f > t:
            errors.append(f"{tag}: bad window"); continue
        hits = []
        for k in ("a", "b"):
            lo, hi = span(by_id[c[k]])
            hits.append(f <= hi and t >= lo)
        ok = any(hits) if c.get("kind") in ONE_SIDED else all(hits)
        if not ok:
            errors.append(f"{tag}: window {f}..{t} falls outside the lifetime of {c['a'] if not hits[0] else c['b']}")


def main() -> int:
    entities = json.loads((DATA / "entities.json").read_text(encoding="utf-8"))
    contacts = json.loads((DATA / "contacts.json").read_text(encoding="utf-8"))
    errors = []
    check_entities(entities, errors)
    check_contacts(contacts, entities, errors)
    for m in errors: print("ERROR", m)
    print(f"{len(entities)} entities, {len(contacts)} contacts checked, {len(errors)} problem(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
