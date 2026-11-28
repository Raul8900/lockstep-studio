"""scout's command line: `scout serve` runs the API; `scout collect --markets US,IN` collects now
and prints what each source gave."""

import argparse
import asyncio
import json
import sys
from collections import Counter

from scout.core import Scout, UnknownMarket
from scout.settings import Settings


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="scout", description="Airtime scout: free trend signals")
    commands = parser.add_subparsers(dest="command", required=True)
    serve = commands.add_parser("serve", help="run the HTTP API")
    serve.add_argument("--host", help="default: SCOUT_HOST / AIRTIME_HOST or 127.0.0.1")
    serve.add_argument("--port", type=int, help="default: SCOUT_PORT or 8002")
    collect = commands.add_parser("collect", help="collect signals now; print a count per source")
    collect.add_argument("--markets", help="comma-separated codes (default: every enabled market)")
    collect.add_argument(
        "--max-age-h",
        type=float,
        help="refetch anything older than this (0: all, within the floor)",
    )
    collect.add_argument("--json", action="store_true", help="print the SignalsResponse JSON")
    args = parser.parse_args(argv)
    settings = Settings()
    if args.command == "serve":
        import uvicorn

        from scout.api import create_app

        uvicorn.run(
            create_app(settings), host=args.host or settings.host, port=args.port or settings.port
        )
        return 0
    codes = [code.strip().upper() for code in (args.markets or "").split(",") if code.strip()]
    try:
        return asyncio.run(_collect(settings, codes or None, args.max_age_h, args.json))
    except UnknownMarket as exc:
        print(f"scout: {exc}", file=sys.stderr)
        return 2


async def _collect(
    settings: Settings, codes: list[str] | None, max_age_h: float | None, as_json: bool
) -> int:
    scout = Scout.open(settings)
    try:
        response = await scout.signals(codes, max_age_h)
    finally:
        await scout.aclose()
    if as_json:
        print(json.dumps(response.model_dump(mode="json"), ensure_ascii=False, indent=2))
    else:
        print(f"{'market':<7}{'source':<22}{'key':<9}{'state':<8}{'items':>5}  note")
        for pack in response.packs:
            errors = {(error.source, error.key): error for error in pack.errors}
            for part in pack.sources:
                error = errors.get((part.source, part.key))
                note = f"{error.code}: {error.message}" if error else ""
                columns = f"{pack.market:<7}{part.source:<22}{part.key:<9}{part.state:<8}"
                print(f"{columns}{part.item_count:>5}  {note}")
        totals: Counter[str] = Counter()
        for pack in response.packs:
            totals.update(item.source for item in pack.items)
        print(
            "items per source:", ", ".join(f"{source} {count}" for source, count in totals.items())
        )
    failed = any(part.state == "failed" for pack in response.packs for part in pack.sources)
    return 1 if failed else 0
