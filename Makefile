.PHONY: install backend frontend test lint docker lint-dbc validate

PYTHON ?= python3

install:
	cd backend && $(PYTHON) -m pip install -e ".[dev]"
	cd frontend && npm ci

backend:
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && $(PYTHON) -m pytest -q
	cd backend && $(PYTHON) -m compileall -q app
	cd frontend && npm run typecheck
	cd frontend && npm run build

lint:
	cd backend && $(PYTHON) -m ruff check app tests
	cd backend && $(PYTHON) -m ruff format --check app tests
	cd frontend && npm run typecheck

docker:
	docker compose up --build

validate:
	docker compose config
	$(PYTHON) tools/dbc_lint.py dbc/fs_ev_example.dbc

lint-dbc:
	$(PYTHON) tools/dbc_lint.py dbc/fs_ev_example.dbc
