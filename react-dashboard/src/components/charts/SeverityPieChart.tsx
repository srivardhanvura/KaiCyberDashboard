import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { Card, CardContent, Typography, Box } from "@mui/material";
import { Severity } from "../../types";

interface SeverityPieChartProps {
  data: { severity: Severity; count: number }[];
  title?: string;
  disableAnimation?: boolean;
}

const COLORS = {
  critical: "#d32f2f",
  high: "#f57c00",
  medium: "#fbc02d",
  low: "#388e3c",
  unknown: "#757575",
};

const SeverityPieChart: React.FC<SeverityPieChartProps> = ({
  data,
  title = "Vulnerabilities by Severity",
  disableAnimation = false,
}) => {
  const chartData = React.useMemo(
    () =>
      data.map((item) => ({
        name: item.severity.charAt(0).toUpperCase() + item.severity.slice(1),
        value: item.count,
        color: COLORS[item.severity],
      })),
    [data]
  );

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${
                    typeof percent === "number"
                      ? (percent * 100).toFixed(0)
                      : "0"
                  }%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                isAnimationActive={!disableAnimation}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Count"]}
                labelFormatter={(label) => `Severity: ${label}`}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Total: {total.toLocaleString()} vulnerabilities
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default SeverityPieChart;
