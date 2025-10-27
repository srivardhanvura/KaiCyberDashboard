import React from "react";
import { Box, Typography, CircularProgress, Alert } from "@mui/material";
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

  React.useEffect(() => {
    if (hasData) {
      loadChartData();
    }
  }, [hasData, filters]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Loading chart data...");
      const data = await dashboardService.getChartData(filters);
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
  };

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      severity: "all",
      kaiStatus: "all",
      dateRange: { start: "", end: "" },
    });
  };

  if (isIngesting && !hasData) {
    return (
      <div className="loading-page">
        <h1>Loading Dashboard...</h1>

        <div className="loading-card">
          <h3>Processing Vulnerability Data</h3>

          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div
                className="loading-progress-fill"
                style={{ width: `${Math.min(ingestionProgress, 100)}%` }}
              />
            </div>
            <p className="loading-progress-text">
              {Math.round(ingestionProgress)}% complete
            </p>
          </div>

          <p className="loading-description">
            {totalRows.toLocaleString()} rows processed so far...
          </p>
        </div>

        <div className="loading-status">
          <p>🔄 Data is being processed in the background</p>
          <p>📊 Dashboard will update automatically when ready</p>
        </div>
      </div>
    );
  }

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
      <div className="dashboard-header">
        <div className="dashboard-title-container">
          <h1 className="dashboard-title">Vulnerability Dashboard</h1>
        </div>
        <div className="dashboard-stats">
          <p className="dashboard-stats-label">Total Vulnerabilities</p>
          <p className="dashboard-stats-value">{dataCount.toLocaleString()}</p>
        </div>
      </div>

      {isIngesting && (
        <div className="ingestion-notice">
          <p>
            🔄 Data ingestion in progress: {Math.round(ingestionProgress)}%
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
      />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      ) : chartData ? (
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Charts Row 1 */}
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1" minWidth="400px">
              <SeverityPieChart data={chartData.severityData} />
            </Box>
            <Box flex="1" minWidth="400px">
              <RiskFactorsBarChart data={chartData.riskFactorsData} />
            </Box>
          </Box>

          {/* Charts Row 2 */}
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex="1" minWidth="400px">
              <VulnerabilityTrendChart data={chartData.trendData} />
            </Box>
            <Box flex="1" minWidth="400px">
              <CVSSScatterPlot data={chartData.cvssData} />
            </Box>
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
