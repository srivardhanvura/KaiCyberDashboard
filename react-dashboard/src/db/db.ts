import Dexie, { Table } from "dexie";
import type { VulnRow, AggSeverity } from "../types";

export class DashboardDB extends Dexie {
  vulns!: Table<VulnRow, string>;
  aggSeverity!: Table<AggSeverity, string>;

  constructor() {
    super("ui-dashboard-db");
    this.version(2).stores({
      vulns: `
        id,
        severity,
        publishedAt,
        cvss,
        *riskFactors,
        [severity+publishedAt]
      `,
      aggSeverity: "severity",
    });
  }
}

export const db = new DashboardDB();
