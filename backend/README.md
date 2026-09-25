# TruthLens AI — Backend

FastAPI backend for TruthLens AI. It runs the local deepfake model and optionally cross-checks scans with Reality Defender.

## Local setup

```bash
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Add your Reality Defender key to `.env`:

```env
REALITY_DEFENDER_API_KEY=your_key
TRUTHLENS_MODEL=prithivMLmods/deepfake-detector-model-v1
```

Start the API:

```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Health check:

```text
GET /api/health
```

## Deployment

This backend needs a Python runtime and enough memory for PyTorch + Transformers. A VM/container service such as Render, Railway, Fly.io, or a similar Python host is more suitable than a static host.

Set these environment variables on the backend host:

- `REALITY_DEFENDER_API_KEY`
- `TRUTHLENS_MODEL` (optional)

After deployment, put the backend URL into the frontend's `NEXT_PUBLIC_API_URL`.

## Security

Never put `REALITY_DEFENDER_API_KEY` in the frontend or any `NEXT_PUBLIC_*` variable.
