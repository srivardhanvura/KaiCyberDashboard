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
} from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import { Severity, KaiStatus } from "../types";

interface DashboardFiltersProps {
  severityFilter: Severity | "all";
  kaiStatusFilter: KaiStatus | "all";
  dateRange: { start: string; end: string };
  onSeverityChange: (severity: Severity | "all") => void;
  onKaiStatusChange: (status: KaiStatus | "all") => void;
  onDateRangeChange: (range: { start: string; end: string }) => void;
  onClearFilters: () => void;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({
  severityFilter,
  kaiStatusFilter,
  dateRange,
  onSeverityChange,
  onKaiStatusChange,
  onDateRangeChange,
  onClearFilters,
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
              <InputLabel>Start Date</InputLabel>
              <Select
                value={dateRange.start}
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
      </CardContent>
    </Card>
  );
};

export default DashboardFilters;
