#!/usr/bin/env python3
"""Validate data/entities.json. Run from the project root: python3 scripts/validate.py"""
import json, re, sys
from pathlib import Path

TYPES = {"person", "civilization", "event", "technology", "period", "species"}
REGIONS = {"Global", "Africa", "Europe", "Middle East", "Eurasia", "South Asia", "East Asia", "Oceania", "Americas"}
PATH = Path(__file__).resolve().parent.parent / "data" / "entities.json"

def main() -> int:
    data = json.loads(PATH.read_text(encoding="utf-8"))
    errors, seen = [], set()
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
    for m in errors: print("ERROR", m)
    print(f"{len(data)} entities checked, {len(errors)} problem(s)")
    return 1 if errors else 0

if __name__ == "__main__":
    sys.exit(main())
