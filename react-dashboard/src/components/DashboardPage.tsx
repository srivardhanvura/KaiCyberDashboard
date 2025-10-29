import React from "react";
import {
  Box,
  Typography,
  Alert,
  Skeleton,
  Grow,
  Fade,
  Paper,
  Tooltip,
  Button,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { db } from "../db/db";
import DashboardFilters from "./DashboardFilters";
import SeverityPieChart from "./charts/SeverityPieChart";
import RiskFactorsBarChart from "./charts/RiskFactorsBarChart";
import VulnerabilityTrendChart from "./charts/VulnerabilityTrendChart";
import CVSSScatterPlot from "./charts/CVSSScatterPlot";
import {
  dashboardService,
  DashboardFilters as FilterState,
  ChartData,
} from "../services/DashboardService";
import "./DashboardPage.css";

interface DashboardPageProps {
  isIngesting: boolean;
  ingestionProgress: number;
  totalRows: number;
}

const DashboardPage = ({
  isIngesting,
  ingestionProgress,
  totalRows,
}: DashboardPageProps) => {
  const [hasData, setHasData] = React.useState(false);
  const [dataCount, setDataCount] = React.useState(0);
  const [chartData, setChartData] = React.useState<ChartData | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = React.useState<
    "all" | "analysis" | "ai-analysis"
  >("all");
  const [filters, setFilters] = React.useState<FilterState>({
    severity: "all",
    kaiStatus: "all",
    dateRange: { start: "", end: "" },
  });

  React.useEffect(() => {
    const checkData = async () => {
      try {
        // During ingestion, avoid overriding snapshot-derived totals with partial DB counts
        if (isIngesting) return;
        const count = await db.vulns.count();
        setDataCount(count);
        setHasData(count > 0);
      } catch (error) {
        console.error("Error checking data:", error);
        setHasData(false);
      }
    };

    if (isIngesting) {
      return;
    }

    checkData();

    const interval = setInterval(checkData, 2000);
    return () => clearInterval(interval);
  }, [isIngesting]);

  const loadChartData = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading chart data...");

      const effectiveFilters = { ...filters, analysisMode };

      const data = await dashboardService.getChartData(effectiveFilters, {
        preferSnapshot: isIngesting,
      });
      console.log("Chart data loaded successfully:", data);
      setChartData(data);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load chart data";
      setError(`Failed to load chart data: ${errorMessage}`);
      console.error("Error loading chart data:", err);
    } finally {
      setLoading(false);
    }
  }, [filters, analysisMode, isIngesting]);

  React.useEffect(() => {
    // Always attempt to load, service falls back to in-code data when DB is empty
    loadChartData();
  }, [loadChartData]);

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      severity: "all",
      kaiStatus: "all",
      dateRange: { start: "", end: "" },
    });
    setAnalysisMode("all");
  };

  const handleAnalysisModeChange = (
    mode: "all" | "analysis" | "ai-analysis"
  ) => {
    setAnalysisMode(mode);
  };

  const getFilteredCount = React.useCallback(async () => {
    try {
      const effectiveFilters = { ...filters, analysisMode };
      const count = await dashboardService.getFilteredCount(effectiveFilters, {
        preferSnapshot: isIngesting,
      });
      return count;
    } catch (error) {
      console.error("Error getting filtered count:", error);
      return dataCount;
    }
  }, [dataCount, filters, analysisMode, isIngesting]);

  const [filteredCount, setFilteredCount] = React.useState(dataCount);

  React.useEffect(() => {
    getFilteredCount().then(setFilteredCount);
  }, [getFilteredCount]);

  // Refresh and preserve current filters
  const refreshPreserveFilters = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await loadChartData();
      const count = await getFilteredCount();
      setFilteredCount(count);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to load chart data";
      setError(`Failed to load chart data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [loadChartData, getFilteredCount]);

  // Manual refresh handler - reset filters and reload
  const handleManualRefresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);

    // Reset filters to defaults
    setFilters({
      severity: "all",
      kaiStatus: "all",
      dateRange: { start: "", end: "" },
    });
    setAnalysisMode("all");

    // Load using default filters immediately
    try {
      const defaultFilters = {
        severity: "all",
        kaiStatus: "all",
        dateRange: { start: "", end: "" },
        analysisMode: "all",
      } as any;
      const data = await dashboardService.getChartData(defaultFilters, {
        preferSnapshot: isIngesting,
      });
      setChartData(data);
      const count = await dashboardService.getFilteredCount(defaultFilters, {
        preferSnapshot: isIngesting,
      });
      setFilteredCount(count);
    } catch (e) {
      const errorMessage =
        e instanceof Error ? e.message : "Failed to load chart data";
      setError(`Failed to load chart data: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [isIngesting]);

  // Auto-refresh once when ingestion completes
  const prevIngestingRef = React.useRef(isIngesting);
  React.useEffect(() => {
    const wasIngesting = prevIngestingRef.current;
    prevIngestingRef.current = isIngesting;
    if (wasIngesting && !isIngesting && hasData) {
      // Preserve user's current filters when ingestion completes
      refreshPreserveFilters();
    }
  }, [isIngesting, hasData, refreshPreserveFilters]);

  // Keep counts in sync. While ingesting, always use snapshot-derived total; after ingestion, use DB count
  React.useEffect(() => {
    const syncCounts = async () => {
      try {
        if (isIngesting) {
          // Show snapshot total to keep UI consistent with charts while streaming
          const total = await dashboardService.getSnapshotTotalCount();
          setDataCount(total);
          setHasData(false);
        } else {
          const count = await db.vulns.count();
          setDataCount(count);
          setHasData(count > 0);
        }
      } catch (e) {
        setHasData(false);
      }
    };
    syncCounts();

    if (isIngesting) {
      // Poll snapshot total while ingesting so it updates once snapshot becomes available
      const interval = setInterval(syncCounts, 2000);
      return () => clearInterval(interval);
    }
  }, [isIngesting]);

  if (!hasData && !isIngesting) {
    return (
      <div className="no-data-page">
        <h1>No Data Available</h1>

        <div className="no-data-card">
          <p>
            No vulnerability data has been loaded yet. Please wait for the data
            ingestion to complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Fade in timeout={250}>
        <div className="dashboard-header">
          <div className="dashboard-title-container">
            <h1 className="dashboard-title">Vulnerability Dashboard</h1>
          </div>
          <div className="dashboard-stats">
            <p className="dashboard-stats-label">Total Vulnerabilities</p>
            <p className="dashboard-stats-value">
              {dataCount.toLocaleString()}
            </p>
          </div>
        </div>
      </Fade>

      <DashboardFilters
        severityFilter={filters.severity}
        kaiStatusFilter={filters.kaiStatus}
        dateRange={filters.dateRange}
        onSeverityChange={(severity) => handleFilterChange({ severity })}
        onKaiStatusChange={(kaiStatus) => handleFilterChange({ kaiStatus })}
        onDateRangeChange={(dateRange) => handleFilterChange({ dateRange })}
        onClearFilters={handleClearFilters}
        onAnalysisModeChange={handleAnalysisModeChange}
        analysisMode={analysisMode}
        totalCount={dataCount}
        filteredCount={filteredCount}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box display="flex" justifyContent="flex-end" alignItems="center" mb={1}>
        <Tooltip title="Refresh charts and reset filters">
          <Button
            onClick={handleManualRefresh}
            startIcon={<RefreshIcon />}
            size="small"
            variant="outlined"
          >
            Refresh charts
          </Button>
        </Tooltip>
      </Box>

      {loading ? (
        <Box display="flex" flexDirection="column" gap={3}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Paper sx={{ p: 2, flex: 1, minWidth: "400px" }} elevation={1}>
              <Skeleton variant="text" width={160} height={28} />
              <Skeleton variant="rounded" height={260} sx={{ mt: 1 }} />
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: "400px" }} elevation={1}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" height={260} sx={{ mt: 1 }} />
            </Paper>
          </Box>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Paper sx={{ p: 2, flex: 1, minWidth: "400px" }} elevation={1}>
              <Skeleton variant="text" width={200} height={28} />
              <Skeleton variant="rounded" height={260} sx={{ mt: 1 }} />
            </Paper>
            <Paper sx={{ p: 2, flex: 1, minWidth: "400px" }} elevation={1}>
              <Skeleton variant="text" width={180} height={28} />
              <Skeleton variant="rounded" height={260} sx={{ mt: 1 }} />
            </Paper>
          </Box>
        </Box>
      ) : chartData ? (
        filteredCount === 0 ? (
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: "400px" }}>
                <Typography variant="subtitle1">
                  No data for current filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try clearing filters or selecting a broader date range.
                </Typography>
              </Paper>
              <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: "400px" }}>
                <Typography variant="subtitle1">
                  No data for current filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try clearing filters or selecting a broader date range.
                </Typography>
              </Paper>
            </Box>
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: "400px" }}>
                <Typography variant="subtitle1">
                  No data for current filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try clearing filters or selecting a broader date range.
                </Typography>
              </Paper>
              <Paper elevation={1} sx={{ p: 2, flex: 1, minWidth: "400px" }}>
                <Typography variant="subtitle1">
                  No data for current filters
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try clearing filters or selecting a broader date range.
                </Typography>
              </Paper>
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={3}>
            <Box display="flex" flexWrap="wrap" gap={3}>
              <Grow in timeout={220}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    flex: 1,
                    minWidth: "400px",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <SeverityPieChart
                    data={chartData.severityData}
                    disableAnimation={isIngesting}
                  />
                </Paper>
              </Grow>
              <Grow in timeout={260}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    flex: 1,
                    minWidth: "400px",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <RiskFactorsBarChart
                    data={chartData.riskFactorsData}
                    disableAnimation={isIngesting}
                  />
                </Paper>
              </Grow>
            </Box>

            <Box display="flex" flexWrap="wrap" gap={3}>
              <Grow in timeout={300}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    flex: 1,
                    minWidth: "400px",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <VulnerabilityTrendChart
                    data={chartData.trendData}
                    disableAnimation={isIngesting}
                  />
                </Paper>
              </Grow>
              <Grow in timeout={340}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    flex: 1,
                    minWidth: "400px",
                    transition: "transform 160ms ease, box-shadow 160ms ease",
                    "&:hover": { transform: "translateY(-2px)", boxShadow: 3 },
                  }}
                >
                  <CVSSScatterPlot
                    data={chartData.cvssData}
                    disableAnimation={isIngesting}
                  />
                </Paper>
              </Grow>
            </Box>
          </Box>
        )
      ) : (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <Typography>No chart data available</Typography>
        </Box>
      )}
    </div>
  );
};

export default DashboardPage;
