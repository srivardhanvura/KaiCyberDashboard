import React from "react";
import { db } from "../db/db";
import type { VulnRow } from "../types";

function RecentHighs({ limit = 20 }: { limit?: number }) {
  const [rows, setRows] = React.useState<VulnRow[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      // recent high/critical by publishedAt desc
      const highs = await db.vulns
        .where("severity")
        .anyOf("high", "critical")
        .toArray();

      console.log(`Found ${highs.length} high/critical vulnerabilities`);
      highs.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      setRows(highs.slice(0, limit));
    } catch (error) {
      console.error('Error refreshing RecentHighs:', error);
    }
  }, [limit]);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000); // light polling while ingest runs
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div>
      <h3>Recent High/Critical</h3>
      <div
        style={{ maxHeight: 400, overflow: "auto", border: "1px solid #eee" }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left" }}>
              <th style={{ padding: 6 }}>CVE</th>
              <th style={{ padding: 6 }}>Severity</th>
              <th style={{ padding: 6 }}>CVSS</th>
              <th style={{ padding: 6 }}>Package</th>
              <th style={{ padding: 6 }}>Published</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderTop: "1px solid #f2f2f2" }}>
                <td style={{ padding: 6 }}>{r.cve}</td>
                <td style={{ padding: 6 }}>{r.severity}</td>
                <td style={{ padding: 6 }}>{r.cvss ?? ""}</td>
                <td style={{ padding: 6 }}>
                  {r.packageName}
                  {r.packageVersion ? `@${r.packageVersion}` : ""}
                </td>
                <td style={{ padding: 6 }}>
                  {r.publishedAt
                    ? new Date(r.publishedAt).toISOString().slice(0, 10)
                    : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default RecentHighs;
