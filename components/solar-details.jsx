"use client";

import { useState, useEffect } from "react";
import { fetchSolarData } from "../lib/nasa";

import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

export function SolarDetails({ spot, onClose, isMobile = false }) {
  const [nasaData, setNasaData] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const suitabilityColor = spot.suitable ? "bg-green-500" : "bg-red-500";
  const areaTypeLabel = spot.areaType === "roof" ? "Roof Area" : "Open Land";

  return (
    <div className="p-6">
      {isMobile && (
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Location Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {spot.city}
            <Badge className={suitabilityColor}>
              {spot.suitable ? "Suitable" : "Not Suitable"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
