import React from "react";
import { db } from "../db/db";

function SeverityTotals() {
  const [rows, setRows] = React.useState<{ severity: string; count: number }[]>(
    []
  );

  const refresh = React.useCallback(async () => {
    try {
      const all = await db.aggSeverity.toArray();
      console.log('SeverityTotals - aggSeverity data:', all);
      
      // show in a consistent order
      const order = ["critical", "high", "medium", "low", "unknown"] as const;
      type SevKey = (typeof order)[number];
      const map = new Map(all.map((a) => [a.severity, a.count]));
      const result = order.map((s: SevKey) => ({
        severity: s,
        count: map.get(s) ?? 0,
      }));
      
      console.log('SeverityTotals - processed data:', result);
      setRows(result);
    } catch (error) {
      console.error('Error refreshing SeverityTotals:', error);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000); // light polling while ingest runs
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div>
      <h3>Totals by severity</h3>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {rows.map((r) => (
          <li key={r.severity} style={{ padding: "4px 0" }}>
            <b style={{ width: 90, display: "inline-block" }}>{r.severity}</b>{" "}
            {r.count.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SeverityTotals;
