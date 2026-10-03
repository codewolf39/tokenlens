from collections import Counter
import json
from pathlib import Path


class BPETokenizer:
    """
    A small educational byte-level BPE tokenizer.

    Base vocabulary:
        0..255 = every possible byte value.

    Learned vocabulary:
        256+ = byte sequences created by BPE merges.
    """

    def __init__(self):
        self.vocab = {i: bytes([i]) for i in range(256)}
        self.merges = {}       # (left_id, right_id) -> new_token_id
        self.merge_ranks = {}  # pair -> order in which it was learned

    @staticmethod
    def _get_pair_counts(sequence):
        return Counter(zip(sequence, sequence[1:]))

    @staticmethod
    def _merge_pair(sequence, pair, new_id):
        merged = []
        i = 0

        while i < len(sequence):
            if (
                i < len(sequence) - 1
                and (sequence[i], sequence[i + 1]) == pair
            ):
                merged.append(new_id)
                i += 2
            else:
                merged.append(sequence[i])
                i += 1

        return merged

    def train(self, text, vocab_size=512):
        if vocab_size < 256:
            raise ValueError("vocab_size must be at least 256.")

        # Start with UTF-8 bytes.
        sequence = list(text.encode("utf-8"))

        next_id = 256

        while len(self.vocab) < vocab_size:
            pair_counts = self._get_pair_counts(sequence)

            if not pair_counts:
                break

            # Most frequent pair wins.
            # The extra terms make ties deterministic.
            best_pair, best_count = max(
                pair_counts.items(),
                key=lambda item: (
                    item[1],
                    -item[0][0],
                    -item[0][1],
                ),
            )

            # A merge should occur only when the pair appears at least twice.
            if best_count < 2:
                break

            new_id = next_id

            self.merges[best_pair] = new_id
            self.merge_ranks[best_pair] = len(self.merge_ranks)

            # The new token represents the bytes of both old tokens.
            self.vocab[new_id] = (
                self.vocab[best_pair[0]]
                + self.vocab[best_pair[1]]
            )

            sequence = self._merge_pair(
                sequence,
                best_pair,
                new_id,
            )

            next_id += 1

        return {
            "vocab_size": len(self.vocab),
            "merge_count": len(self.merges),
        }

    def encode(self, text):
        """
        Convert text -> our learned BPE token IDs.
        """
        sequence = list(text.encode("utf-8"))

        while len(sequence) > 1:
            candidates = []

            for pair in zip(sequence, sequence[1:]):
                if pair in self.merge_ranks:
                    candidates.append((self.merge_ranks[pair], pair))

            if not candidates:
                break

            # Apply the highest-priority (earliest learned) merge.
            _, best_pair = min(candidates)

            sequence = self._merge_pair(
                sequence,
                best_pair,
                self.merges[best_pair],
            )

        return sequence

    def token_bytes(self, token_id):
        if token_id not in self.vocab:
            raise ValueError(f"Unknown token ID: {token_id}")

        return self.vocab[token_id]

    def decode(self, token_ids):
        raw_bytes = b"".join(
            self.token_bytes(token_id)
            for token_id in token_ids
        )

        return raw_bytes.decode(
            "utf-8",
            errors="replace",
        )

    def save(self, path):
        path = Path(path)

        data = {
            "vocab": {
                str(token_id): list(token_bytes)
                for token_id, token_bytes in self.vocab.items()
            },
            "merges": [
                [left, right, new_id]
                for (left, right), new_id in self.merges.items()
            ],
        }

        path.write_text(
            json.dumps(data, indent=2),
            encoding="utf-8",
        )

    @classmethod
    def load(cls, path):
        path = Path(path)
        data = json.loads(
            path.read_text(encoding="utf-8")
        )

        tokenizer = cls()

        tokenizer.vocab = {
            int(token_id): bytes(byte_values)
            for token_id, byte_values in data["vocab"].items()
        }

        tokenizer.merges = {}
        tokenizer.merge_ranks = {}

        for rank, (left, right, new_id) in enumerate(data["merges"]):
            pair = (left, right)
            tokenizer.merges[pair] = new_id
            tokenizer.merge_ranks[pair] = rank

        return tokenizer
