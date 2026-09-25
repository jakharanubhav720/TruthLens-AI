from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageStat, ImageFilter
import io, math, os, re, tempfile
from urllib.parse import urlparse
import httpx
from bs4 import BeautifulSoup

app = FastAPI(title="TruthLens AI Engine", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class FakeNewsPayload(BaseModel):
    content: str
    is_url: bool = False

# A real open deepfake classifier is used when the backend dependencies are installed.
# The model is loaded lazily so the API can still start and report a useful error.
MODEL_ID = os.getenv("TRUTHLENS_MODEL", "prithivMLmods/deepfake-detector-model-v1")
_MODEL = None
_PROCESSOR = None
_DEVICE = None
_MODEL_ERROR = None
REALITY_DEFENDER_API_KEY = os.getenv("REALITY_DEFENDER_API_KEY", "").strip()


def clamp(v, lo=0, hi=100):
    return max(lo, min(hi, round(float(v), 1)))


def load_deepfake_model():
    global _MODEL, _PROCESSOR, _DEVICE, _MODEL_ERROR
    if _MODEL is not None:
        return _MODEL, _PROCESSOR, _DEVICE
    if _MODEL_ERROR is not None:
        raise RuntimeError(_MODEL_ERROR)

    try:
        import torch
        from transformers import AutoImageProcessor, AutoModelForImageClassification

        if torch.backends.mps.is_available():
            device = torch.device("mps")
        else:
            device = torch.device("cpu")

        processor = AutoImageProcessor.from_pretrained(MODEL_ID)
        model = AutoModelForImageClassification.from_pretrained(MODEL_ID)
        model.to(device)
        model.eval()

        _MODEL = model
        _PROCESSOR = processor
        _DEVICE = device
        return _MODEL, _PROCESSOR, _DEVICE
    except Exception as exc:
        _MODEL_ERROR = (
            "The deepfake model could not be loaded. Install the ML dependencies with "
            "`python -m pip install -r requirements.txt` and restart the backend. "
            f"Details: {exc}"
        )
        raise RuntimeError(_MODEL_ERROR)


def label_is_fake(label: str) -> bool:
    text = str(label).strip().lower().replace("_", " ").replace("-", " ")
    fake_words = ("fake", "deepfake", "synthetic", "generated", "ai", "artificial")
    return any(word in text for word in fake_words)


def model_classification(img: Image.Image):
    import torch

    model, processor, device = load_deepfake_model()
    rgb = img.convert("RGB")
    inputs = processor(images=rgb, return_tensors="pt")
    inputs = {key: value.to(device) for key, value in inputs.items()}

    with torch.no_grad():
        logits = model(**inputs).logits
        probabilities = torch.softmax(logits, dim=-1)[0].detach().cpu().tolist()

    id2label = getattr(model.config, "id2label", {}) or {}
    labels = [id2label.get(i, id2label.get(str(i), str(i))) for i in range(len(probabilities))]
    fake_probability = sum(
        probability for label, probability in zip(labels, probabilities) if label_is_fake(label)
    )

    # Some checkpoints expose two labels but use an unexpected naming scheme.
    # In that case, use the documented Class 0=fake / Class 1=real convention.
    if not any(label_is_fake(label) for label in labels) and len(probabilities) == 2:
        fake_probability = probabilities[0]

    fake_probability = float(fake_probability)
    prediction = (
        "Likely AI-generated" if fake_probability >= 0.65
        else "Likely authentic" if fake_probability <= 0.35
        else "Inconclusive"
    )

    # A probability near the middle is deliberately treated as inconclusive.
    confidence = abs(fake_probability - 0.5) * 200

    signals = []
    for label, probability in sorted(zip(labels, probabilities), key=lambda x: x[1], reverse=True):
        signals.append({
            "name": str(label).title(),
            "score": clamp(probability * 100),
            "description": "Model classification probability for this class."
        })

    return {
        "score": clamp(fake_probability * 100),
        "fakeProbability": clamp(fake_probability * 100),
        "prediction": prediction,
        "risk": "high" if fake_probability >= 0.65 else ("low" if fake_probability <= 0.35 else "medium"),
        "confidence": clamp(confidence),
        "explanation": (
            "The trained image classifier estimates this image is likely AI-generated. "
            "This is a model prediction, not proof of manipulation."
            if prediction == "Likely AI-generated" else
            "The trained image classifier estimates this image is likely authentic. "
            "This is a model prediction, not proof of authenticity."
            if prediction == "Likely authentic" else
            "The trained image classifier is not confident enough to separate authentic and synthetic content. "
            "Treat this result as inconclusive."
        ),
        "signals": signals,
        "modelsUsed": [MODEL_ID],
        "metadata": {"width": img.width, "height": img.height, "format": img.format},
    }


async def reality_defender_analysis(data: bytes, filename: str):
    """Run Reality Defender as a second, independent detector when configured.

    The API key stays server-side. Failures are reported as unavailable so the local
    detector can still provide a result rather than turning the whole scan into an error.
    """
    if not REALITY_DEFENDER_API_KEY:
        return {
            "status": "not_configured",
            "provider": "Reality Defender",
            "message": "Add REALITY_DEFENDER_API_KEY to the backend .env file to enable external verification.",
        }

    temp_path = None
    try:
        from realitydefender import RealityDefender

        suffix = os.path.splitext(filename or "image.jpg")[1].lower() or ".jpg"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(data)
            temp_path = tmp.name

        client = RealityDefender(api_key=REALITY_DEFENDER_API_KEY)
        upload = await client.upload(file_path=temp_path)
        request_id = upload["request_id"]
        result = await client.get_result(request_id)

        raw_score = result.get("score")
        score = float(raw_score) if raw_score is not None else None
        # Reality Defender documents score as 0-1 in its SDK; normalize defensively.
        if score is not None and score > 1:
            score = score / 100.0
        score_pct = clamp((score or 0) * 100) if score is not None else None
        status = str(result.get("status", "UNKNOWN")).upper()
        models = []
        for model in result.get("models", []) or []:
            models.append({
                "name": str(model.get("name", "Model")),
                "status": str(model.get("status", "UNKNOWN")),
                "score": clamp(float(model.get("score", 0)) * 100 if float(model.get("score", 0)) <= 1 else float(model.get("score", 0))),
            })

        return {
            "status": "complete",
            "provider": "Reality Defender",
            "requestId": request_id,
            "classification": status,
            "score": score_pct,
            "models": models,
            "heatmaps": result.get("heatmaps"),
        }
    except Exception as exc:
        return {
            "status": "error",
            "provider": "Reality Defender",
            "message": f"External detector unavailable: {exc}",
        }
    finally:
        if temp_path:
            try:
                os.unlink(temp_path)
            except OSError:
                pass


def combine_detector_results(local_result: dict, external_result: dict):
    """Combine two independent detectors without pretending they provide certainty."""
    local_pct = float(local_result.get("fakeProbability", 50))
    external_pct = external_result.get("score") if external_result.get("status") == "complete" else None

    local_pred = local_result.get("prediction")
    if external_pct is None:
        local_result["verification"] = {
            "mode": "local_only",
            "external": external_result,
            "agreement": "not_available",
        }
        local_result["modelsUsed"] = local_result.get("modelsUsed", []) + ["Reality Defender (not configured)"]
        return local_result

    # Reality Defender's public SDK returns an overall score and classification.
    # We treat the provider classification as authoritative for its own result and
    # use the local model only as an independent cross-check.
    external_class = str(external_result.get("classification", "UNKNOWN")).upper()
    external_fake = external_pct
    external_prediction = (
        "Likely AI-generated" if external_class in {"MANIPULATED", "FAKE", "ARTIFICIAL"} or external_fake >= 65
        else "Likely authentic" if external_class in {"AUTHENTIC", "REAL"} or external_fake <= 35
        else "Inconclusive"
    )
    agreement = "agree" if external_prediction == local_pred else "disagree"

    # If providers disagree, do not average into a fake-looking precision number.
    if agreement == "disagree":
        final_prediction = "Inconclusive"
        final_score = round((local_pct + external_fake) / 2, 1)
        explanation = (
            f"The local model and Reality Defender disagree. Local model: {local_pred} ({local_pct:.1f}%). "
            f"Reality Defender: {external_prediction} ({external_fake:.1f}%). Treat the result as inconclusive."
        )
    else:
        final_prediction = local_pred
        final_score = round((local_pct + external_fake) / 2, 1)
        explanation = (
            f"The local model and Reality Defender currently agree: {final_prediction}. "
            f"Local model: {local_pct:.1f}%; Reality Defender: {external_fake:.1f}%. "
            "This is a screening assessment, not proof of authenticity or manipulation."
        )

    confidence = clamp(abs(local_pct - external_fake) * 0.5 + max(local_result.get("confidence", 0), 0))
    local_result.update({
        "score": final_score,
        "fakeProbability": final_score,
        "prediction": final_prediction,
        "risk": "high" if final_prediction == "Likely AI-generated" and final_score >= 65 else ("low" if final_prediction == "Likely authentic" and final_score <= 35 else "medium"),
        "confidence": confidence,
        "explanation": explanation,
        "modelsUsed": local_result.get("modelsUsed", []) + ["Reality Defender"],
        "verification": {
            "mode": "cross_checked",
            "external": external_result,
            "local": {"prediction": local_pred, "fakeProbability": local_pct},
            "agreement": agreement,
        },
    })
    return local_result


def basic_forensics(img: Image.Image):
    """Supporting diagnostics only; never converted into a fake/real verdict."""
    gray = img.convert("L")
    small = gray.resize((min(512, gray.width), min(512, gray.height)))
    stat = ImageStat.Stat(small)
    mean, variance = stat.mean[0], stat.var[0]
    edges = small.filter(ImageFilter.FIND_EDGES)
    edge_mean = ImageStat.Stat(edges).mean[0]
    entropy_like = min(100, math.log2(max(1, variance + 1)) * 10)
    return [
        {"name": "Texture variance", "score": clamp(entropy_like), "description": "Describes grayscale texture variation; it is not a standalone deepfake test."},
        {"name": "Edge energy", "score": clamp(edge_mean), "description": "Describes edge intensity; unusual values can have many non-AI causes."},
        {"name": "Average luminance", "score": clamp(mean / 255 * 100), "description": "Reports overall image brightness for context."},
    ]


async def fetch_article(url: str):
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.netloc:
        raise HTTPException(status_code=400, detail="Please enter a valid http(s) URL.")
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=10, headers={"User-Agent": "TruthLensAI/3.0"}) as client:
            r = await client.get(url)
            r.raise_for_status()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not fetch the URL: {str(e)}")
    soup = BeautifulSoup(r.text, "html.parser")
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    paragraphs = [p.get_text(" ", strip=True) for p in soup.find_all("p")]
    text = " ".join(paragraphs)
    return title, text[:20000], str(r.url)


