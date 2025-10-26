import React from "react";
import { db } from "../db/db";
import type { VulnRow } from "../types";
import SeverityTotals from "./SeverityTotals";
import RecentHighs from "./RecentHighs";
import "./DashboardPage.css";

interface DashboardPageProps {
  isIngesting: boolean;
  ingestionProgress: number;
  totalRows: number;
  onBackToLanding?: () => void;
}

const DashboardPage = ({ isIngesting, ingestionProgress, totalRows, onBackToLanding }: DashboardPageProps) => {
  const [hasData, setHasData] = React.useState(false);
  const [dataCount, setDataCount] = React.useState(0);

  React.useEffect(() => {
    const checkData = async () => {
      try {
        const count = await db.vulns.count();
        setDataCount(count);
        setHasData(count > 0);
      } catch (error) {
        console.error('Error checking data:', error);
        setHasData(false);
      }
    };

    checkData();

    const interval = setInterval(checkData, 2000);
    return () => clearInterval(interval);
  }, [isIngesting]);

  if (isIngesting && !hasData) {
    return (
      <div className="loading-page">
        <h1>
          📊 Loading Dashboard...
        </h1>
        
        <div className="loading-card">
          <h3>
            Processing Vulnerability Data
          </h3>
          
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
        <h1>
          ⚠️ No Data Available
        </h1>
        
        <div className="no-data-card">
          <p>
            No vulnerability data has been loaded yet. Please wait for the data ingestion to complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="dashboard-title-container">
          <h1 className="dashboard-title">
            🛡️ Vulnerability Dashboard
          </h1>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="back-button"
            >
              ← Back to Landing
            </button>
          )}
        </div>
        <div className="dashboard-stats">
          <p className="dashboard-stats-label">
            Total Vulnerabilities
          </p>
          <p className="dashboard-stats-value">
            {dataCount.toLocaleString()}
          </p>
        </div>
      </div>

      {isIngesting && (
        <div className="ingestion-notice">
          <p>
            🔄 Data ingestion in progress: {Math.round(ingestionProgress)}% complete
          </p>
        </div>
      )}

      <div className="dashboard-grid">
        <SeverityTotals />
        <RecentHighs limit={20} />
      </div>
    </div>
  );
}

export default DashboardPage;
