import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, Typography, Box, useTheme } from "@mui/material";

interface RiskFactorsBarChartProps {
  data: { factor: string; count: number }[];
  title?: string;
}

const RiskFactorsBarChart: React.FC<RiskFactorsBarChartProps> = ({
  data,
  title = "Risk Factors Frequency",
}) => {
  const theme = useTheme();

  const chartData = data.map((item) => ({
    name:
      item.factor.length > 15
        ? item.factor.substring(0, 15) + "..."
        : item.factor,
    fullName: item.factor,
    count: item.count,
  }));

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box sx={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [value, "Count"]}
                labelFormatter={(label, payload) => {
                  if (payload && payload[0]) {
                    return `Risk Factor: ${payload[0].payload.fullName}`;
                  }
                  return `Risk Factor: ${label}`;
                }}
              />
              <Bar dataKey="count" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box mt={2}>
          <Typography variant="body2" color="text.secondary">
            Top {data.length} risk factors by frequency
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default RiskFactorsBarChart;
