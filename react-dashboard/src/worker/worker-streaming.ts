/// <reference lib="webworker" />

import { db } from "../db/db";
import type { VulnRow, Severity, WorkerIn, WorkerOut } from "../types";

declare const self: DedicatedWorkerGlobalScope;

// Use the large data file
const DATA_URL = `${self.location.origin}/data/ui_demo.json`;

// ---- worker message plumbing ----
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

// ---- little helpers ----
const sevNorm = (s: any): Severity => {
  const v = (s ?? "unknown").toString().toLowerCase();
  return v === "critical" || v === "high" || v === "medium" || v === "low"
    ? v
    : "unknown";
};
const parseMs = (s?: string) => (s ? Date.parse(s) : undefined);

// ---- streaming ingest flow ----
async function ingest() {
  try {
    console.log('Starting streaming data ingestion...');
    
    // clear tables to avoid duplicates
    await db.transaction("rw", db.vulns, db.aggSeverity, async () => {
      await db.vulns.clear();
      await db.aggSeverity.clear();
    });
    console.log('Cleared existing data');

    // Fetch the data file
    const res = await fetch(DATA_URL, { cache: "no-store", redirect: "follow" });
    if (!res.ok) {
      throw new Error(`Failed to fetch data: ${DATA_URL} (${res.status} ${res.statusText})`);
    }
    console.log('Data fetched successfully');

    const jsonData = await res.json();
    console.log('JSON parsed successfully');
    
    // Process data in streaming fashion
    const BATCH_SIZE = 10000; // Larger batches for better performance
    const vulnRows: VulnRow[] = [];
    const sevCounts = new Map<Severity | "unknown", number>();
    let totalWritten = 0;
    
    // Navigate through the JSON structure and process in chunks
    let groups: any[] = [];
    if (Array.isArray(jsonData.groups)) {
      groups = jsonData.groups;
    } else if (jsonData.groups && typeof jsonData.groups === 'object') {
      groups = Object.values(jsonData.groups);
    }
    
    console.log(`Found ${groups.length} groups to process`);
    
    // Process groups in batches to avoid memory issues
    for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
      const group = groups[groupIndex];
      
      let repos: any[] = [];
      if (Array.isArray(group.repos)) {
        repos = group.repos;
      } else if (group.repos && typeof group.repos === 'object') {
        repos = Object.values(group.repos);
      }
      
      for (const repo of repos) {
        let images: any[] = [];
        if (Array.isArray(repo.images)) {
          images = repo.images;
        } else if (repo.images && typeof repo.images === 'object') {
          images = Object.values(repo.images);
        }
        
        for (const image of images) {
          if (image.vulnerabilities && Array.isArray(image.vulnerabilities)) {
            for (const vuln of image.vulnerabilities) {
              const publishedAt = parseMs(vuln.published);
              const fixDate = parseMs(vuln.fixDate);
              const riskFactors = Object.keys(vuln.riskFactors || {});
              const imageId = image.id || image.name || "";
              const id = `${imageId}|${vuln.cve || ""}|${vuln.packageName || ""}|${
                vuln.packageVersion || ""
              }`;
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
              
              // Debug: Log every 1000th vulnerability
              if (vulnRows.length % 1000 === 0) {
                console.log(`Processed ${vulnRows.length} vulnerabilities, severity counts:`, Object.fromEntries(sevCounts));
              }
              
              // Process batch when it reaches the batch size
              if (vulnRows.length >= BATCH_SIZE) {
                console.log(`Processing batch of ${vulnRows.length} rows, total so far: ${totalWritten + vulnRows.length}`);
                await db.vulns.bulkPut(vulnRows);
                totalWritten += vulnRows.length;
                post({ type: "PROGRESS", rowsWritten: totalWritten });
                vulnRows.length = 0; // Clear array efficiently
              }
            }
          }
        }
      }
      
      // Update progress after each group
      if (totalWritten > 0) {
        post({ type: "PROGRESS", rowsWritten: totalWritten });
      }
    }

    // Process remaining rows
    if (vulnRows.length > 0) {
      await db.vulns.bulkPut(vulnRows);
      totalWritten += vulnRows.length;
      post({ type: "PROGRESS", rowsWritten: totalWritten });
    }

    // Write aggregates
    console.log('Writing severity aggregates...');
    console.log('Severity counts map:', Object.fromEntries(sevCounts));
    await db.transaction("rw", db.aggSeverity, async () => {
      await db.aggSeverity.clear();
      const rows: { severity: Severity | "unknown"; count: number }[] = [];
      sevCounts.forEach((count, severity) => rows.push({ severity, count }));
      console.log('Aggregate rows to insert:', rows);
      if (rows.length) {
        await db.aggSeverity.bulkPut(rows);
        console.log('Aggregates inserted successfully');
      } else {
        console.log('No aggregates to insert');
      }
    });

    console.log(`Ingestion completed: ${totalWritten} rows processed`);
    post({ type: "DONE", rowsWritten: totalWritten });
  } catch (error) {
    console.error('Ingest error:', error);
    post({ type: "ERROR", message: String((error as Error)?.message || error) });
  }
}