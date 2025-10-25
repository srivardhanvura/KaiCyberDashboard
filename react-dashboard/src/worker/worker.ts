/// <reference lib="webworker" />
import { db } from "../db/db";

declare const self: DedicatedWorkerGlobalScope;

type InMsg = { type: "START" };
type OutMsg =
  | { type: "PROGRESS"; chunks: number; bytes: number }
  | { type: "DONE"; chunks: number; bytes: number }
  | {
      type: "INFO";
      contentType: string | null;
      status: number;
      preview: string;
    }
  | { type: "ERROR"; message: string };

const LOCAL_URL = `${self.location.origin}/data/ui_demo.json`;

self.onmessage = (e: MessageEvent<InMsg>) => {
  if (e.data?.type === "START") {
    startIngest().catch((err) =>
      post({ type: "ERROR", message: String(err?.message || err) })
    );
  }
};

function post(m: OutMsg) {
  (self as any).postMessage(m);
}

async function startIngest() {
  // 1) Clear DB to avoid duplicates
  await db.chunks.clear();

  // 2) Fetch stream from same-origin public asset
  const res = await fetch(LOCAL_URL, { redirect: "follow", cache: "no-store" });
  const ct = res.headers.get("content-type");
  post({ type: "INFO", contentType: ct, status: res.status, preview: "" });

  if (!res.ok || !res.body) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let seq = 0;
  let totalBytes = 0;
  let previewStr = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    const text = decoder.decode(value, { stream: true });

    // small preview for sanity check
    if (previewStr.length < 400) {
      previewStr += text.slice(0, 400 - previewStr.length);
      post({
        type: "INFO",
        contentType: ct,
        status: res.status,
        preview: previewStr,
      });
    }

    // store this chunk
    await db.chunks.add({ seq, data: text });
    seq++;

    if (seq % 5 === 0) {
      post({ type: "PROGRESS", chunks: seq, bytes: totalBytes });
    }
  }

  // finalize decoder
  decoder.decode(new Uint8Array(), { stream: false });

  post({ type: "DONE", chunks: await db.chunks.count(), bytes: totalBytes });
}
