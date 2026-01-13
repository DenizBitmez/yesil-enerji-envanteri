"use client";

import { Button } from "./ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AnalysisButton({ data = [] }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!data || data.length === 0) {
      alert("No data available to analyze. Please wait for data to load.");
      return;
    }

    setLoading(true);

    // Simulate a brief analysis process for UX
    await new Promise((resolve) => setTimeout(resolve, 1000));

    try {
      // Define CSV headers
      const headers = [
        "City",
        "Latitude",
        "Longitude",
        "Area Type",
        "Suitability",
        "Avg Sun Hours/Day (NASA)",
        "Avg Efficiency (%)",
        "Annual Production (kWh)",
        "Installation Cost ($)",
        "Payback Period (Years)",
        "CO2 Reduction (Tons/Year)"
      ];

      // Convert data to CSV rows
      const csvContent = [
        headers.join(","),
        ...data.map((spot) => {
          return [
            `"${spot.city}"`,
            spot.coordinates.lat,
            spot.coordinates.lng,
            spot.areaType,
            spot.suitable ? "Suitable" : "Not Suitable",
            spot.sunHoursPerDay.toFixed(2),
            spot.efficiency,
            spot.annualProduction,
            spot.cost,
            spot.paybackPeriod,
            spot.co2Reduction
          ].join(",");
        })
      ].join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `solar_analysis_report_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[1000]">
      <Button
        onClick={handleDownload}
        disabled={loading}
        size="lg"
        className="shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-full px-6 py-6 h-auto transition-transform hover:scale-105"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Analyze & Download Report
          </>
        )}
      </Button>
    </div>
  );
}
