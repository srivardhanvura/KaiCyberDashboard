import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Typography,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
} from "@mui/icons-material";
import { db } from "../db/db";
import { VulnRow, Severity, KaiStatus } from "../types";
import { exportToCSV } from "../utils/csvExport";
import VulnerabilityDetailPopup from "./VulnerabilityDetailPopup";
import "./VulnerabilitiesPage.css";

interface VulnerabilitiesPageProps {}

const VulnerabilitiesPage: React.FC<VulnerabilitiesPageProps> = () => {
  const navigate = useNavigate();
  const [vulnerabilities, setVulnerabilities] = useState<VulnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [searchTerm, setSearchTerm] = useState("");
  const [severityFilter, setSeverityFilter] = useState<Severity | "all">("all");
  const [analysisFilter, setAnalysisFilter] = useState<
    "all" | "analysis" | "ai-analysis"
  >("all");
  const [sortBy, setSortBy] = useState<keyof VulnRow>("discoveredAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [popupOpen, setPopupOpen] = useState(false);
  const [selectedVulnId, setSelectedVulnId] = useState<string | null>(null);

  useEffect(() => {
    loadVulnerabilities();
  }, []);

  const loadVulnerabilities = async () => {
    try {
      setLoading(true);
      console.log("Loading vulnerabilities...");
      const allVulns = await db.vulns.toArray();
      console.log(`Loaded ${allVulns.length} vulnerabilities`);
      setVulnerabilities(allVulns);
    } catch (error) {
      console.error("Error loading vulnerabilities:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedVulnerabilities = useMemo(() => {
    let filtered = vulnerabilities.filter((vuln) => {
      const matchesSearch =
        vuln.cve?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vuln.imageName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSeverity =
        severityFilter === "all" || vuln.severity === severityFilter;

      const matchesAnalysis = (() => {
        if (analysisFilter === "all") return true;
        if (analysisFilter === "analysis") {
          return (vuln.kaiStatus || "new") === "invalid - norisk";
        }
        if (analysisFilter === "ai-analysis") {
          return (vuln.kaiStatus || "new") === "ai-invalid-norisk";
        }
        return true;
      })();

      return matchesSearch && matchesSeverity && matchesAnalysis;
    });

    filtered.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === "asc" ? 1 : -1;
      if (bValue === undefined) return sortOrder === "asc" ? -1 : 1;

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [
    vulnerabilities,
    searchTerm,
    severityFilter,
    analysisFilter,
    sortBy,
    sortOrder,
  ]);

  const paginatedVulnerabilities = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedVulnerabilities.slice(start, start + rowsPerPage);
  }, [filteredAndSortedVulnerabilities, page, rowsPerPage]);

  const getSeverityColor = (severity: Severity) => {
    switch (severity) {
      case "critical":
        return "#d32f2f";
      case "high":
        return "#f57c00";
      case "medium":
        return "#fbc02d";
      case "low":
        return "#388e3c";
      default:
        return "#757575";
    }
  };

  const getKaiStatusColor = (status: KaiStatus) => {
    switch (status) {
      case "invalid - norisk":
        return "#7b1fa2";
      case "ai-invalid-norisk":
        return "#f57c00";
      default:
        return "#757575";
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleSort = (column: keyof VulnRow) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    const dataToExport = filteredAndSortedVulnerabilities;
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `vulnerabilities_${timestamp}.csv`;
    exportToCSV(dataToExport, filename);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Loading vulnerabilities...</Typography>
      </Box>
    );
  }

  const handleAnalysisChange = (analysisStatus: string) => {
    if (analysisStatus === "analysis") {
      if (analysisFilter === "analysis") {
        setAnalysisFilter("all");
      } else {
        setAnalysisFilter("analysis");
      }
    } else {
      if (analysisFilter === "ai-analysis") {
        setAnalysisFilter("all");
      } else {
        setAnalysisFilter("ai-analysis");
      }
    }
  };

  const handleVulnerabilityClick = (vulnId: string) => {
    setSelectedVulnId(vulnId);
    setPopupOpen(true);
  };

  const handleClosePopup = () => {
    setPopupOpen(false);
    setSelectedVulnId(null);
  };

  const handleViewFullDetails = (vulnId: string) => {
    navigate(`/vulnerability/${vulnId}`);
  };

  const handleCompareClick = () => {
    navigate("/vulnerability-comparison");
  };

  return (
    <Box className="vulnerabilities-page">
      <Box className="vulnerabilities-header">
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <IconButton onClick={() => navigate("/dashboard")}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Vulnerabilities
          </Typography>
          <Box display="flex" gap={1}>
            <Tooltip title="Compare Vulnerabilities">
              <IconButton onClick={handleCompareClick} color="primary">
                <CompareIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={loadVulnerabilities}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2} mb={3}>
          <Box flex="1" minWidth="200px">
            <TextField
              fullWidth
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
                ),
              }}
            />
          </Box>
          <Box minWidth="150px">
            <FormControl fullWidth>
              <InputLabel>Severity</InputLabel>
              <Select
                value={severityFilter}
                onChange={(e) =>
                  setSeverityFilter(e.target.value as Severity | "all")
                }
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box display="flex" gap={1}>
            <Button
              variant={analysisFilter === "all" ? "contained" : "outlined"}
              onClick={() => setAnalysisFilter("all")}
              size="small"
            >
              All
            </Button>
            <Button
              variant={analysisFilter === "analysis" ? "contained" : "outlined"}
              onClick={() => handleAnalysisChange("analysis")}
              size="small"
              color="primary"
            >
              Analysis
            </Button>
            <Button
              variant={
                analysisFilter === "ai-analysis" ? "contained" : "outlined"
              }
              onClick={() => handleAnalysisChange("ai-analysis")}
              size="small"
              color="primary"
            >
              AI Analysis
            </Button>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            <Box display="flex" alignItems="center" gap={1}>
              <FilterIcon />
              <Typography variant="body2">
                {filteredAndSortedVulnerabilities.length} vulnerabilities found
              </Typography>
            </Box>
            <Tooltip title="Export filtered results to CSV">
              <IconButton
                onClick={handleExportCSV}
                color="primary"
                size="small"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell
                  onClick={() => handleSort("cve")}
                  sx={{ cursor: "pointer", fontWeight: "bold"}}
                >
                  CVE {sortBy === "cve" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell
                  onClick={() => handleSort("severity")}
                  sx={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  Severity{" "}
                  {sortBy === "severity" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell
                  onClick={() => handleSort("kaiStatus")}
                  sx={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  Kai Status{" "}
                  {sortBy === "kaiStatus" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell>Package</TableCell>
                <TableCell>Image</TableCell>
                <TableCell
                  onClick={() => handleSort("cvss")}
                  sx={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  CVSS {sortBy === "cvss" && (sortOrder === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell
                  onClick={() => handleSort("discoveredAt")}
                  sx={{ cursor: "pointer", fontWeight: "bold" }}
                >
                  Discovered{" "}
                  {sortBy === "discoveredAt" &&
                    (sortOrder === "asc" ? "↑" : "↓")}
                </TableCell>
                <TableCell>Risk Factors</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedVulnerabilities.map((vuln) => (
                <TableRow key={vuln.id} hover>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      fontWeight="bold"
                      sx={{ 
                        cursor: 'pointer',
                        color: 'primary.main',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                      onClick={() => handleVulnerabilityClick(vuln.id)}
                    >
                      {vuln.cve || "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={vuln.severity}
                      size="small"
                      sx={{
                        backgroundColor: getSeverityColor(vuln.severity),
                        color: "white",
                        fontWeight: "bold",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={
                        vuln.kaiStatus
                          ? vuln.kaiStatus.replace("_", " ")
                          : "Unknown"
                      }
                      size="small"
                      sx={{
                        backgroundColor: getKaiStatusColor(
                          vuln.kaiStatus || "new"
                        ),
                        color: "white",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {vuln.packageName || "N/A"}
                    </Typography>
                    {vuln.packageVersion && (
                      <Typography variant="caption" color="text.secondary">
                        v{vuln.packageVersion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {vuln.imageName || "N/A"}
                    </Typography>
                    {vuln.imageVersion && (
                      <Typography variant="caption" color="text.secondary">
                        {vuln.imageVersion}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {vuln.cvss ? vuln.cvss.toFixed(1) : "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {vuln.discoveredAt
                        ? formatDate(vuln.discoveredAt)
                        : "N/A"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {(vuln.riskFactors || [])
                        .slice(0, 2)
                        .map((factor, index) => (
                          <Chip
                            key={index}
                            label={factor}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      {(vuln.riskFactors || []).length > 2 && (
                        <Chip
                          label={`+${(vuln.riskFactors || []).length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedVulnerabilities.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      <VulnerabilityDetailPopup
        open={popupOpen}
        onClose={handleClosePopup}
        vulnerabilityId={selectedVulnId}
        onViewFullDetails={handleViewFullDetails}
      />
    </Box>
  );
};

export default VulnerabilitiesPage;
