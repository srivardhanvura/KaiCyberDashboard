import Dexie, { Table } from "dexie";
import type { VulnRow, AggSeverity } from "../types";

export class DemoDB extends Dexie {
  vulns!: Table<VulnRow, string>;
  aggSeverity!: Table<AggSeverity, string>;

  constructor() {
    super("ui-dashboard-db");
    this.version(2).stores({
      // indices to support common filters/sorts
      vulns: `
        id,
        severity,
        publishedAt,
        cvss,
        *riskFactors,
        [severity+publishedAt]
      `,
      // store one doc per severity
      aggSeverity: "severity",
    });
  }
}

export const db = new DemoDB();
