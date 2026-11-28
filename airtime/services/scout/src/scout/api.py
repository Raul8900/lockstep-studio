"""scout's HTTP API (contract G), on 127.0.0.1:$SCOUT_PORT."""

import logging
import sqlite3
from contextlib import asynccontextmanager

import httpx
from fastapi import FastAPI, Query, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException

from scout import SERVICE, __version__
from scout.core import Scout, UnknownMarket
from scout.markets import load_markets
from scout.models import ProbeRequest, ProbeResponse, SignalsResponse, SourcesResponse
from scout.settings import Settings

log = logging.getLogger("scout")


def _error(status: int, code: str, message: str, details: object = None) -> JSONResponse:
    body = {"error": {"code": code, "message": message, "details": jsonable_encoder(details)}}
    return JSONResponse(body, status_code=status)


def create_app(
    settings: Settings | None = None, transport: httpx.AsyncBaseTransport | None = None
) -> FastAPI:
    settings = settings or Settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.scout = Scout.open(settings, transport)
        yield
        await app.state.scout.aclose()

    app = FastAPI(title="Airtime scout", version=__version__, lifespan=lifespan)

    def scout(request: Request) -> Scout:
        return request.app.state.scout

    @app.exception_handler(UnknownMarket)
    async def _unknown_market(request: Request, exc: UnknownMarket) -> JSONResponse:
        return _error(400, "unknown_market", str(exc), {"unknown": exc.codes, "known": exc.known})

    @app.exception_handler(RequestValidationError)
    async def _invalid(request: Request, exc: RequestValidationError) -> JSONResponse:
        return _error(
            422, "invalid_request", "the request does not match the contract", exc.errors()
        )

    @app.exception_handler(HTTPException)
    async def _http(request: Request, exc: HTTPException) -> JSONResponse:
        code = "not_found" if exc.status_code == 404 else f"http_{exc.status_code}"
        return _error(exc.status_code, code, str(exc.detail))

    @app.exception_handler(Exception)
    async def _internal(request: Request, exc: Exception) -> JSONResponse:
        log.exception("unhandled error on %s", request.url.path)
        return _error(500, "internal", f"{type(exc).__name__}: {exc}")

    @app.get("/healthz")
    async def healthz() -> dict:
        return {"status": "ok", "service": SERVICE, "version": __version__}

    @app.get("/readyz")
    async def readyz(request: Request) -> JSONResponse:
        """Ready when markets.yaml is readable and the cache database answers. The free sources
        are not checked here: GET /v1/sources reports them."""
        checks = {}
        try:
            checks["markets"] = f"ok ({len(load_markets(settings.markets_path))} markets)"
        except ValueError as exc:
            checks["markets"] = f"error: {exc}"
        try:
            scout(request).store.ping()
            checks["cache"] = f"ok ({settings.cache_path})"
        except sqlite3.Error as exc:
            checks["cache"] = f"error: {exc}"
        ready = all(value.startswith("ok") for value in checks.values())
        body = {"status": "ok" if ready else "error", "service": SERVICE, "version": __version__,
                "fake": settings.fake, "checks": checks}  # fmt: skip
        return JSONResponse(body, status_code=200 if ready else 503)

    @app.get("/v1/signals", response_model=SignalsResponse)
    async def signals(
        request: Request,
        markets: str | None = Query(
            None, description="Comma-separated codes; default: all enabled"
        ),
        max_age_h: float | None = Query(None, ge=0, le=720, description="Oldest data accepted"),
    ) -> SignalsResponse:
        codes = [code.strip().upper() for code in (markets or "").split(",") if code.strip()]
        return await scout(request).signals(codes or None, max_age_h)

    @app.post("/v1/probe", response_model=ProbeResponse)
    async def probe(request: Request, body: ProbeRequest) -> ProbeResponse:
        return await scout(request).probe(body)

    @app.get("/v1/sources", response_model=SourcesResponse)
    async def sources(request: Request) -> SourcesResponse:
        return scout(request).sources()

    return app
