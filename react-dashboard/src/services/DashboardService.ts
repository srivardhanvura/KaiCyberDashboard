import { db } from "../db/db";
import { VulnRow, Severity, KaiStatus } from "../types";

export interface ChartData {
  severityData: { severity: Severity; count: number }[];
  riskFactorsData: { factor: string; count: number }[];
  trendData: {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  }[];
  cvssData: {
    cvss: number;
    daysSincePublished: number;
    severity: Severity;
    cve: string;
  }[];
}

export interface DashboardFilters {
  severity: Severity | "all";
  kaiStatus: KaiStatus | "all";
  dateRange: { start: string; end: string };
  group?: string;
  repo?: string;
  analysisMode?: "all" | "analysis" | "ai-analysis";
}

type QueryOptions = { preferSnapshot?: boolean };

type SnapshotAggregates = {
  totalCount?: number;
  generatedAt?: string;
  aggregates: {
    severityByKaiFilter: Record<string, Record<Severity, number>>;
    dailySeverityByKaiFilter: Record<string, Record<string, Record<Severity, number>>>;
      riskFactorsByKaiFilter: Record<string, Record<string, number>>;
      riskFactorsByKaiFilterBySeverity: Record<
        string,
        Record<Severity, Record<string, number>>
      >;
      // lastYear variants
      severityByKaiFilter_lastYear: Record<string, Record<Severity, number>>;
      riskFactorsByKaiFilter_lastYear: Record<string, Record<string, number>>;
      riskFactorsByKaiFilterBySeverity_lastYear: Record<
        string,
        Record<Severity, Record<string, number>>
      >;
      cvssSamplesByKaiFilter_lastYear: Record<
        string,
        { cvss: number; daysSincePublished: number; severity: Severity; cve: string }[]
      >;
    cvssSamplesByKaiFilter: Record<
      string,
      { cvss: number; daysSincePublished: number; severity: Severity; cve: string }[]
    >;
    severityByKaiStatusSingle: Record<string, Record<Severity, number>>;
    dailySeverityByKaiStatusSingle: Record<string, Record<string, Record<Severity, number>>>;
      riskFactorsByKaiStatusSingle: Record<string, Record<string, number>>;
      riskFactorsByKaiStatusSingle_lastYear: Record<string, Record<string, number>>;
  };
};

type SnapshotPayload =
  | { rows: VulnRow[]; totalCount?: number }
  | { chartData: ChartData; totalCount?: number }
  | SnapshotAggregates;

class DashboardService {
  private snapshot: SnapshotPayload | null = null;
  private snapshotLoaded = false;
  private snapshotLoadingPromise: Promise<SnapshotPayload | null> | null = null;

