/// <reference lib="webworker" />

import { db } from "../db/db";
import type { VulnRow, Severity, WorkerIn, WorkerOut } from "../types";

declare const self: DedicatedWorkerGlobalScope;

const DATA_URL = `${self.location.origin}/data/ui_demo.json`;

self.onmessage = (e: MessageEvent<WorkerIn>) => {
  if (e.data?.type === "START") {
    ingest().catch((err) =>
      post({ type: "ERROR", message: String(err?.message || err) })
    );
  }
};

function post(m: WorkerOut) {
  (self as any).postMessage(m);
}

const sevNorm = (s: any): Severity => {
  const v = (s ?? "unknown").toString().toLowerCase();
  return v === "critical" || v === "high" || v === "medium" || v === "low"
    ? v
    : "unknown";
};
const parseMs = (s?: string) => (s ? Date.parse(s) : undefined);

const ingest = async () => {
  try {
    console.log("Starting streaming data ingestion...");

    await db.transaction("rw", db.vulns, db.aggSeverity, async () => {
      await db.vulns.clear();
      await db.aggSeverity.clear();
    });
    console.log("Cleared existing data");

    const res = await fetch(DATA_URL, {
      cache: "no-store",
      redirect: "follow",
    });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch data: ${DATA_URL} (${res.status} ${res.statusText})`
      );
    }
    console.log("Data fetch initiated, starting streaming...");

    const jsonData = await res.json();
    console.log("JSON parsed successfully");

    const BATCH_SIZE = 5000;
    const vulnRows: VulnRow[] = [];
    const sevCounts = new Map<Severity | "unknown", number>();
    let totalWritten = 0;

    const groups: any[] = Object.values(jsonData.groups);
    console.log(`Found ${groups.length} groups to process`);

    const GROUP_BATCH_SIZE = 10;
    
    for (let batchStart = 0; batchStart < groups.length; batchStart += GROUP_BATCH_SIZE) {
      const groupBatch = groups.slice(batchStart, batchStart + GROUP_BATCH_SIZE);
      
      for (const group of groupBatch) {
        const repos: any[] = Object.values(group.repos || {});
        
        for (const repo of repos) {
          const images: any[] = Object.values(repo.images || {});
          
          for (const image of images) {
            if (image.vulnerabilities && Array.isArray(image.vulnerabilities)) {
              for (const vuln of image.vulnerabilities) {
                const publishedAt = parseMs(vuln.published);
                const fixDate = parseMs(vuln.fixDate);
                const riskFactors = Object.keys(vuln.riskFactors || {});
                const imageId = image.id || image.name || "";
                const id = `${imageId}|${vuln.cve || ""}|${
                  vuln.packageName || ""
                }|${vuln.packageVersion || ""}`;
                const severity = sevNorm(vuln.severity);

                const row: VulnRow = {
                  id,
                  group: group.name || "",
                  repo: repo.name || "",
                  imageId,
                  imageName: image.name || "",
                  imageVersion: image.version,
                  cve: vuln.cve,
                  severity,
                  cvss: typeof vuln.cvss === "number" ? vuln.cvss : undefined,
                  status: vuln.status,
                  packageName: vuln.packageName,
                  packageVersion: vuln.packageVersion,
                  packageType: vuln.packageType,
                  publishedAt,
                  fixDate,
                  riskFactors,
                };

                vulnRows.push(row);
                sevCounts.set(severity, (sevCounts.get(severity) || 0) + 1);

                if (vulnRows.length >= BATCH_SIZE) {
                  console.log(
                    `Processing batch of ${vulnRows.length} rows, total so far: ${
                      totalWritten + vulnRows.length
                    }`
                  );
                  await db.vulns.bulkPut(vulnRows);
                  totalWritten += vulnRows.length;
                  post({ type: "PROGRESS", rowsWritten: totalWritten });
                  vulnRows.length = 0;
                  
                  if (typeof global !== 'undefined' && global.gc) {
                    global.gc();
                  }
                }
              }
            }
          }
        }
      }
      
      if (totalWritten > 0) {
        post({ type: "PROGRESS", rowsWritten: totalWritten });
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    if (vulnRows.length > 0) {
      await db.vulns.bulkPut(vulnRows);
      totalWritten += vulnRows.length;
      post({ type: "PROGRESS", rowsWritten: totalWritten });
    }

    console.log("Writing severity aggregates...");
    console.log("Severity counts map:", Object.fromEntries(sevCounts));
    await db.transaction("rw", db.aggSeverity, async () => {
      await db.aggSeverity.clear();
      const rows: { severity: Severity | "unknown"; count: number }[] = [];
      sevCounts.forEach((count, severity) => rows.push({ severity, count }));
      console.log("Aggregate rows to insert:", rows);
      if (rows.length) {
        await db.aggSeverity.bulkPut(rows);
        console.log("Aggregates inserted successfully");
      } else {
        console.log("No aggregates to insert");
      }
    });

    console.log(`Ingestion completed: ${totalWritten} rows processed`);
    post({ type: "DONE", rowsWritten: totalWritten });
  } catch (error) {
    console.error("Ingest error:", error);
    post({
      type: "ERROR",
      message: String((error as Error)?.message || error),
    });
  }
};
