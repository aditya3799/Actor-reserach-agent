import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Play, Zap, Shield, Cpu, RefreshCw, Layers, CheckCircle2, AlertCircle, FileText } from "lucide-react";

const PRESET_QUERIES = [
  "What makes actor-based architectures suitable for durable multi-agent AI systems?",
  "How do stateful actors compare to serverless lambdas for long-running AI research?",
  "What are the latest breakthroughs in state checkpointing for autonomous agent clusters?"
];

export default function App() {
  const [query, setQuery] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "planning" | "researching" | "done">("idle");
  const [subQuestions, setSubQuestions] = useState<string[]>([]);
  const [findings, setFindings] = useState<Record<string, string>>({});
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [crashDemoModal, setCrashDemoModal] = useState(false);
  const [crashResult, setCrashResult] = useState<any>(null);
  const [eventLogs, setEventLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setEventLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 19)]);
  };

  // Poll active research state if running
  useEffect(() => {
    if (!sessionId || status === "done") return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/research/${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
          if (data.subQuestions) setSubQuestions(data.subQuestions);
          if (data.findings) setFindings(data.findings);
          if (data.report) setReport(data.report);
        }
      } catch (err) {
        // Retry silently
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [sessionId, status]);

  const handleStartResearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    setQuery(searchQuery);
    setSubQuestions([]);
    setFindings({});
    setReport("");
    setStatus("planning");
    addLog(`Initiating research workflow: "${searchQuery}"`);

    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery })
      });

      const data = await res.json();
      if (data.sessionId) {
        setSessionId(data.sessionId);
        addLog(`Session registered: ${data.sessionId}`);
      }
    } catch (err: any) {
      addLog(`Error starting research: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunCrashDemo = async () => {
    setCrashDemoModal(true);
    setCrashResult(null);
    try {
      const res = await fetch("/api/crash-demo", { method: "POST" });
      const data = await res.json();
      setCrashResult(data);
    } catch (err: any) {
      setCrashResult({ error: err.message });
    }
  };

  const completedCount = Object.keys(findings).length;
  const totalCount = subQuestions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <div className="logo-group">
          <div className="logo-badge">RIVET ACTORS</div>
          <div>
            <h1 className="title">Durable Multi-Agent Research System</h1>
            <p className="subtitle">Stateful parallel worker actors with automatic checkpoint recovery</p>
          </div>
        </div>
        <div>
          <button className="btn-secondary btn-crash" onClick={handleRunCrashDemo}>
            <Zap size={16} /> Simulate Worker Crash & Resume
          </button>
        </div>
      </header>

      {/* Query Form Card */}
      <div className="card">
        <h2 style={{ fontSize: "16px", fontWeight: "600" }}>Submit Research Question</h2>
        <div className="form-group">
          <input
            type="text"
            className="input-field"
            placeholder="e.g. What makes actor-based architectures suitable for durable multi-agent AI systems?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartResearch(query)}
          />
          <button
            className="btn-primary"
            onClick={() => handleStartResearch(query)}
            disabled={loading || !query.trim()}
          >
            {loading ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} />} Run Research
          </button>
        </div>

        <div className="presets">
          <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center" }}>Presets:</span>
          {PRESET_QUERIES.map((q, idx) => (
            <button key={idx} className="preset-chip" onClick={() => { setQuery(q); handleStartResearch(q); }}>
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Active Session Status & Progress */}
      {sessionId && (
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Session: {sessionId}</span>
              <h3 style={{ fontSize: "18px", fontWeight: "600", marginTop: "2px" }}>
                Status: <span style={{ color: "var(--accent-orange)" }}>{status.toUpperCase()}</span>
              </h3>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--accent-blue)" }}>
                {completedCount} / {totalCount} Workers Finished ({progressPercent}%)
              </span>
            </div>
          </div>

          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Sub-Questions Checklist */}
          {subQuestions.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <h4 style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "8px" }}>Parallel Sub-Question Workers:</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {subQuestions.map((sq, idx) => {
                  const isDone = Boolean(findings[sq]);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "rgba(255, 255, 255, 0.03)",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color)"
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={16} color="var(--accent-blue)" />
                      ) : (
                        <RefreshCw className="animate-spin" size={16} color="var(--accent-orange)" />
                      )}
                      <span style={{ fontSize: "14px", flex: 1 }}>Worker {idx + 1}: {sq}</span>
                      <span style={{ fontSize: "12px", color: isDone ? "var(--accent-blue)" : "var(--text-muted)" }}>
                        {isDone ? "Synthesized" : "Researching..."}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Findings & Report */}
      <div className="grid-2">
        {/* Worker Findings Column */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Cpu size={18} color="var(--accent-orange)" /> Worker Findings Streams
          </h2>

          {Object.keys(findings).length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <Layers size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
              <p>No worker findings compiled yet. Submit a research query above to begin.</p>
            </div>
          ) : (
            Object.entries(findings).map(([sq, ans], idx) => (
              <div key={idx} className="card">
                <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--accent-blue)", marginBottom: "10px" }}>
                  Worker {idx + 1}: {sq}
                </h3>
                <div style={{ fontSize: "14px", color: "#cbd5e1", whiteSpace: "pre-wrap" }}>
                  {ans}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Final Report Column */}
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={18} color="var(--accent-purple)" /> Compiled Research Report
          </h2>

          <div className="card" style={{ minHeight: "350px" }}>
            {report ? (
              <div className="markdown-body">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-muted)" }}>
                <Shield size={32} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p>Report will be compiled automatically once all parallel worker actors complete their research synthesis.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Crash Pitch Demo Modal */}
      {crashDemoModal && (
        <div className="modal-overlay" onClick={() => setCrashDemoModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: "20px", fontWeight: "700", display: "flex", alignItems: "center", gap: "10px" }}>
              <Zap color="var(--accent-orange)" /> Worker Crash & Resume Demonstration
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "12px 0 20px" }}>
              Simulates a worker actor process crash mid-execution and demonstrates Rivet Actor state durability recovery.
            </p>

            {crashResult ? (
              <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "12px", border: "1px solid var(--border-color)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4ade80", fontWeight: "600", marginBottom: "12px" }}>
                  <CheckCircle2 size={18} /> Worker Resumed from State Checkpoint!
                </div>
                <div style={{ fontSize: "13px", color: varTextMuted }}>
                  <p><strong>Execution Time:</strong> {crashResult.executionTimeMs} ms (Zero Web Re-Search!)</p>
                  <p><strong>Checkpointed Sources Retained:</strong> {crashResult.sourcesRetained}</p>
                </div>
                <div style={{ marginTop: "12px", fontSize: "13px", color: "#cbd5e1", background: "rgba(0,0,0,0.3)", padding: "10px", borderRadius: "8px" }}>
                  {crashResult.answer?.slice(0, 250)}...
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "30px 0" }}>
                <RefreshCw className="animate-spin" size={28} color="var(--accent-orange)" style={{ margin: "0 auto 10px" }} />
                <p style={{ fontSize: "14px" }}>Simulating crash and triggering state recovery...</p>
              </div>
            )}

            <button
              className="btn-secondary"
              style={{ marginTop: "20px", width: "100%", justifyContent: "center" }}
              onClick={() => setCrashDemoModal(false)}
            >
              Close Pitch Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const varTextMuted = "#94a3b8";
