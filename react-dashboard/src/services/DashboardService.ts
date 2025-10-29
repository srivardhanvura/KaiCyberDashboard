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

type SnapshotPayload =
  | {
      rows: VulnRow[];
      totalCount?: number;
    }
  | {
      chartData: ChartData;
      totalCount?: number;
    };

class DashboardService {
  private snapshot: SnapshotPayload | null = null;
  private snapshotLoaded = false;

  private async loadSnapshot(): Promise<SnapshotPayload | null> {
    if (this.snapshotLoaded) return this.snapshot;
    this.snapshotLoaded = true;
    try {
      const res = await fetch("/dashboard_snapshot.json", {
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn("No snapshot available (HTTP)");
        this.snapshot = null;
        return null;
      }
      const json = await res.json();
      if (json?.rows && Array.isArray(json.rows)) {
        this.snapshot = {
          rows: json.rows as VulnRow[],
          totalCount: json.totalCount,
        };
      } else if (json?.chartData) {
        this.snapshot = {
          chartData: json.chartData as ChartData,
          totalCount: json.totalCount,
        };
      } else {
        console.warn("Snapshot format not recognized");
        this.snapshot = null;
      }
      return this.snapshot;
    } catch (e) {
      console.warn("Failed to load snapshot:", e);
      this.snapshot = null;
      return null;
    }
  }
  public async getChartData(filters: DashboardFilters): Promise<ChartData> {
    try {
      console.log("Getting chart data with filters:", filters);

      // If DB is empty, operate on cached snapshot if available
      const totalCount = await db.vulns.count();
      const useSnapshot = totalCount === 0;

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
        if (snap && "rows" in snap) {
          vulnerabilities = (snap.rows as VulnRow[]).filter(baseFilter);
        } else if (snap && "chartData" in snap) {
          // Return precomputed chart data when provided
          return snap.chartData as ChartData;
        } else {
          vulnerabilities = [];
        }
      } else {
        vulnerabilities = await (query as any)
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

  public async getFilteredCount(filters: DashboardFilters): Promise<number> {
    try {
      const totalCount = await db.vulns.count();
      const useSnapshot = totalCount === 0;
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
        if (snap && "rows" in snap) {
          return (snap.rows as VulnRow[]).filter(baseFilter).length;
        }
        if (
          snap &&
          "totalCount" in snap &&
          typeof snap.totalCount === "number"
        ) {
          return snap.totalCount as number;
        }
        return 0;
      }

      return await (query as any).count();
    } catch (error) {
      console.error("Error getting filtered count:", error);
      throw error;
    }
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
