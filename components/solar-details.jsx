"use client";

import { useState, useEffect } from "react";
import { fetchSolarData } from "../lib/nasa";
import InvestmentSimulator from "./InvestmentSimulator";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Calculator, Info } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export function SolarDetails({ spot, onClose, isMobile = false }) {
  const [nasaData, setNasaData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    if (spot) {
      setLoading(true);
      fetchSolarData(spot.coordinates.lat, spot.coordinates.lng)
        .then((data) => {
          setNasaData(data);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setNasaData(null);
    }
  }, [spot]);

  if (!spot) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-2">🗺️</div>
          <p>Select a location to view solar potential data</p>
        </div>
      </div>
    );
  }

  if (showSimulator) {
    return (
      <div className="fixed inset-0 z-[2000] bg-background p-6 overflow-y-auto">
        <InvestmentSimulator
          cityData={{ ...spot, ...nasaData }}
          onClose={() => setShowSimulator(false)}
        />
      </div>
    );
  }

  const suitabilityColor = spot.suitable ? "bg-green-500" : "bg-red-500";
  const areaTypeLabel = spot.areaType === "roof" ? "Roof Area" : "Open Land";

  return (
    <div className="h-full flex flex-col p-3 md:p-4">
      {isMobile && (
        <div className="flex items-center justify-between mb-4 shrink-0">
          <h2 className="text-lg font-semibold">Location Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      )}

      <Card className={`flex flex-col shadow-lg border-muted ${isMobile ? "h-full max-h-[calc(100vh-140px)] overflow-hidden" : ""
        }`}>
        <CardHeader className="shrink-0 bg-background/95 backdrop-blur z-10 border-b">
          <CardTitle className="flex items-center justify-between">
            {spot.city}
            <Badge className={suitabilityColor}>
              {spot.suitable ? "Suitable" : "Not Suitable"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className={`p-4 space-y-3 ${isMobile
            ? "overflow-y-auto scrollbar-thin scrollbar-thumb-rounded-md scrollbar-thumb-muted-foreground/20"
            : ""
          }`}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Sun Hours/Day</p>
              <p className="font-semibold">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : nasaData ? (
                  <span className="text-blue-600" title="Verified by NASA">
                    {nasaData.solarIrradiance.toFixed(2)}h (NASA)
                  </span>
                ) : (
                  `${spot.sunHoursPerDay}h`
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Avg Temperature</p>
              <p className="font-semibold">
                {loading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : nasaData ? (
                  <span className="text-blue-600" title="Verified by NASA">
                    {nasaData.temperature.toFixed(1)}°C
                  </span>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Area Type</p>
              <p className="font-semibold">{areaTypeLabel}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Efficiency</p>
              <p className="font-semibold">{spot.efficiency}%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Annual Production</p>
              <p className="font-semibold">{spot.annualProduction} kWh</p>
            </div>
            <div>
              <p className="text-muted-foreground">Installation Cost</p>
              <p className="font-semibold">${spot.cost.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payback Period</p>
              <p className="font-semibold">{spot.paybackPeriod} years</p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-muted-foreground text-sm">
              Environmental Impact
            </p>
            <p className="font-semibold text-green-600">
              {spot.co2Reduction} tons CO₂ saved/year
            </p>
          </div>

          {nasaData && (
            <div className="pt-2 flex justify-end">
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Data fetched from NASA POWER 🛰️
              </Badge>
            </div>
          )}

          {/* Smart Insights Section */}
          {nasaData && (
            <Card className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900">
              <CardHeader className="pb-2">
                <CardTitle className="text-md flex items-center gap-2">
                  <Info className="h-5 w-5 text-indigo-500" />
                  AI-Powered Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <p>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      {nasaData.solarIrradiance > 4.5 ? "High Potential:" : nasaData.solarIrradiance > 3.5 ? "Moderate Potential:" : "Low Potential:"}
                    </span>{" "}
                    This location receives {nasaData.solarIrradiance > 4.0 ? "more" : "less"} sunlight than the national average (4.0h/day).
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <p>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      ROI Analysis:
                    </span>{" "}
                    With a {spot.paybackPeriod} year payback, this investment is rated as
                    <span className="font-bold"> {spot.paybackPeriod < 7 ? "Excellent" : spot.paybackPeriod < 10 ? "Good" : "Long-term"}</span>.
                  </p>
                </div>

                <div className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                  <p>
                    <span className="font-semibold text-indigo-700 dark:text-indigo-300">
                      Temperature Impact:
                    </span>{" "}
                    {nasaData.temperature > 25
                      ? "High average temperatures may slightly reduce panel efficiency in summer."
                      : "Cooler climate helps maintain optimal panel efficiency year-round."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            className="w-full mt-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold h-12 shadow-md transition-all hover:scale-[1.02]"
            onClick={() => setShowSimulator(true)}
          >
            <Calculator className="mr-2 h-5 w-5" />
            Interactive ROI Simulator
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
