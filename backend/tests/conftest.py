import os
from pathlib import Path

import pytest

TEST_RUN_DIR = Path(__file__).parent / "_test_runs"

# Configure test environment before app modules load.
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite:///:memory:")
os.environ.setdefault("STORAGE_BACKEND", "local")
os.environ.setdefault("RUN_DATA_DIR", str(TEST_RUN_DIR))


@pytest.fixture()
def tmp_run_dir(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> Path:
    run_dir = tmp_path / "runs"
    run_dir.mkdir()
    monkeypatch.setenv("RUN_DATA_DIR", str(run_dir))
    monkeypatch.setenv("DATABASE_URL", f"sqlite+aiosqlite:///{tmp_path / 'test.db'}")
    return run_dir
