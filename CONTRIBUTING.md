# Contributing to Your Senior

Thank you for your interest in contributing. This document covers the development setup, conventions, and pull request process.

## Development setup

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env       # fill in ANTHROPIC_API_KEY and YOUR_SENIOR_API_KEY
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Code conventions

### Python

- **Style:** PEP 8. Lines ≤ 88 characters.
- **Imports:** stdlib → third-party → local, each group separated by a blank line.
- **Docstrings:** Every public function and class gets a one-line docstring. Only add inline comments when the *why* is non-obvious.
- **Type hints:** Required on all function signatures.
- **No print statements** in committed code — use Python's `logging` module if you need runtime output.

### JavaScript / React

- Functional components only.
- Props are not typed with PropTypes — keep it lightweight.
- Tailwind utility classes for all styling; no inline `style` objects except where Tailwind cannot reach (e.g., dynamic `minHeight`).

## Adding a new document parser

1. Create `backend/app/ingestion/parsers/<format>_parser.py` implementing `BaseParser`.
2. Register it in `backend/app/ingestion/registry.py` by adding it to `_PARSERS`.
3. Add the MIME type to `_SUPPORTED_EXTENSIONS` in `backend/app/routers/ingest.py` if it should be uploadable.

## Pull request process

1. Fork the repository and create a feature branch from `main`.
2. Keep changes focused — one feature or fix per PR.
3. Ensure the backend starts cleanly (`uvicorn app.main:app`) and the frontend builds without errors (`npm run build`).
4. Write a clear PR description covering *what* changed and *why*.
5. A project maintainer will review and merge.

## Reporting bugs

Open a GitHub Issue with:
- Steps to reproduce
- Expected vs actual behaviour
- Backend logs if applicable (run with `--log-level debug`)
