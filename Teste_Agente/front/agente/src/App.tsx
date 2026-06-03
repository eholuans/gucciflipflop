import { useState, useRef, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";

const BRAINROT_LOADING = [
  "ngl o agente tá calculando fr fr... 🗿",
  "bussin ou não bussin? aguenta aí... 💀",
  "o sigma está processando... no cap 🔥",
  "rizz level: carregando... 😮‍💨",
  "skibidi bop bop yes yes... 🚽",
];

const USER_PREFIXES = ["bro disse:", "fr fr:", "no cap:"];
const AGENT_PREFIXES = ["agente (W rizz):", "sigma bot:", "gyatt:"];

type Msg = { role: "user" | "agent"; text: string };

function App() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<Msg[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [glitch, setGlitch] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  const triggerGlitch = () => {
    setGlitch(true);
    setTimeout(() => setGlitch(false), 400);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const text = message;
    setMessage("");
    setLoading(true);
    triggerGlitch();
    setLoadingText(
      BRAINROT_LOADING[Math.floor(Math.random() * BRAINROT_LOADING.length)]
    );

    setChat((prev) => [...prev, { role: "user", text }]);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();
      setSessionId(data.sessionId);
      setChat((prev) => [...prev, { role: "agent", text: data.reply }]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "agent", text: "💀 L + ratio + skill issue na conexão" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className={`brainrot-app${glitch ? " glitch" : ""}`}>
      <header className="brainrot-header">
        <div className="header-skull">💀</div>
        <div className="header-text">
          <h1 className="header-title">
            SIGMA<span className="accent">AI</span> FR FR
          </h1>
          <p className="header-sub">no cap · bussin · W rizz only 🔥</p>
        </div>
        <div className="header-badge">🗿 GOAT</div>
      </header>

      <main className="chat-wrapper">
        <div className="chat-scroll">
          {chat.length === 0 && (
            <div className="empty-state">
              <div className="empty-emoji">🗿</div>
              <p className="empty-title">ohio é silence</p>
              <p className="empty-sub">manda msg pro sigma bot, ngl</p>
            </div>
          )}

          {chat.map((msg, i) => {
            const isUser = msg.role === "user";
            const prefix = isUser
              ? USER_PREFIXES[i % USER_PREFIXES.length]
              : AGENT_PREFIXES[i % AGENT_PREFIXES.length];
            return (
              <div key={i} className={`bubble-row ${isUser ? "row-user" : "row-agent"}`}>
                <div className={`avatar ${isUser ? "av-user" : "av-agent"}`}>
                  {isUser ? "🧢" : "🤖"}
                </div>
                <div className={`bubble ${isUser ? "bubble-user" : "bubble-agent"}`}>
                  <span className="bubble-prefix">{prefix} </span>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="bubble-row row-agent">
              <div className="avatar av-agent">🤖</div>
              <div className="bubble bubble-agent loading-bubble">
                <span className="dot-pulse" />
                <span className="dot-pulse" />
                <span className="dot-pulse" />
                <span className="loading-text">{loadingText}</span>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="input-zone">
        <div className="input-row">
          <input
            ref={inputRef}
            className="brainrot-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKey}
            placeholder="fala aí bro, no cap... 💬"
            disabled={loading}
          />
          <button
            className={`send-btn${loading ? " sending" : ""}`}
            onClick={sendMessage}
            disabled={loading}
          >
            {loading ? "⏳" : "🚀 W"}
          </button>
        </div>
        <p className="footer-tag">powered by sigma grindset™ · skibidi tech inc.</p>
      </footer>
    </div>
  );
}

export default App;