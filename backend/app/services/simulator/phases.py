from __future__ import annotations

import random
from typing import Literal

DrivingPhase = Literal[
    "idle",
    "launch",
    "acceleration",
    "braking",
    "cornering",
    "cooldown",
    "fault",
]

PHASE_SEQUENCE: list[DrivingPhase] = [
    "idle",
    "launch",
    "acceleration",
    "cornering",
    "braking",
    "cooldown",
]


def phase_duration_ticks(phase: DrivingPhase, rng: random.Random) -> int:
    return {
        "idle": rng.randint(50, 90),
        "launch": rng.randint(25, 45),
        "acceleration": rng.randint(70, 120),
        "cornering": rng.randint(55, 95),
        "braking": rng.randint(35, 65),
        "cooldown": rng.randint(60, 100),
    }.get(phase, 80)
