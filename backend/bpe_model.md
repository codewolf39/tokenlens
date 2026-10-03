TokenLens — From-Scratch Byte-Level BPE

This version replaces tiktoken tokenization with a small educational byte-level BPE implementation.

Files

app/bpe.py — BPE training, encoding, decoding, save/load.

app/tokenizer.py — adapter used by the FastAPI /tokenize endpoint.

training_data.txt — corpus used to train the tokenizer.

train_bpe.py — retrains the model.

bpe_model.json — generated vocabulary + merge rules.

Current model

Vocabulary size: 512

Learned merge rules: 256

Base vocabulary: 256 UTF-8 byte values.

Retrain

From the backend directory:

uv run python train_bpe.py

Then start FastAPI as usual:

uv run uvicorn app.main:app --reload

The existing React frontend can continue calling:

POST http://localhost:8000/tokenize

The response shape remains compatible with the current UI.
