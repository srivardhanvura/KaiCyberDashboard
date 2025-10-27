import Dexie, { Table } from "dexie";
import type { VulnRow, AggSeverity } from "../types";

export class DashboardDB extends Dexie {
  vulns!: Table<VulnRow, string>;
  aggSeverity!: Table<AggSeverity, string>;

  constructor() {
    super("kai-dashboard-db");
    this.version(3).stores({
      vulns: `
        id,
        severity,
        publishedAt,
        cvss,
        kaiStatus,
        description,
        discoveredAt,
        *riskFactors,
        *tags,
        [severity+publishedAt],
        [kaiStatus+severity],
        [discoveredAt+severity]
      `,
      aggSeverity: "severity",
    });
  }
}

export const db = new DashboardDB();
