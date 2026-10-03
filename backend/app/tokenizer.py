from pathlib import Path

from app.bpe import BPETokenizer


BACKEND_DIR = Path(__file__).resolve().parent.parent
MODEL_PATH = BACKEND_DIR / "bpe_model.json"


def load_tokenizer():
    """
    Load the BPE model trained by train_bpe.py.
    """
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            "bpe_model.json was not found. "
            "Run: uv run python train_bpe.py"
        )

    return BPETokenizer.load(MODEL_PATH)


encoding = load_tokenizer()


def tokenize_text(text: str):
    """
    Convert text into our own BPE tokens and return the
    same JSON structure expected by the React frontend.
    """
    token_ids = encoding.encode(text)

    tokens = []

    for position, token_id in enumerate(token_ids):
        token_bytes = encoding.token_bytes(token_id)

        token_text = token_bytes.decode(
            "utf-8",
            errors="replace",
        )

        tokens.append({
            "position": position,
            "text": token_text,
            "id": token_id,
            "bytes": list(token_bytes),
        })

    return {
        "text": text,
        "tokens": tokens,
        "token_count": len(tokens),
        "character_count": len(text),
        "word_count": len(text.split()),
    }
