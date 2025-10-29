import React from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";
import { Severity } from "../../types";

interface CVSSData {
  cvss: number;
  daysSincePublished: number;
  severity: Severity;
  cve: string;
}

interface CVSSScatterPlotProps {
  data: CVSSData[];
  title?: string;
  disableAnimation?: boolean;
}

const CVSSScatterPlot: React.FC<CVSSScatterPlotProps> = ({
  data,
  title = "CVSS Score vs Time Since Publication",
  disableAnimation = false,
}) => {
  const theme = useTheme();

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
        return theme.palette.text.secondary;
    }
  };

  const chartData = data.map((item) => ({
    ...item,
    color: getSeverityColor(item.severity),
  }));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                dataKey="daysSincePublished"
                name="Days Since Published"
                label={{
                  value: "Days Since Published",
                  position: "insideBottom",
                  offset: -5,
                }}
              />
              <YAxis
                type="number"
                dataKey="cvss"
                name="CVSS Score"
                label={{
                  value: "CVSS Score",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value: number, name: string) => {
                  if (name === "cvss") return [value, "CVSS Score"];
                  if (name === "daysSincePublished")
                    return [value, "Days Since Published"];
                  return [value, name];
                }}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `CVE: ${payload[0].payload.cve}`;
                  }
                  return "";
                }}
              />
              <Scatter
                dataKey="cvss"
                fill="#8884d8"
                isAnimationActive={!disableAnimation}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            {data.length} vulnerabilities plotted by CVSS score and publication
            age
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default CVSSScatterPlot;
