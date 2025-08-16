"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "../components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
} from "recharts";

// Enhanced chart configuration with more vibrant colors
const chartConfig = {
  sunHours: {
    label: "Sun Hours",
    color: "#f59e0b", // Amber
  },
  efficiency: {
    label: "Efficiency %",
    color: "#10b981", // Emerald
  },
  production: {
    label: "Annual Production (kWh)",
    color: "#3b82f6", // Blue
  },
  suitable: {
    label: "Suitable",
    color: "#22c55e", // Green
  },
  notSuitable: {
    label: "Not Suitable",
    color: "#ef4444", // Red
  },
};

// Custom gradient definitions
const GradientDefs = () => (
  <defs>
    <linearGradient id="sunHoursGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#d97706" stopOpacity={0.6} />
    </linearGradient>
    <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#059669" stopOpacity={0.6} />
    </linearGradient>
    <linearGradient id="productionGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.6} />
    </linearGradient>
    <radialGradient id="pieGradient1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#22c55e" stopOpacity={1} />
      <stop offset="100%" stopColor="#16a34a" stopOpacity={0.8} />
    </radialGradient>
    <radialGradient id="pieGradient2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={1} />
      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.8} />
    </radialGradient>
  </defs>
);

// Custom tooltip with enhanced styling
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border/50 rounded-lg p-3 shadow-lg">
        <p className="font-semibold text-foreground">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.name}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Custom label for pie chart
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  name,
}) => {
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      className="font-semibold text-sm drop-shadow-lg"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function SolarCharts({ data }) {
  const suitabilityData = [
    {
      name: "Suitable",
      value: data.filter((spot) => spot.suitable).length,
      color: "url(#pieGradient1)",
    },
    {
      name: "Not Suitable",
      value: data.filter((spot) => !spot.suitable).length,
      color: "url(#pieGradient2)",
    },
  ];

  const efficiencyData = data.map((spot) => ({
    city: spot.city,
    efficiency: spot.efficiency,
    sunHours: spot.sunHoursPerDay,
    production: spot.annualProduction,
  }));

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 bg-clip-text text-transparent">
          ☀️ Solar Analysis Dashboard
        </h2>
        <p className="text-muted-foreground">
          Interactive solar energy potential visualization
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Sun Hours Chart */}
        <Card className="lg:col-span-2 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-amber-200/30 dark:border-amber-800/30">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 rounded-t-lg">
            <CardTitle className="text-amber-700 dark:text-amber-300 flex items-center gap-2">
              🌞 Sun Hours by City
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={efficiencyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <GradientDefs />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/30"
                    stroke="url(#sunHoursGradient)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="city"
                    className="fill-foreground text-xs font-medium"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#f59e0b"
                  />
                  <YAxis
                    className="fill-foreground text-xs font-medium"
                    stroke="#f59e0b"
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar
                    dataKey="sunHours"
                    fill="url(#sunHoursGradient)"
                    name="Sun Hours/Day"
                    radius={[4, 4, 0, 0]}
                    className="drop-shadow-sm"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Enhanced Suitability Pie Chart */}
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-green-200/30 dark:border-green-800/30">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 rounded-t-lg">
            <CardTitle className="text-green-700 dark:text-green-300 flex items-center gap-2">
              📍 Location Suitability
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <GradientDefs />
                  <Pie
                    data={suitabilityData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={renderPieLabel}
                    outerRadius={90}
                    innerRadius={30}
                    paddingAngle={2}
                    fill="#8884d8"
                    dataKey="value"
                    className="drop-shadow-lg"
                  >
                    {suitabilityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="white"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <ChartTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Enhanced Area Chart for Efficiency vs Production */}
        <Card className="lg:col-span-3 shadow-lg hover:shadow-xl transition-shadow duration-300 border-2 border-blue-200/30 dark:border-blue-800/30">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-t-lg">
            <CardTitle className="text-blue-700 dark:text-blue-300 flex items-center gap-2">
              ⚡ Efficiency vs Annual Production
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={efficiencyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
                >
                  <GradientDefs />
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted/20"
                    stroke="url(#efficiencyGradient)"
                    strokeOpacity={0.1}
                  />
                  <XAxis
                    dataKey="city"
                    className="fill-foreground text-xs font-medium"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    stroke="#3b82f6"
                  />
                  <YAxis
                    yAxisId="left"
                    className="fill-foreground text-xs font-medium"
                    stroke="#10b981"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    className="fill-foreground text-xs font-medium"
                    stroke="#3b82f6"
                  />
                  <ChartTooltip content={<CustomTooltip />} />
                  <ChartLegend content={<ChartLegendContent />} />

                  {/* Efficiency Area */}
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="efficiency"
                    stroke="#10b981"
                    fill="url(#efficiencyGradient)"
                    strokeWidth={3}
                    name="Efficiency %"
                    fillOpacity={0.6}
                    className="drop-shadow-sm"
                  />

                  {/* Production Line with dots */}
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="production"
                    stroke="#3b82f6"
                    strokeWidth={4}
                    name="Production (kWh)"
                    dot={{
                      fill: "#3b82f6",
                      strokeWidth: 2,
                      r: 6,
                      className: "drop-shadow-md",
                    }}
                    activeDot={{
                      r: 8,
                      stroke: "#3b82f6",
                      strokeWidth: 2,
                      fill: "white",
                      className: "drop-shadow-lg",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-950 dark:to-orange-950 border-amber-200 dark:border-amber-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {Math.round(
                efficiencyData.reduce((acc, item) => acc + item.sunHours, 0) /
                  efficiencyData.length
              )}
            </div>
            <div className="text-sm text-amber-600 dark:text-amber-400">
              Avg Sun Hours
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {Math.round(
                efficiencyData.reduce((acc, item) => acc + item.efficiency, 0) /
                  efficiencyData.length
              )}
              %
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">
              Avg Efficiency
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {Math.round(
                efficiencyData.reduce((acc, item) => acc + item.production, 0) /
                  1000
              )}
              k
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">
              Total Production
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {data.length}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">
              Total Locations
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
