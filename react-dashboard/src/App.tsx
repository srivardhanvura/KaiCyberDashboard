import React from "react";
import { dataService, IngestionStatus } from "./services/DataService";
import {
  PreferencesProvider,
  usePreferences,
} from "./contexts/PreferencesContext";
import LandingPage from "./components/LandingPage";
import DashboardPage from "./components/DashboardPage";
import PreferencesSettings from "./components/PreferencesSettings";
import { getThemeStyles } from "./styles/theme";

const App = () => {
  const [currentPage, setCurrentPage] = React.useState<"landing" | "dashboard">(
    "landing"
  );
  const [showPreferences, setShowPreferences] = React.useState(false);
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

      if (
        status.totalRows > 0 &&
        !status.isIngesting &&
        currentPage === "landing"
      ) {
        console.log("Data exists, going directly to dashboard");
        setCurrentPage("dashboard");
      }
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

      if (hasExistingData) {
        console.log("Data exists, going directly to dashboard");
        setCurrentPage("dashboard");
      } else if (!currentStatus.isIngesting && !currentStatus.error) {
        console.log("No data found, starting ingestion");
        dataService.startIngestion();
      }
    };

    checkAndStartIngestion();

    return () => {
      unsubscribe();
    };
  }, [currentPage]);

  const handleEnterDashboard = () => {
    setCurrentPage("dashboard");
  };

  const handleBackToLanding = () => {
    setCurrentPage("landing");
  };

  return (
    <PreferencesProvider>
      <AppContent
        currentPage={currentPage}
        showPreferences={showPreferences}
        ingestionStatus={ingestionStatus}
        onEnterDashboard={handleEnterDashboard}
        onBackToLanding={handleBackToLanding}
        onTogglePreferences={() => setShowPreferences(!showPreferences)}
        onClosePreferences={() => setShowPreferences(false)}
      />
    </PreferencesProvider>
  );
};

const AppContent = ({
  currentPage,
  showPreferences,
  ingestionStatus,
  onEnterDashboard,
  onBackToLanding,
  onTogglePreferences,
  onClosePreferences,
}: {
  currentPage: "landing" | "dashboard";
  showPreferences: boolean;
  ingestionStatus: IngestionStatus;
  onEnterDashboard: () => void;
  onBackToLanding: () => void;
  onTogglePreferences: () => void;
  onClosePreferences: () => void;
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
      <button
        onClick={onTogglePreferences}
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 100,
          padding: "12px",
          backgroundColor: theme.colors.primary,
          color: "#ffffff",
          border: "none",
          borderRadius: "50%",
          cursor: "pointer",
          fontSize: "18px",
          boxShadow: theme.shadows.md,
          transition: "all 0.2s ease",
        }}
        title="Settings"
      >
        ⚙️
      </button>

      {currentPage === "landing" ? (
        <LandingPage
          onEnterDashboard={onEnterDashboard}
          ingestionProgress={ingestionStatus.progress}
          isIngesting={ingestionStatus.isIngesting}
          totalRows={ingestionStatus.totalRows}
        />
      ) : (
        <DashboardPage
          isIngesting={ingestionStatus.isIngesting}
          ingestionProgress={ingestionStatus.progress}
          totalRows={ingestionStatus.totalRows}
          onBackToLanding={onBackToLanding}
        />
      )}

      <PreferencesSettings
        isOpen={showPreferences}
        onClose={onClosePreferences}
      />
    </div>
  );
};

export default App;
