"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Calculator, FileText, DollarSign, Zap } from "lucide-react";
import { generatePDF } from "../lib/pdf-generator";

export default function InvestmentSimulator({ cityData, onClose }) {
    // --- State ---
    const [monthlyBill, setMonthlyBill] = useState(1500); // 1500 TL default
    const [systemSize, setSystemSize] = useState(5); // 5 kW default
    const [electricityPrice, setElectricityPrice] = useState(2.8); // TL/kWh
    const [inflationRate, setInflationRate] = useState(10); // % Annual increase

    // --- Calculations ---
    // Approx cost per kW installed (fully loaded) ~ $1000 - $1200, let's say 35,000 TL
    const costPerKW = 35000;
    const systemCost = systemSize * costPerKW;

    // Annual Generation
    // Production = Size * Irradiance * 365 * 0.75 (Perf Ratio)
    // use cityData if available
    const dailySun = cityData?.sunHoursPerDay || 4.5;
    const annualOrne = dailySun * 365 * 0.75; // kWh per kW installed
    const annualProduction = systemSize * annualOrne;

    // Projections for 20 Years
    const projections = [];
    let cumulativeSavings = -systemCost; // Start with debt
    let paybackYear = null;

    for (let year = 1; year <= 20; year++) {
        // Price increases by inflation
        const currentPrice = electricityPrice * Math.pow(1 + inflationRate / 100, year - 1);

        // Yearly Savings
        const yearlySavings = annualProduction * currentPrice;

        cumulativeSavings += yearlySavings;

        if (cumulativeSavings >= 0 && paybackYear === null) {
            paybackYear = year;
        }

        projections.push({
            year: year,
            savings: Math.round(cumulativeSavings),
            production: Math.round(annualProduction),
        });
    }

    const handleDownloadReport = () => {
        const simulationState = {
            monthlyBill,
            systemSize,
            electricityPrice,
            systemCost,
            paybackPeriod: paybackYear || "> 20",
            totalSavings: cumulativeSavings + systemCost, // Gross savings
            co2Saved: (annualProduction * 20 * 0.00045).toFixed(1)
        };
        generatePDF(cityData, simulationState);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-primary" />
                        ROI Simulator
                    </h2>
                    <p className="text-muted-foreground">Adjust parameters to see your financial future.</p>
                </div>
                <Button variant="outline" onClick={onClose}>Close</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Controls */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">

                            {/* Bill Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">Monthly Bill (TL)</span>
                                    <span className="text-blue-600 font-bold">{monthlyBill} TL</span>
                                </div>
                                <Slider
                                    value={[monthlyBill]}
                                    onValueChange={(vals) => setMonthlyBill(vals[0])}
                                    min={500} max={10000} step={100}
                                />
                            </div>

                            {/* System Size Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">System Size (kW)</span>
                                    <span className="text-blue-600 font-bold">{systemSize} kW</span>
                                </div>
                                <Slider
                                    value={[systemSize]}
                                    onValueChange={(vals) => setSystemSize(vals[0])}
                                    min={3} max={25} step={1}
                                />
                                <p className="text-xs text-muted-foreground">Est. Cost: <span className="font-semibold text-red-500">{(systemCost).toLocaleString()} TL</span></p>
                            </div>

                            {/* Inflation Slider */}
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="font-medium">Electricity Inflation (%)</span>
                                    <span className="text-blue-600 font-bold">{inflationRate}%</span>
                                </div>
                                <Slider
                                    value={[inflationRate]}
                                    onValueChange={(vals) => setInflationRate(vals[0])}
                                    min={0} max={100} step={5}
                                />
                            </div>

                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <DollarSign className="w-8 h-8 text-green-600 mb-2" />
                                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                                    {paybackYear ? `${paybackYear} Years` : "20+"}
                                </div>
                                <div className="text-xs text-green-600">Payback Period</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Zap className="w-8 h-8 text-blue-600 mb-2" />
                                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                                    {((cumulativeSavings) / 1000).toFixed(1)}k TL
                                </div>
                                <div className="text-xs text-blue-600">Net Profit (20y)</div>
                            </CardContent>
                        </Card>
                    </div>

                    <Button
                        className="w-full h-12 text-lg bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg transition-all hover:scale-[1.02]"
                        onClick={handleDownloadReport}
                    >
                        <FileText className="mr-2 w-5 h-5" />
                        Download Professional Report (PDF)
                    </Button>
                </div>

                {/* Chart */}
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle>Financial Projection (20 Years)</CardTitle>
                        <CardDescription>Cumulative savings vs time. Crossing zero is your break-even point.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={projections}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                                <XAxis dataKey="year" label={{ value: 'Years', position: 'insideBottom', offset: -5 }} />
                                <YAxis label={{ value: 'Profit (TL)', angle: -90, position: 'insideLeft' }} />
                                <Tooltip formatter={(val) => `${val.toLocaleString()} TL`} />
                                <Line type="monotone" dataKey="savings" stroke="#16a34a" strokeWidth={3} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
