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
        const count = await db.vulns.count();
        setDataCount(count);
        setHasData(count > 0);
      } catch (error) {
        console.error("Error checking data:", error);
        setHasData(false);
      }
    };

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

      const data = await dashboardService.getChartData(effectiveFilters);
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
  }, [filters, analysisMode]);

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
    if (!hasData) return dataCount;

    try {
      const effectiveFilters = { ...filters, analysisMode };

      const count = await dashboardService.getFilteredCount(effectiveFilters);
      return count;
    } catch (error) {
      console.error("Error getting filtered count:", error);
      return dataCount;
    }
  }, [hasData, dataCount, filters, analysisMode]);

  const [filteredCount, setFilteredCount] = React.useState(dataCount);

  React.useEffect(() => {
    if (hasData) {
      getFilteredCount().then(setFilteredCount);
    }
  }, [hasData, getFilteredCount]);

  // Manual refresh handler
  const handleManualRefresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    await loadChartData();
    const count = await getFilteredCount();
    setFilteredCount(count);
    setLoading(false);
  }, [loadChartData, getFilteredCount]);

  // Auto-refresh once when ingestion completes
  const prevIngestingRef = React.useRef(isIngesting);
  React.useEffect(() => {
    const wasIngesting = prevIngestingRef.current;
    prevIngestingRef.current = isIngesting;
    if (wasIngesting && !isIngesting && hasData) {
      handleManualRefresh();
    }
  }, [isIngesting, hasData, handleManualRefresh]);

  // Keep counts in sync. When DB is empty, approximate using filtered count (from fallback data in service)
  React.useEffect(() => {
    const syncCounts = async () => {
      try {
        const count = await db.vulns.count();
        if (count > 0) {
          setDataCount(count);
          setHasData(true);
        } else if (isIngesting) {
          const total = await dashboardService.getFilteredCount({
            severity: "all",
            kaiStatus: "all",
            dateRange: { start: "", end: "" },
            analysisMode: "all",
          } as any);
          setDataCount(total);
          setHasData(false);
        } else {
          setDataCount(0);
          setHasData(false);
        }
      } catch (e) {
        setHasData(false);
      }
    };
    syncCounts();
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

      {isIngesting && (
        <div className="ingestion-notice">
          <p>
            🔄 Data processing in progress: {Math.round(ingestionProgress)}%
            complete
          </p>
        </div>
      )}

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
        <Box display="flex" flexDirection="column" gap={3}>
          {isIngesting && (
            <Box
              display="flex"
              justifyContent="flex-end"
              alignItems="center"
              mb={1}
            >
              <Tooltip title="Refresh charts with the latest ingested data">
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
          )}
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