def text_credibility_inference(text: str, source_url: str | None = None):
    text = re.sub(r"\s+", " ", text).strip()
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 30]
    sensational = len(re.findall(r"\b(shocking|breaking|urgent|secret|miracle|guaranteed|exposed|you won't believe)\b", text, re.I))
    absolute = len(re.findall(r"\b(always|never|everyone|nobody|100%|undeniable|proves)\b", text, re.I))
    missing_attribution = len([s for s in sentences[:10] if not re.search(r"\b(according to|said|reported|official|study|research)\b", s, re.I)])
    concern = max(0, sensational * 8 + absolute * 6 + max(0, missing_attribution - 3) * 3)
    credibility = clamp(100 - concern)
    risk = "high" if credibility < 40 else ("medium" if credibility < 65 else "low")
    confidence = clamp(55 + min(35, len(text) / 400))
    claims = []
    if sensational:
        claims.append("Sensational or urgency-heavy wording was detected.")
    if absolute:
        claims.append("Absolute language was detected; these statements need source-level verification.")
    if missing_attribution > 3:
        claims.append("Several statements lack clear attribution or a cited source.")
    if not claims:
        claims.append("No strong red-flag language was detected by the local screening rules.")
    sources = []
    if source_url:
        domain = urlparse(source_url).netloc.lower().removeprefix("www.")
        sources.append({"domain": domain, "stance": "neutral", "trustScore": 50, "url": source_url})
    return {
        "score": credibility,
        "risk": risk,
        "confidence": confidence,
        "explanation": "This is a first-pass credibility screening based on language and attribution. It does not establish whether a claim is true or false.",
        "suspiciousClaims": claims,
        "sources": sources,
        "modelsUsed": ["TruthLens Credibility Heuristics v3"],
        "limitations": [
            "No claim is labeled true or false without independent evidence.",
            "For high-stakes decisions, verify important claims against primary sources.",
        ],
    }


