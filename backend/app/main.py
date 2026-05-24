from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import build_api_router
from app.core.config import settings
from app.core.state import build_app_state

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    app_state = build_app_state()
    app.state.app_state = app_state
    await app_state.telemetry.start()
    logger.info("Telemetry stream started at %.1f Hz (mode=%s)", settings.sample_hz, settings.telemetry_mode)
    yield
    await app_state.telemetry.stop()
    logger.info("Telemetry stream stopped")


def create_app() -> FastAPI:
    application = FastAPI(
        title="Formula Student EV Telemetry Backend",
        version="0.2.0",
        lifespan=lifespan,
        description="Mock-first live telemetry API for Formula Student EV data acquisition demos.",
    )
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    application.include_router(build_api_router())
    return application


app = create_app()
