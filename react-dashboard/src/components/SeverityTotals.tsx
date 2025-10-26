import React from "react";
import { db } from "../db/db";
import "./SeverityTotals.css";

const SeverityTotals = () => {
  const [rows, setRows] = React.useState<{ severity: string; count: number }[]>(
    []
  );

  const refresh = React.useCallback(async () => {
    try {
      const all = await db.aggSeverity.toArray();
      console.log("SeverityTotals - aggSeverity data:", all);

      const order = ["critical", "high", "medium", "low", "unknown"] as const;
      type SevKey = (typeof order)[number];
      const map = new Map(all.map((a) => [a.severity, a.count]));
      const result = order.map((s: SevKey) => ({
        severity: s,
        count: map.get(s) ?? 0,
      }));

      console.log("SeverityTotals - processed data:", result);
      setRows(result);
    } catch (error) {
      console.error("Error refreshing SeverityTotals:", error);
    }
  }, []);

  React.useEffect(() => {
    refresh();
    const id = setInterval(refresh, 1000);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="severity-totals">
      <h3>Totals by severity</h3>
      <ul className="severity-list">
        {rows.map((r) => (
          <li key={r.severity} className="severity-item">
            <b className="severity-label">{r.severity}</b>{" "}
            {r.count.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SeverityTotals;
