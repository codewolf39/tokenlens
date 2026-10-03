import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [selectedToken, setSelectedToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [contextLimit, setContextLimit] = useState(8192);
  const [reservedOutput, setReservedOutput] = useState(1000);

  const [compareText, setCompareText] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const tokenizeText = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setSelectedToken(null);

    try {
      const response = await fetch(`${API_URL}/tokenize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text,
        }),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error("Failed to tokenize:", error);
    } finally {
      setLoading(false);
    }
  };
  const compareTexts = async () => {
    if (!text.trim() || !compareText.trim()) return;

    setCompareLoading(true);

    try {
      const [firstResponse, secondResponse] = await Promise.all([
        fetch(`${API_URL}/tokenize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: text,
          }),
        }),
        fetch(`${API_URL}/tokenize`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: compareText,
          }),
        }),
      ]);

      const [firstData, secondData] = await Promise.all([
        firstResponse.json(),
        secondResponse.json(),
      ]);

      setCompareResult({
        first: firstData,
        second: secondData,
      });
    } catch (error) {
      console.error("Failed to compare texts:", error);
    } finally {
      setCompareLoading(false);
    }
  };

  const usedTokens = result?.token_count || 0;

  const availableForOutput = contextLimit - usedTokens;

  const usagePercentage = Math.min((usedTokens / contextLimit) * 100, 100);

  const contextExceeded = usedTokens > contextLimit;

  const contextWarning = usagePercentage >= 80 && !contextExceeded;

  return (
   
    <div className="app">
      <header>
        <h1>TokenLens</h1>

        <p>See how an LLM sees your text.</p>
      </header>

      <main>
        {/* TEXT INPUT */}

        <section className="input-section">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter some text..."
          />

          <button onClick={tokenizeText}>
            {loading ? "Tokenizing..." : "Tokenize"}
          </button>
        </section>

        {result && (
          <section className="results">
            {/* STATISTICS */}

            <div className="statistics">
              <div>
                <span>Characters</span>
                <strong>{result.character_count}</strong>
              </div>

              <div>
                <span>Words</span>
                <strong>{result.word_count}</strong>
              </div>

              <div>
                <span>Tokens</span>
                <strong>{result.token_count}</strong>
              </div>
            </div>

            {/* CONTEXT WINDOW */}

            <section className="context-section">
              <div className="context-header">
                <h2>Context Window</h2>

                <select
                  value={contextLimit}
                  onChange={(e) =>
                    setContextLimit(Number(e.target.value))
                  }
                >
                  <option value={4096}>4K tokens</option>
                  <option value={8192}>8K tokens</option>
                  <option value={16384}>16K tokens</option>
                  <option value={32768}>32K tokens</option>
                  <option value={131072}>128K tokens</option>
                </select>
              </div>

              <div className="context-stats">
                <div>
                  <span>Used</span>
                  <strong>{usedTokens}</strong>
                </div>

                <div>
                  <span>Remaining</span>
                  <strong>{Math.max(availableForOutput, 0)}</strong>
                </div>

                <div>
                  <span>Usage</span>
                  <strong>{usagePercentage.toFixed(2)}%</strong>
                </div>
              </div>

              <div className="progress-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${usagePercentage}%`,
                  }}
                />
              </div>

              {contextExceeded && (
                <div className="context-error">
                  ❌ Context window exceeded by{" "}
                  {usedTokens - contextLimit} tokens.
                </div>
              )}

              {contextWarning && (
                <div className="context-warning">
                  ⚠️ Your context window is more than 80% full.
                </div>
              )}
            </section>

            {/* TOKEN VISUALIZATION */}

            <h2>Token Visualization</h2>

            <div className="tokens">
              {result.tokens.map((token) => (
                <button
                  className={`token ${
                    selectedToken?.position === token.position ? "selected" : ""
                  }`}
                  key={token.position}
                  onClick={() => setSelectedToken(token)}
                >
                  <span className="token-text">
                    {token.text.replace(/ /g, "␠")}
                  </span>

                  <span className="token-id">ID: {token.id}</span>
                </button>
              ))}
            </div>

            {/* TEXT COMPARISON */}

            <section className="comparison-section">
              <div className="comparison-header">
                <div>
                  <h2>Compare Text</h2>
                  <p>
                    Compare how the same tokenizer represents two pieces of text.
                  </p>
                </div>

                <button
                  onClick={compareTexts}
                  disabled={!text.trim() || !compareText.trim() || compareLoading}
                >
                  {compareLoading ? "Comparing..." : "Compare"}
                </button>
              </div>

              <textarea
                value={compareText}
                onChange={(e) => setCompareText(e.target.value)}
                placeholder="Enter a second text to compare..."
              />

              {compareResult && (
                <div className="comparison-results">
                  <div className="comparison-card">
                    <h3>Text A</h3>
                    <p>{compareResult.first.text}</p>

                    <div className="comparison-stat">
                      <span>Characters</span>
                      <strong>{compareResult.first.character_count}</strong>
                    </div>

                    <div className="comparison-stat">
                      <span>Words</span>
                      <strong>{compareResult.first.word_count}</strong>
                    </div>

                    <div className="comparison-stat">
                      <span>Tokens</span>
                      <strong>{compareResult.first.token_count}</strong>
                    </div>
                  </div>

                  <div className="comparison-card">
                    <h3>Text B</h3>
                    <p>{compareResult.second.text}</p>

                    <div className="comparison-stat">
                      <span>Characters</span>
                      <strong>{compareResult.second.character_count}</strong>
                    </div>

                    <div className="comparison-stat">
                      <span>Words</span>
                      <strong>{compareResult.second.word_count}</strong>
                    </div>

                    <div className="comparison-stat">
                      <span>Tokens</span>
                      <strong>{compareResult.second.token_count}</strong>
                    </div>
                  </div>

                  <div className="comparison-summary">
                    <span>Token difference</span>

                    <strong>
                      {Math.abs(
                        compareResult.first.token_count -
                        compareResult.second.token_count
                      )}{" "}
                      tokens
                    </strong>

                    <p>
                      {compareResult.first.token_count >
                      compareResult.second.token_count
                        ? "Text A uses more tokens."
                        : compareResult.first.token_count <
                          compareResult.second.token_count
                        ? "Text B uses more tokens."
                        : "Both texts use the same number of tokens."}
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* TOKEN DETAILS */}

            {selectedToken && (
              <section className="token-details">
                <h2>Token Details</h2>

                <div className="detail-row">
                  <span>Text</span>

                  <code>"{selectedToken.text}"</code>
                </div>

                <div className="detail-row">
                  <span>Token ID</span>

                  <strong>{selectedToken.id}</strong>
                </div>

                <div className="detail-row">
                  <span>Position</span>

                  <strong>{selectedToken.position}</strong>
                </div>

                <div className="detail-row">
                  <span>UTF-8 Bytes</span>

                  <code>[{selectedToken.bytes.join(", ")}]</code>
                </div>

                <div className="detail-row">
                  <span>Byte Count</span>

                  <strong>{selectedToken.bytes.length}</strong>
                </div>
              </section>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
