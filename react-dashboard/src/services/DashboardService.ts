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

class DashboardService {
  public async getChartData(filters: DashboardFilters): Promise<ChartData> {
    try {
      console.log("Getting chart data with filters:", filters);

      let query = db.vulns.toCollection();

      if (filters.severity !== "all") {
        query = query.filter((vuln) => vuln.severity === filters.severity);
      }

      if (filters.kaiStatus !== "all") {
        query = query.filter((vuln) => vuln.kaiStatus === filters.kaiStatus);
      }

      // Apply analysis mode filtering
      if (filters.analysisMode === "analysis") {
        // Exclude vulnerabilities with kaiStatus "invalid - norisk"
        query = query.filter((vuln) => vuln.kaiStatus !== "invalid - norisk");
      } else if (filters.analysisMode === "ai-analysis") {
        // Exclude vulnerabilities with kaiStatus "ai-invalid-norisk"
        query = query.filter((vuln) => vuln.kaiStatus !== "ai-invalid-norisk");
      }

      if (filters.dateRange.start) {
        const startDate = new Date();
        startDate.setDate(
          startDate.getDate() - parseInt(filters.dateRange.start)
        );
        query = query.filter(
          (vuln) => vuln.discoveredAt >= startDate.getTime()
        );
      }

      const vulnerabilities = await query.toArray();
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
      let query = db.vulns.toCollection();

      // Apply filters to narrow down the dataset
      if (filters.severity !== "all") {
        query = query.filter((vuln) => vuln.severity === filters.severity);
      }

      if (filters.kaiStatus !== "all") {
        query = query.filter((vuln) => vuln.kaiStatus === filters.kaiStatus);
      }

      // Apply analysis mode filtering
      if (filters.analysisMode === "analysis") {
        // Exclude vulnerabilities with kaiStatus "invalid - norisk"
        query = query.filter((vuln) => vuln.kaiStatus !== "invalid - norisk");
      } else if (filters.analysisMode === "ai-analysis") {
        // Exclude vulnerabilities with kaiStatus "ai-invalid-norisk"
        query = query.filter((vuln) => vuln.kaiStatus !== "ai-invalid-norisk");
      }

      if (filters.dateRange.start) {
        const startDate = new Date();
        startDate.setDate(
          startDate.getDate() - parseInt(filters.dateRange.start)
        );
        query = query.filter(
          (vuln) => vuln.discoveredAt >= startDate.getTime()
        );
      }

      return await query.count();
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
