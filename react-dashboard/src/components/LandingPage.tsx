import { useNavigate } from "react-router-dom";
import { Box, Paper, Typography, Button, Stack, Chip } from "@mui/material";
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
  return (
    <Box className="landing-page">
      <Paper className="hero" elevation={0} sx={{ p: 4, mb: 4 }}>
        <Stack spacing={2} alignItems="center">
          <Chip
            label="KaiCyber"
            color="primary"
            variant="outlined"
            size="small"
            className="brand-chip"
          />
          <Typography variant="h3" component="h1" className="hero-title">
            Actionable Vulnerability Intelligence
          </Typography>
          <Typography variant="subtitle1" className="hero-subtitle">
            Turn massive CVE feeds into clear, prioritized security insights
            your team can act on now.
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 1 }}
          >
            <Button
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600 }}
              onClick={() => navigate("/dashboard")}
            >
              {isIngesting
                ? "📊 Enter Dashboard (Loading...)"
                : "🚀 Enter Dashboard"}
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600 }}
              onClick={() => navigate("/vulnerabilities")}
            >
              Browse Vulnerabilities
            </Button>
          </Stack>
          {!isIngesting && totalRows > 0 && (
            <Typography className="success-message" variant="body2">
              ✅ Data loaded: {totalRows.toLocaleString()} records ready for
              analysis
            </Typography>
          )}
        </Stack>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }} className="features-container">
        <Typography variant="h6" component="h2" gutterBottom>
          Why KaiCyber
        </Typography>
        <Box className="features-grid">
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6">Prioritized Risk</Typography>
            <Typography variant="body2">
              Focus on what matters: severity trends, CVSS exposure, and risk
              factors at a glance.
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6">Real-time Updates</Typography>
            <Typography variant="body2">
              Live ingestion with a cached snapshot so you see insights
              instantly.
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6">Deep Filtering</Typography>
            <Typography variant="body2">
              Slice by severity, AI analysis, date windows, and more without
              losing performance.
            </Typography>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2 }} className="feature-card">
            <Typography variant="h6">Visual Clarity</Typography>
            <Typography variant="body2">
              Clean, interactive charts for trends, severity distribution, and
              CVSS impact.
            </Typography>
          </Paper>
        </Box>
      </Paper>

      <Paper sx={{ p: 3 }} className="how-container" elevation={0}>
        <Typography variant="h6" component="h2" gutterBottom>
          How it works
        </Typography>
        <Box className="how-grid">
          <Paper variant="outlined" className="how-card" sx={{ p: 2 }}>
            <Typography variant="subtitle2">1. Ingest</Typography>
            <Typography variant="body2">
              Pull CVE data securely from your sources.
            </Typography>
          </Paper>
          <Paper variant="outlined" className="how-card" sx={{ p: 2 }}>
            <Typography variant="subtitle2">2. Normalize</Typography>
            <Typography variant="body2">
              Standardize fields and compute key metrics.
            </Typography>
          </Paper>
          <Paper variant="outlined" className="how-card" sx={{ p: 2 }}>
            <Typography variant="subtitle2">3. Analyze</Typography>
            <Typography variant="body2">
              Aggregate, trend, and prioritize with AI-assisted filters.
            </Typography>
          </Paper>
          <Paper variant="outlined" className="how-card" sx={{ p: 2 }}>
            <Typography variant="subtitle2">4. Act</Typography>
            <Typography variant="body2">
              Drill down to affected assets and export for action.
            </Typography>
          </Paper>
        </Box>
      </Paper>
    </Box>
  );
};

export default LandingPage;
