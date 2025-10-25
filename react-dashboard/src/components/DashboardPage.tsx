import React from "react";
import { db } from "../db/db";
import type { VulnRow } from "../types";
import SeverityTotals from "./SeverityTotals";
import RecentHighs from "./RecentHighs";

interface DashboardPageProps {
  isIngesting: boolean;
  ingestionProgress: number;
  totalRows: number;
  onBackToLanding?: () => void;
}

function DashboardPage({ isIngesting, ingestionProgress, totalRows, onBackToLanding }: DashboardPageProps) {
  const [hasData, setHasData] = React.useState(false);
  const [dataCount, setDataCount] = React.useState(0);

  // Check if we have data in the database
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
    
    // Check every 2 seconds while ingesting
    const interval = setInterval(checkData, 2000);
    return () => clearInterval(interval);
  }, [isIngesting]);

  if (isIngesting && !hasData) {
    return (
      <div style={{ 
        fontFamily: "system-ui", 
        padding: "40px 20px", 
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h1 style={{ color: "#2c3e50", marginBottom: "2rem" }}>
          📊 Loading Dashboard...
        </h1>
        
        <div style={{
          backgroundColor: "#f8f9fa",
          border: "1px solid #e9ecef",
          borderRadius: "8px",
          padding: "2rem",
          marginBottom: "2rem"
        }}>
          <h3 style={{ color: "#495057", marginBottom: "1rem" }}>
            Processing Vulnerability Data
          </h3>
          
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ 
              width: "100%", 
              height: "16px", 
              backgroundColor: "#e0e0e0", 
              borderRadius: "8px",
              overflow: "hidden"
            }}>
              <div style={{
                width: `${Math.min(ingestionProgress, 100)}%`,
                height: "100%",
                backgroundColor: "#007bff",
                transition: "width 0.3s ease"
              }} />
            </div>
            <p style={{ margin: "0.5rem 0 0 0", color: "#495057" }}>
              {Math.round(ingestionProgress)}% complete
            </p>
          </div>
          
          <p style={{ margin: 0, color: "#6c757d", fontSize: "0.9rem" }}>
            {totalRows.toLocaleString()} rows processed so far...
          </p>
        </div>

        <div style={{ color: "#6c757d", fontSize: "0.9rem" }}>
          <p>🔄 Data is being processed in the background</p>
          <p>📊 Dashboard will update automatically when ready</p>
        </div>
      </div>
    );
  }

  if (!hasData && !isIngesting) {
    return (
      <div style={{ 
        fontFamily: "system-ui", 
        padding: "40px 20px", 
        textAlign: "center",
        maxWidth: "600px",
        margin: "0 auto"
      }}>
        <h1 style={{ color: "#dc3545", marginBottom: "2rem" }}>
          ⚠️ No Data Available
        </h1>
        
        <div style={{
          backgroundColor: "#f8d7da",
          border: "1px solid #f5c6cb",
          borderRadius: "8px",
          padding: "2rem",
          marginBottom: "2rem"
        }}>
          <p style={{ margin: 0, color: "#721c24" }}>
            No vulnerability data has been loaded yet. Please wait for the data ingestion to complete.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", padding: 16 }}>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "2rem",
        paddingBottom: "1rem",
        borderBottom: "2px solid #e9ecef"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <h1 style={{ margin: 0, color: "#2c3e50" }}>
            🛡️ Vulnerability Dashboard
          </h1>
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              style={{
                padding: "8px 16px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "0.9rem"
              }}
            >
              ← Back to Landing
            </button>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: "0 0 0.25rem 0", color: "#6c757d", fontSize: "0.9rem" }}>
            Total Vulnerabilities
          </p>
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: "bold", color: "#495057" }}>
            {dataCount.toLocaleString()}
          </p>
        </div>
      </div>

      {isIngesting && (
        <div style={{
          backgroundColor: "#d1ecf1",
          border: "1px solid #bee5eb",
          borderRadius: "4px",
          padding: "0.75rem",
          marginBottom: "1rem"
        }}>
          <p style={{ margin: 0, color: "#0c5460", fontSize: "0.9rem" }}>
            🔄 Data ingestion in progress: {Math.round(ingestionProgress)}% complete
          </p>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <SeverityTotals />
        <RecentHighs limit={20} />
      </div>
    </div>
  );
}

export default DashboardPage;
