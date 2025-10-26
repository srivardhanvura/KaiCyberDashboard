import React from "react";
import "./LandingPage.css";

interface LandingPageProps {
  onEnterDashboard: () => void;
  ingestionProgress: number;
  isIngesting: boolean;
  totalRows: number;
}

const LandingPage = ({
  onEnterDashboard,
  ingestionProgress,
  isIngesting,
  totalRows,
}: LandingPageProps) => {
  return (
    <div className="landing-page">
      <h1>
        🛡️ Vulnerability Dashboard
      </h1>

      <p className="description">
        Comprehensive security vulnerability analysis and monitoring platform
      </p>

      <div className="features-container">
        <h2>Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <h3 className="critical-severity">
              🔴 Critical
            </h3>
            <p>
              High-priority vulnerabilities
            </p>
          </div>
          <div className="feature-card">
            <h3 className="high-severity">
              🟠 High
            </h3>
            <p>
              Important security issues
            </p>
          </div>
          <div className="feature-card">
            <h3 className="medium-severity">
              🟡 Medium
            </h3>
            <p>Moderate risk factors</p>
          </div>
          <div className="feature-card">
            <h3 className="low-severity">🟢 Low</h3>
            <p>Lower priority items</p>
          </div>
        </div>
      </div>

      {isIngesting && (
        <div className="loading-container">
          <h3>
            📊 Loading Vulnerability Data...
          </h3>
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${Math.min(ingestionProgress, 100)}%` }}
              />
            </div>
            <p className="progress-text">
              {Math.round(ingestionProgress)}% complete (
              {totalRows.toLocaleString()} rows processed)
            </p>
          </div>
          <p className="loading-description">
            Data is being processed in the background. You can enter the
            dashboard to see real-time updates.
          </p>
        </div>
      )}

      <button
        onClick={onEnterDashboard}
        className="enter-dashboard-btn"
      >
        {isIngesting ? "📊 Enter Dashboard (Loading...)" : "🚀 Enter Dashboard"}
      </button>

      {!isIngesting && totalRows > 0 && (
        <p className="success-message">
          ✅ Data loaded successfully! {totalRows.toLocaleString()}{" "}
          vulnerabilities ready for analysis.
        </p>
      )}
    </div>
  );
};

export default LandingPage;