  private async loadSnapshot(): Promise<SnapshotPayload | null> {
    if (this.snapshotLoaded) return this.snapshot;
    if (this.snapshotLoadingPromise) return this.snapshotLoadingPromise;

    this.snapshotLoadingPromise = (async () => {
      try {
        const res = await fetch("/dashboard_snapshot.json", { cache: "no-store" });
        if (!res.ok) {
          console.warn("No snapshot available (HTTP)");
          return null;
        }
        const json = await res.json();
        let snap: SnapshotPayload | null = null;
        if (json?.rows && Array.isArray(json.rows)) {
          snap = { rows: json.rows as VulnRow[], totalCount: json.totalCount };
        } else if (json?.chartData) {
          snap = { chartData: json.chartData as ChartData, totalCount: json.totalCount };
        } else if (json?.aggregates) {
          snap = json as SnapshotAggregates;
        } else {
          console.warn("Snapshot format not recognized");
          snap = null;
        }
        if (snap) {
          this.snapshot = snap;
          this.snapshotLoaded = true;
        }
        return snap;
      } catch (e) {
        console.warn("Failed to load snapshot:", e);
        return null;
      } finally {
        this.snapshotLoadingPromise = null;
      }
    })();

    return this.snapshotLoadingPromise;
  }
  public async getChartData(
    filters: DashboardFilters,
    options?: QueryOptions
  ): Promise<ChartData> {
    try {
      console.log("Getting chart data with filters:", filters);

      // If DB is empty OR caller prefers snapshot (during ingestion), use snapshot
      const totalCount = await db.vulns.count();
      const useSnapshot = options?.preferSnapshot || totalCount === 0;

      let query = useSnapshot ? null : db.vulns.toCollection();

      const baseFilter = (vuln: VulnRow) => {
        // Apply all filters to a single row
        if (filters.severity !== "all" && vuln.severity !== filters.severity) {
          return false;
        }
        if (
          filters.kaiStatus !== "all" &&
          vuln.kaiStatus !== filters.kaiStatus
        ) {
          return false;
        }
        if (
          filters.analysisMode === "analysis" &&
          vuln.kaiStatus === "invalid - norisk"
        ) {
          return false;
        }
        if (
          filters.analysisMode === "ai-analysis" &&
          vuln.kaiStatus === "ai-invalid-norisk"
        ) {
          return false;
        }
        if (filters.dateRange.start) {
          const startDate = new Date();
          startDate.setDate(
            startDate.getDate() - parseInt(filters.dateRange.start)
          );
          if (vuln.discoveredAt < startDate.getTime()) return false;
        }
        return true;
      };

      let vulnerabilities: VulnRow[] = [];
      if (useSnapshot) {
        const snap = await this.loadSnapshot();
        if (!snap) return { severityData: [], riskFactorsData: [], trendData: [], cvssData: [] };

        // If aggregates present, synthesize chart data using filters
        if ("aggregates" in (snap as any)) {
          return this.buildChartDataFromAggregates(
            snap as SnapshotAggregates,
            filters
          );
        }

        if ("rows" in snap) {
          vulnerabilities = (snap.rows as VulnRow[]).filter(baseFilter);
        } else if ("chartData" in snap) {
          return (snap as any).chartData as ChartData;
        } else {
          vulnerabilities = [];
        }
      } else {
        // Apply filters at the DB level to avoid loading unnecessary rows
        vulnerabilities = await (query as any)
          .filter(baseFilter)
          .toArray()
          .then((rows: VulnRow[]) => rows);
      }
      console.log(
        `Found ${vulnerabilities.length} vulnerabilities for chart data`
      );

      const severityData = this.processSeverityData(vulnerabilities);
      const riskFactorsData = this.processRiskFactorsData(vulnerabilities);
      const trendData = this.processTrendData(vulnerabilities);
      const cvssData = this.processCVSSData(vulnerabilities);

      return {
        severityData,
        riskFactorsData,
        trendData,
        cvssData,
      };
    } catch (error) {
      console.error("Error getting chart data:", error);
      throw error;
    }
  }

  private processSeverityData(
    vulnerabilities: VulnRow[]
  ): { severity: Severity; count: number }[] {
    const severityCounts = new Map<Severity, number>();

    vulnerabilities.forEach((vuln) => {
      const current = severityCounts.get(vuln.severity) || 0;
      severityCounts.set(vuln.severity, current + 1);
    });

    return Array.from(severityCounts.entries()).map(([severity, count]) => ({
      severity,
      count,
    }));
  }

