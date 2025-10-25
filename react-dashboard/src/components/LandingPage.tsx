import React from "react";

interface LandingPageProps {
  onEnterDashboard: () => void;
  ingestionProgress: number;
  isIngesting: boolean;
  totalRows: number;
}

function LandingPage({ onEnterDashboard, ingestionProgress, isIngesting, totalRows }: LandingPageProps) {
  return (
    <div style={{ 
      fontFamily: "system-ui", 
      padding: "40px 20px", 
      textAlign: "center",
      maxWidth: "800px",
      margin: "0 auto"
    }}>
      <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#2c3e50" }}>
        🛡️ Vulnerability Dashboard
      </h1>
      
      <p style={{ 
        fontSize: "1.2rem", 
        color: "#7f8c8d", 
        marginBottom: "2rem",
        lineHeight: "1.6"
      }}>
        Comprehensive security vulnerability analysis and monitoring platform
      </p>

      <div style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #e9ecef",
        borderRadius: "8px",
        padding: "2rem",
        marginBottom: "2rem"
      }}>
        <h2 style={{ color: "#495057", marginBottom: "1rem" }}>Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "4px" }}>
            <h3 style={{ color: "#dc3545", margin: "0 0 0.5rem 0" }}>🔴 Critical</h3>
            <p style={{ margin: 0, color: "#6c757d" }}>High-priority vulnerabilities</p>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "4px" }}>
            <h3 style={{ color: "#fd7e14", margin: "0 0 0.5rem 0" }}>🟠 High</h3>
            <p style={{ margin: 0, color: "#6c757d" }}>Important security issues</p>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "4px" }}>
            <h3 style={{ color: "#ffc107", margin: "0 0 0.5rem 0" }}>🟡 Medium</h3>
            <p style={{ margin: 0, color: "#6c757d" }}>Moderate risk factors</p>
          </div>
          <div style={{ padding: "1rem", backgroundColor: "white", borderRadius: "4px" }}>
            <h3 style={{ color: "#28a745", margin: "0 0 0.5rem 0" }}>🟢 Low</h3>
            <p style={{ margin: 0, color: "#6c757d" }}>Lower priority items</p>
          </div>
        </div>
      </div>

      {isIngesting && (
        <div style={{
          backgroundColor: "#e3f2fd",
          border: "1px solid #2196f3",
          borderRadius: "8px",
          padding: "1.5rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ color: "#1976d2", margin: "0 0 1rem 0" }}>
            📊 Loading Vulnerability Data...
          </h3>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ 
              width: "100%", 
              height: "12px", 
              backgroundColor: "#e0e0e0", 
              borderRadius: "6px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${Math.min(ingestionProgress, 100)}%`,
                height: "100%",
                backgroundColor: "#2196f3",
                transition: "width 0.3s ease"
              }} />
            </div>
            <p style={{ margin: "0.5rem 0 0 0", color: "#1976d2" }}>
              {Math.round(ingestionProgress)}% complete ({totalRows.toLocaleString()} rows processed)
            </p>
          </div>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            Data is being processed in the background. You can enter the dashboard to see real-time updates.
          </p>
        </div>
      )}

      <button 
        onClick={onEnterDashboard}
        style={{
          padding: "16px 32px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          fontSize: "1.1rem",
          fontWeight: "600",
          transition: "all 0.3s ease"
        }}
      >
        {isIngesting ? "📊 Enter Dashboard (Loading...)" : "🚀 Enter Dashboard"}
      </button>

      {!isIngesting && totalRows > 0 && (
        <p style={{ marginTop: "1rem", color: "#28a745", fontSize: "0.9rem" }}>
          ✅ Data loaded successfully! {totalRows.toLocaleString()} vulnerabilities ready for analysis.
        </p>
      )}
    </div>
  );
}

export default LandingPage;
