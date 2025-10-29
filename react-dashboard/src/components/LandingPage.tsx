import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Button, useTheme } from "@mui/material";
import "./LandingPage.css";

interface LandingPageProps {
  ingestionProgress: number;
  isIngesting: boolean;
  totalRows: number;
}

const LandingPage = ({
  ingestionProgress,
  isIngesting,
  totalRows,
}: LandingPageProps) => {
  const navigate = useNavigate();
  const theme = useTheme();
  return (
    <Box className="landing-page">
      <Typography variant="h3" component="h1" gutterBottom>
        Vulnerability Dashboard
      </Typography>

      <Typography className="description" variant="subtitle1" gutterBottom>
        Comprehensive security vulnerability analysis and monitoring platform
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }} className="features-container">
        <Typography variant="h6" component="h2" gutterBottom>
          Features
        </Typography>
        <Box className="features-grid">
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6" className="critical-severity">
              🔴 Critical
            </Typography>
            <Typography variant="body2">
              High-priority vulnerabilities
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6" className="high-severity">
              🟠 High
            </Typography>
            <Typography variant="body2">Important security issues</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6" className="medium-severity">
              🟡 Medium
            </Typography>
            <Typography variant="body2">Moderate risk factors</Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6" className="low-severity">
              🟢 Low
            </Typography>
            <Typography variant="body2">Lower priority items</Typography>
          </Paper>
        </Box>
      </Paper>

      {isIngesting && (
        <Paper sx={{ p: 3, mb: 3 }} className="loading-container">
          <Typography variant="h6" gutterBottom>
            📊 Loading Vulnerability Data...
          </Typography>
          <Box className="progress-container">
            <Box className="progress-bar">
              <Box
                className="progress-fill"
                sx={{ backgroundColor: theme.palette.primary.main }}
                style={{ width: `${Math.min(ingestionProgress, 100)}%` }}
              />
            </Box>
            <Typography className="progress-text" variant="body2">
              {Math.round(ingestionProgress)}% complete (
              {totalRows.toLocaleString()} rows processed)
            </Typography>
          </Box>
          <Typography className="loading-description" variant="body2">
            Data is being processed in the background. You can enter the
            dashboard to see real-time updates.
          </Typography>
        </Paper>
      )}

      <Button
        variant="contained"
        color="primary"
        size="large"
        sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600, mb: 1 }}
        onClick={() => navigate("/dashboard")}
      >
        {isIngesting ? "📊 Enter Dashboard (Loading...)" : "🚀 Enter Dashboard"}
      </Button>

      {!isIngesting && totalRows > 0 && (
        <Typography className="success-message" variant="body2">
          ✅ Data loaded successfully! {totalRows.toLocaleString()}{" "}
          vulnerabilities ready for analysis.
        </Typography>
      )}
    </Box>
  );
};

export default LandingPage;