  private processRiskFactorsData(
    vulnerabilities: VulnRow[]
  ): { factor: string; count: number }[] {
    const factorCounts = new Map<string, number>();

    // Count occurrences of each risk factor across all vulnerabilities
    vulnerabilities.forEach((vuln) => {
      (vuln.riskFactors || []).forEach((factor) => {
        const current = factorCounts.get(factor) || 0;
        factorCounts.set(factor, current + 1);
      });
    });

    // Return top 10 most common risk factors, sorted by count
    return Array.from(factorCounts.entries())
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private processTrendData(vulnerabilities: VulnRow[]): {
    date: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unknown: number;
  }[] {
    const dailyCounts = new Map<
      string,
      {
        critical: number;
        high: number;
        medium: number;
        low: number;
        unknown: number;
      }
    >();

    // Group vulnerabilities by discovery date and count by severity
    vulnerabilities.forEach((vuln) => {
      const date = new Date(vuln.discoveredAt).toISOString().split("T")[0];
      const existing = dailyCounts.get(date) || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        unknown: 0,
      };
      existing[vuln.severity]++;
      dailyCounts.set(date, existing);
    });

    // Return last 30 days of data, sorted chronologically
    return Array.from(dailyCounts.entries())
      .map(([date, counts]) => ({ date, ...counts }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);
  }

  private processCVSSData(vulnerabilities: VulnRow[]): {
    cvss: number;
    daysSincePublished: number;
    severity: Severity;
    cve: string;
  }[] {
    const now = Date.now();

    // Only include vulnerabilities with CVSS scores and published dates
    return vulnerabilities
      .filter((vuln) => vuln.cvss && vuln.publishedAt)
      .map((vuln) => ({
        cvss: vuln.cvss!,
        daysSincePublished: Math.floor(
          (now - vuln.publishedAt!) / (1000 * 60 * 60 * 24)
        ),
        severity: vuln.severity,
        cve: vuln.cve,
      }))
      .slice(0, 1000); // Limit to 1000 points for performance
  }

  public async getFilteredCount(
    filters: DashboardFilters,
    options?: QueryOptions
  ): Promise<number> {
    try {
      const totalCount = await db.vulns.count();
      const useSnapshot = options?.preferSnapshot || totalCount === 0;
      let query = useSnapshot ? null : db.vulns.toCollection();

      const baseFilter = (vuln: VulnRow) => {
        if (filters.severity !== "all" && vuln.severity !== filters.severity) {
          return false;
        }
        if (
          filters.kaiStatus !== "all" &&
          vuln.kaiStatus !== filters.kaiStatus
        ) {
          return false;
        }
        if (
          filters.analysisMode === "analysis" &&
          vuln.kaiStatus === "invalid - norisk"
        ) {
          return false;
        }
        if (
          filters.analysisMode === "ai-analysis" &&
          vuln.kaiStatus === "ai-invalid-norisk"
        ) {
          return false;
        }
        if (filters.dateRange.start) {
          const startDate = new Date();
          startDate.setDate(
            startDate.getDate() - parseInt(filters.dateRange.start)
          );
          if (vuln.discoveredAt < startDate.getTime()) return false;
        }
        return true;
      };

      // Apply filters to narrow down the dataset
      if (useSnapshot) {
        const snap = await this.loadSnapshot();
        if (!snap) return 0;

        if ("aggregates" in (snap as any)) {
          return this.computeFilteredCountFromAggregates(
            snap as SnapshotAggregates,
            filters
          );
        }
        if ("rows" in snap) {
          return (snap.rows as VulnRow[]).filter(baseFilter).length;
        }
        if ("totalCount" in (snap as any) && typeof (snap as any).totalCount === "number") {
          return (snap as any).totalCount as number;
        }
        return 0;
      }

      // Apply filters when counting from DB as well
      return await (query as any).filter(baseFilter).count();
    } catch (error) {
      console.error("Error getting filtered count:", error);
      throw error;
    }
  }

  public async getSnapshotTotalCount(): Promise<number> {
    const snap = await this.loadSnapshot();
    if (!snap) return 0;
    if ("totalCount" in (snap as any) && typeof (snap as any).totalCount === "number") {
      return (snap as any).totalCount as number;
    }
    if ("aggregates" in (snap as any)) {
      const sevMap = (snap as SnapshotAggregates).aggregates.severityByKaiFilter["all"] || {};
      return Object.values(sevMap).reduce((sum, c) => sum + (c as number), 0);
    }
    if ("rows" in snap) return (snap.rows as VulnRow[]).length;
    return 0;
  }

  private buildChartDataFromAggregates(
    snap: SnapshotAggregates,
    filters: DashboardFilters
  ): ChartData {
    const mode = filters.analysisMode || "all";
    const agg = snap.aggregates;

    // If analysis mode excludes the selected kaiStatus, return zeroed datasets
    if (
      filters.kaiStatus &&
      filters.kaiStatus !== "all" &&
      ((mode === "analysis" && filters.kaiStatus === ("invalid - norisk" as any)) ||
        (mode === "ai-analysis" && filters.kaiStatus === ("ai-invalid-norisk" as any)))
    ) {
      return {
        severityData: [],
        riskFactorsData: [],
        trendData: [],
        cvssData: [],
      };
    }

    // If date range yields zero items, return empty charts
    const inRangeTotal = this.computeFilteredCountFromAggregates(snap, filters);
    if (filters.dateRange?.start && inRangeTotal === 0) {
      return { severityData: [], riskFactorsData: [], trendData: [], cvssData: [] };
    }

    const isLastYear = filters.dateRange?.start === "365";

    // Severity distribution
    const sevCountsSource = (() => {
      if (filters.kaiStatus && filters.kaiStatus !== "all") {
        return agg.severityByKaiStatusSingle[String(filters.kaiStatus)] || {};
      }
      if (isLastYear) {
        return agg.severityByKaiFilter_lastYear[mode] || {};
      }
      return agg.severityByKaiFilter[mode] || {};
    })();

    const severityData = Object.entries(sevCountsSource)
      .filter(([severity]) =>
        filters.severity === "all" ? true : severity === filters.severity
      )
      .map(([severity, count]) => ({ severity: severity as Severity, count }));

    // Trend data (last 30 days), optionally filtered by severity
    const dailySourceByDate =
      filters.kaiStatus && filters.kaiStatus !== "all"
        ? agg.dailySeverityByKaiStatusSingle[String(filters.kaiStatus)] || {}
        : agg.dailySeverityByKaiFilter[mode] || {};

    const trendEntries = Object.entries(dailySourceByDate)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, sevMap]) => {
        const entry = {
          date,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          unknown: 0,
        } as any;
        for (const [sev, c] of Object.entries(sevMap)) {
          if (filters.severity === "all" || filters.severity === (sev as Severity)) {
            entry[sev] = c as number;
          }
        }
        return entry as ChartData["trendData"][number];
      });

    // Apply dateRange.start if provided
    let trendData = trendEntries;
    if (filters.dateRange?.start) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange.start));
      const startStr = startDate.toISOString().split("T")[0];
      trendData = trendEntries.filter((e) => e.date >= startStr);
    }
    trendData = trendData.slice(-30);

    // Risk factors: support filtering by specific kaiStatus or severity; switch to lastYear maps if needed
    let rfCounts: Record<string, number> = {};
    if (filters.kaiStatus && filters.kaiStatus !== "all") {
      rfCounts = isLastYear
        ? agg.riskFactorsByKaiStatusSingle_lastYear[String(filters.kaiStatus)] || {}
        : agg.riskFactorsByKaiStatusSingle[String(filters.kaiStatus)] || {};
    } else if (filters.severity && filters.severity !== "all") {
      rfCounts = isLastYear
        ? (agg.riskFactorsByKaiFilterBySeverity_lastYear[mode] || ({} as any))[
            filters.severity
          ] || {}
        : (agg.riskFactorsByKaiFilterBySeverity[mode] || ({} as any))[
            filters.severity
          ] || {};
    } else {
      rfCounts = isLastYear
        ? agg.riskFactorsByKaiFilter_lastYear[mode] || {}
        : agg.riskFactorsByKaiFilter[mode] || {};
    }
    const riskFactorsData = Object.entries(rfCounts)
      .map(([factor, count]) => ({ factor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // CVSS samples: use variant samples and optionally filter by severity; choose lastYear if needed
    const cvssSource = isLastYear
      ? agg.cvssSamplesByKaiFilter_lastYear[mode] || []
      : agg.cvssSamplesByKaiFilter[mode] || [];
    const samples = cvssSource.filter((s) =>
      filters.severity === "all" ? true : s.severity === filters.severity
    );
    const cvssData = samples.slice(0, 1000);

    return { severityData, riskFactorsData, trendData, cvssData };
  }

  private computeFilteredCountFromAggregates(
    snap: SnapshotAggregates,
    filters: DashboardFilters
  ): number {
    const mode = filters.analysisMode || "all";
    const agg = snap.aggregates;

    // If analysis mode excludes the selected kaiStatus, the result is zero
    if (
      filters.kaiStatus &&
      filters.kaiStatus !== "all" &&
      ((mode === "analysis" && filters.kaiStatus === ("invalid - norisk" as any)) ||
        (mode === "ai-analysis" && filters.kaiStatus === ("ai-invalid-norisk" as any)))
    ) {
      return 0;
    }

    // Choose base series for counting
    const dailySourceByDate =
      filters.kaiStatus && filters.kaiStatus !== "all"
        ? agg.dailySeverityByKaiStatusSingle[String(filters.kaiStatus)] || {}
        : agg.dailySeverityByKaiFilter[mode] || {};

    // Apply date range by summing days in range
    const dates = Object.keys(dailySourceByDate).sort();
    let fromIdx = 0;
    if (filters.dateRange?.start) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(filters.dateRange.start));
      const startStr = startDate.toISOString().split("T")[0];
      fromIdx = dates.findIndex((d) => d >= startStr);
      if (fromIdx === -1) return 0;
    }
    const sliced = dates.slice(fromIdx);

    let total = 0;
    for (const d of sliced) {
      const sevMap = dailySourceByDate[d] || {};
      if (filters.severity === "all") {
        for (const c of Object.values(sevMap)) total += c as number;
      } else {
        total += (sevMap[filters.severity] || 0) as number;
      }
    }
    return total;
  }

  public async getDashboardStats(): Promise<{
    totalVulnerabilities: number;
    criticalCount: number;
    highCount: number;
    newCount: number;
    resolvedCount: number;
  }> {
    try {
      const totalVulnerabilities = await db.vulns.count();
      const criticalCount = await db.vulns
        .where("severity")
        .equals("critical")
        .count();
      const highCount = await db.vulns.where("severity").equals("high").count();
      const newCount = await db.vulns.where("kaiStatus").equals("new").count();
      const resolvedCount = await db.vulns
        .where("kaiStatus")
        .equals("resolved")
        .count();

      return {
        totalVulnerabilities,
        criticalCount,
        highCount,
        newCount,
        resolvedCount,
      };
    } catch (error) {
      console.error("Error getting dashboard stats:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