@app.post("/api/detect/deepfake")
async def detect_deepfake(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Please upload a JPG, PNG, WEBP, or other supported image.")
    data = await file.read()
    if len(data) > 15 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is larger than 15 MB.")
    try:
        image = Image.open(io.BytesIO(data))
        result = model_classification(image)
        external = await reality_defender_analysis(data, file.filename or "image.jpg")
        result = combine_detector_results(result, external)
        result["supportingDiagnostics"] = basic_forensics(image)
        result["metadata"]["fileSizeKb"] = round(len(data) / 1024, 1)
        return result
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not analyze image: {str(e)}")


@app.post("/api/detect/fake-news")
async def detect_fake_news(payload: FakeNewsPayload):
    if not payload.content.strip():
        raise HTTPException(status_code=400, detail="Text or URL cannot be empty.")
    source_url = None
    text = payload.content
    if payload.is_url:
        title, article_text, final_url = await fetch_article(payload.content.strip())
        source_url = final_url
        text = f"{title}. {article_text}"
        if len(text) < 80:
            raise HTTPException(status_code=422, detail="The page did not contain enough readable article text.")
    return text_credibility_inference(text, source_url)


@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "service": "TruthLens AI Core",
        "version": "4.0.0",
        "deepfakeModel": MODEL_ID,
        "modelLoaded": _MODEL is not None,
    }
