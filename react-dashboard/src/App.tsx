import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { dataService, IngestionStatus } from "./services/DataService";
import {
  PreferencesProvider,
  usePreferences,
} from "./contexts/PreferencesContext";
import LandingPage from "./components/LandingPage";
import DashboardPage from "./components/DashboardPage";
import VulnerabilitiesPage from "./components/VulnerabilitiesPage";
import IndividualVulnerabilityPage from "./components/IndividualVulnerabilityPage";
import VulnerabilityComparisonPage from "./components/VulnerabilityComparisonPage";
import PreferencesSettings from "./components/PreferencesSettings";
import AppThemeProvider from "./components/ThemeProvider";
import NavigationDrawer from "./components/NavigationDrawer";
import TopNavigation from "./components/TopNavigation";
import { getThemeStyles } from "./styles/theme";

const App = () => {
  const [showPreferences, setShowPreferences] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [ingestionStatus, setIngestionStatus] = React.useState<IngestionStatus>(
    {
      isIngesting: false,
      progress: 0,
      totalRows: 0,
      error: null,
    }
  );

  React.useEffect(() => {
    const unsubscribe = dataService.subscribe((status) => {
      console.log("Data service status update:", status);
      setIngestionStatus(status);
    });

    const initialStatus = dataService.getStatus();
    console.log("Initial status:", initialStatus);
    setIngestionStatus(initialStatus);

    const checkAndStartIngestion = async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));

      const hasExistingData = await dataService.hasData();
      const currentStatus = dataService.getStatus();
      console.log("After initialization check:", {
        hasExistingData,
        currentStatus,
      });

      if (
        !hasExistingData &&
        !currentStatus.isIngesting &&
        !currentStatus.error
      ) {
        console.log("No data found, starting ingestion");
        dataService.startIngestion();
      }
    };

    checkAndStartIngestion();

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <PreferencesProvider>
      <AppThemeProvider>
        <Router>
          <AppContent
            showPreferences={showPreferences}
            drawerOpen={drawerOpen}
            ingestionStatus={ingestionStatus}
            onTogglePreferences={() => setShowPreferences(!showPreferences)}
            onClosePreferences={() => setShowPreferences(false)}
            onToggleDrawer={() => setDrawerOpen(!drawerOpen)}
            onCloseDrawer={() => setDrawerOpen(false)}
          />
        </Router>
      </AppThemeProvider>
    </PreferencesProvider>
  );
};

const AppContent = ({
  showPreferences,
  drawerOpen,
  ingestionStatus,
  onTogglePreferences,
  onClosePreferences,
  onToggleDrawer,
  onCloseDrawer,
}: {
  showPreferences: boolean;
  drawerOpen: boolean;
  ingestionStatus: IngestionStatus;
  onTogglePreferences: () => void;
  onClosePreferences: () => void;
  onToggleDrawer: () => void;
  onCloseDrawer: () => void;
}) => {
  const { preferences } = usePreferences();
  const theme = React.useMemo(() => {
    return getThemeStyles(preferences);
  }, [preferences]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: theme.colors.background,
        color: theme.colors.text,
        fontSize: theme.fontSize,
      }}
    >
      <NavigationDrawer
        open={drawerOpen}
        onClose={onCloseDrawer}
        onOpenSettings={onTogglePreferences}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/landing" replace />} />
        <Route
          path="/landing"
          element={
            <>
              <TopNavigation
                onMenuClick={onToggleDrawer}
                onSettingsClick={onTogglePreferences}
                title="KaiCyber Dashboard"
              />
              <LandingPage
                ingestionProgress={ingestionStatus.progress}
                isIngesting={ingestionStatus.isIngesting}
                totalRows={ingestionStatus.totalRows}
              />
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <TopNavigation
                onMenuClick={onToggleDrawer}
                onSettingsClick={onTogglePreferences}
                title="Dashboard"
              />
              <DashboardPage
                isIngesting={ingestionStatus.isIngesting}
                ingestionProgress={ingestionStatus.progress}
                totalRows={ingestionStatus.totalRows}
              />
            </>
          }
        />
        <Route
          path="/vulnerabilities"
          element={
            <>
              <TopNavigation
                onMenuClick={onToggleDrawer}
                onSettingsClick={onTogglePreferences}
                title="Vulnerabilities"
              />
              <VulnerabilitiesPage />
            </>
          }
        />
        <Route
          path="/vulnerability/:id"
          element={
            <>
              <TopNavigation
                onMenuClick={onToggleDrawer}
                onSettingsClick={onTogglePreferences}
                title="Vulnerability Details"
              />
              <IndividualVulnerabilityPage />
            </>
          }
        />
        <Route
          path="/vulnerability-comparison"
          element={
            <>
              <TopNavigation
                onMenuClick={onToggleDrawer}
                onSettingsClick={onTogglePreferences}
                title="Vulnerability Comparison"
              />
              <VulnerabilityComparisonPage />
            </>
          }
        />
      </Routes>

      <PreferencesSettings
        isOpen={showPreferences}
        onClose={onClosePreferences}
      />
    </div>
  );
};

export default App;
