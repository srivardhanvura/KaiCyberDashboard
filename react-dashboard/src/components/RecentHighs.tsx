import React from "react";
import { db } from "../db/db";
import type { VulnRow } from "../types";
import "./RecentHighs.css";

const RecentHighs = ({ limit = 20 }: { limit?: number }) => {
  const [rows, setRows] = React.useState<VulnRow[]>([]);

  const refresh = React.useCallback(async () => {
    try {
      const highs = await db.vulns
        .where("severity")
        .anyOf("high", "critical")
        .toArray();

      console.log(`Found ${highs.length} high/critical vulnerabilities`);
      highs.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
      setRows(highs.slice(0, limit));
    } catch (error) {
      console.error("Error refreshing RecentHighs:", error);
    }
  }, [limit]);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="recent-highs">
      <h3>Recent High/Critical</h3>
      <div className="vulnerabilities-container">
        <table className="vulnerabilities-table">
          <thead>
            <tr>
              <th>CVE</th>
              <th>Severity</th>
              <th>CVSS</th>
              <th>Package</th>
              <th>Published</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.cve}</td>
                <td className={`severity-${r.severity}`}>{r.severity}</td>
                <td>{r.cvss ?? ""}</td>
                <td>
                  {r.packageName}
                  {r.packageVersion ? `@${r.packageVersion}` : ""}
                </td>
                <td>
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
};

export default RecentHighs;
