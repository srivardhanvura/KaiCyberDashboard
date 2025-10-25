import React from "react";
import { db } from "./db/db"; // reuse Dexie on main thread too

function App() {
  const [status, setStatus] = React.useState("Idle");
  const [chunks, setChunks] = React.useState(0);
  const [bytes, setBytes] = React.useState(0);
  const [contentType, setContentType] = React.useState<string | null>(null);
  const [httpStatus, setHttpStatus] = React.useState<number | null>(null);
  const [preview, setPreview] = React.useState("");

  React.useEffect(() => {
    const worker = new Worker(new URL("./worker/worker.ts", import.meta.url), {
      type: "module",
    });

    worker.onmessage = (e: MessageEvent<any>) => {
      const msg = e.data;
      if (msg?.type === "INFO") {
        if (msg.preview) setPreview(msg.preview);
      } else if (msg?.type === "PROGRESS") {
        setStatus("Ingesting…");
        setChunks(msg.chunks);
        setBytes(msg.bytes);
      } else if (msg?.type === "DONE") {
        setStatus("Done ✔");
        setChunks(msg.chunks);
        setBytes(msg.bytes);
      } else if (msg?.type === "ERROR") {
        setStatus(`Error: ${msg.message}`);
      }
    };

    worker.postMessage({ type: "START" });
    return () => worker.terminate();
  }, []);

  // Simple read-back from IndexedDB
  const [dbCount, setDbCount] = React.useState<number>(0);
  const [dbChars, setDbChars] = React.useState<number>(0);
  const [dbHead, setDbHead] = React.useState<string>("");

  const inspectDb = async () => {
    // how many chunks total
    const cnt = await db.chunks.count();

    // peek at the first few chunks (in order)
    const firstFew = await db.chunks.orderBy("seq").limit(3).toArray();

    // stream through all records to sum character counts (memory-safe)
    let totalChars = 0;
    await db.chunks.toCollection().each((c) => {
      totalChars += c.data.length;
    });

    setDbCount(cnt);
    setDbChars(totalChars);
    setDbHead(
      firstFew
        .map((c) => c.data)
        .join("")
        .slice(0, 400)
    );
  };

  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <h1>UI Demo Data — Ingestion</h1>

      <p>
        Status: <b>{status}</b>
      </p>
      <p>
        HTTP status: <b>{httpStatus ?? "-"}</b>
      </p>
      <p>
        Content-Type: <b>{contentType ?? "-"}</b>
      </p>
      <p>Worker preview (first ~400 chars):</p>
      <pre
        style={{ background: "#f5f5f5", padding: 8, whiteSpace: "pre-wrap" }}
      >
        {preview || "(no data yet)"}
      </pre>

      <p>
        Chunks stored: <b>{chunks.toLocaleString()}</b>
      </p>
      <p>
        Bytes streamed (network): <b>{bytes.toLocaleString()}</b>
      </p>

      <hr />

      <button onClick={inspectDb}>Inspect IndexedDB</button>
      <p>
        DB chunks: <b>{dbCount}</b>
      </p>
      <p>
        Total characters in DB: <b>{dbChars.toLocaleString()}</b>
      </p>
      <p>DB head (first ~400 chars joined):</p>
      <pre style={{ background: "#eef", padding: 8, whiteSpace: "pre-wrap" }}>
        {dbHead || "(click Inspect IndexedDB)"}
      </pre>

      <p style={{ color: "#666", maxWidth: 700 }}>
        If Content-Type shows <code>text/html</code> and the preview is HTML,
        you’re fetching the GitHub HTML page. Use the raw URL:{" "}
        <code>https://raw.githubusercontent.com/…/ui_demo.json</code>.
      </p>
    </div>
  );
}

export default App;
