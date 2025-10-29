import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Button,
  ButtonGroup,
} from "@mui/material";
import {
  Clear as ClearIcon,
  Search as SearchIcon,
  SmartToy as AIIcon,
} from "@mui/icons-material";
import { Severity, KaiStatus } from "../types";

interface DashboardFiltersProps {
  severityFilter: Severity | "all";
  kaiStatusFilter: KaiStatus | "all";
  dateRange: { start: string; end: string };
  onSeverityChange: (severity: Severity | "all") => void;
  onKaiStatusChange: (status: KaiStatus | "all") => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onClearFilters: () => void;
  onAnalysisModeChange: (mode: "all" | "analysis" | "ai-analysis") => void;
  analysisMode: "all" | "analysis" | "ai-analysis";
  totalCount: number;
  filteredCount: number;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  severityFilter,
  kaiStatusFilter,
  dateRange,
  onSeverityChange,
  onKaiStatusChange,
  onDateRangeChange,
  onClearFilters,
  onAnalysisModeChange,
  analysisMode,
  totalCount,
  filteredCount,
}) => {
  const activeFiltersCount = [
    severityFilter !== "all",
    kaiStatusFilter !== "all",
    dateRange.start !== "" || dateRange.end !== "",
  ].filter(Boolean).length;

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Typography variant="h6">Dashboard Filters</Typography>
          {activeFiltersCount > 0 && (
            <Box display="flex" alignItems="center" gap={1}>
              <Chip
                label={`${activeFiltersCount} active`}
                color="primary"
                size="small"
              />
              <Button
                startIcon={<ClearIcon />}
                onClick={onClearFilters}
                size="small"
                variant="outlined"
              >
                Clear All
              </Button>
            </Box>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2}>
          <Box minWidth="150px" flex="1">
            <FormControl fullWidth size="small">
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) =>
                  onSeverityChange(e.target.value as Severity | "all")
                }
              >
                <MenuItem value="all">All Severities</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box minWidth="150px" flex="1">
            <FormControl fullWidth size="small">
              <InputLabel>Kai Status</InputLabel>
              <Select
                value={kaiStatusFilter}
                onChange={(e) =>
                  onKaiStatusChange(e.target.value as KaiStatus | "all")
                }
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="invalid - norisk">invalid - norisk</MenuItem>
                <MenuItem value="ai-invalid-norisk">ai-invalid-norisk</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box minWidth="150px" flex="1">
            <FormControl fullWidth size="small">
              <InputLabel id="start-date-label" shrink>
                Start Date
              </InputLabel>
              <Select
                labelId="start-date-label"
                label="Start Date"
                value={dateRange.start}
                displayEmpty
                renderValue={(value) => {
                  if (!value) return "All Time";
                  const map: Record<string, string> = {
                    "7": "Last 7 days",
                    "30": "Last 30 days",
                    "90": "Last 90 days",
                    "365": "Last year",
                  };
                  return map[String(value)] || "All Time";
                }}
                onChange={(e) =>
                  onDateRangeChange({ ...dateRange, start: e.target.value })
                }
              >
                <MenuItem value="">All Time</MenuItem>
                <MenuItem value="7">Last 7 days</MenuItem>
                <MenuItem value="30">Last 30 days</MenuItem>
                <MenuItem value="90">Last 90 days</MenuItem>
                <MenuItem value="365">Last year</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Analysis Action Buttons */}
        <Box mt={3}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Analysis Actions
          </Typography>
          <ButtonGroup variant="outlined" aria-label="analysis actions">
            <Button
              startIcon={<SearchIcon />}
              onClick={() => onAnalysisModeChange("analysis")}
              variant={analysisMode === "analysis" ? "contained" : "outlined"}
              color="primary"
              sx={{
                minWidth: 160,
                textTransform: "none",
                fontWeight: analysisMode === "analysis" ? 600 : 400,
              }}
            >
              Manual Analysis
              <Chip
                label={`Exclude "invalid - norisk"`}
                size="small"
                sx={{ ml: 1, fontSize: "0.7rem" }}
                color={analysisMode === "analysis" ? "primary" : "default"}
                variant={analysisMode === "analysis" ? "filled" : "outlined"}
              />
            </Button>
            <Button
              startIcon={<AIIcon />}
              onClick={() => onAnalysisModeChange("ai-analysis")}
              variant={
                analysisMode === "ai-analysis" ? "contained" : "outlined"
              }
              color="secondary"
              sx={{
                minWidth: 160,
                textTransform: "none",
                fontWeight: analysisMode === "ai-analysis" ? 600 : 400,
              }}
            >
              AI Analysis
              <Chip
                label={`Exclude "ai-invalid-norisk"`}
                size="small"
                sx={{ ml: 1, fontSize: "0.7rem" }}
                color={analysisMode === "ai-analysis" ? "secondary" : "default"}
                variant={analysisMode === "ai-analysis" ? "filled" : "outlined"}
              />
            </Button>
            <Button
              onClick={() => onAnalysisModeChange("all")}
              variant={analysisMode === "all" ? "contained" : "outlined"}
              color="inherit"
              sx={{
                minWidth: 120,
                textTransform: "none",
                fontWeight: analysisMode === "all" ? 600 : 400,
              }}
            >
              Show All
            </Button>
          </ButtonGroup>

          {/* Filter Impact Display */}
          <Box mt={2} display="flex" alignItems="center" gap={2}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredCount.toLocaleString()} of{" "}
              {totalCount.toLocaleString()} vulnerabilities
            </Typography>
            {analysisMode !== "all" &&
              totalCount > 0 &&
              filteredCount <= totalCount && (
                <Chip
                  label={`${Math.max(
                    0,
                    Math.min(
                      100,
                      ((totalCount - filteredCount) / totalCount) * 100
                    )
                  ).toFixed(1)}% filtered out`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
