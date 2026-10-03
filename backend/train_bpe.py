from pathlib import Path

from app.bpe import BPETokenizer


BACKEND_DIR = Path(__file__).resolve().parent
TRAINING_DATA = BACKEND_DIR / "training_data.txt"
MODEL_PATH = BACKEND_DIR / "bpe_model.json"

VOCAB_SIZE = 512


def main():
    text = TRAINING_DATA.read_text(encoding="utf-8")

    tokenizer = BPETokenizer()

    stats = tokenizer.train(
        text,
        vocab_size=VOCAB_SIZE,
    )

    tokenizer.save(MODEL_PATH)

    print("BPE training complete!")
    print(f"Training characters : {len(text)}")
    print(f"Vocabulary size     : {stats['vocab_size']}")
    print(f"Merge rules learned : {stats['merge_count']}")
    print(f"Model saved to      : {MODEL_PATH}")

    # Simple round-trip test.
    sample = "TokenLens learns byte pair encoding. 🚀"
    token_ids = tokenizer.encode(sample)
    decoded = tokenizer.decode(token_ids)

    print()
    print("Round-trip test:")
    print(f"Original : {sample}")
    print(f"Token IDs: {token_ids}")
    print(f"Decoded  : {decoded}")

    assert decoded == sample, "BPE round-trip test failed!"
    print("Round-trip test passed!")


if __name__ == "__main__":
    main()
