"use client";

import { useState, useMemo } from "react";
import { SolarMap } from "../components/solar-map";
import { SolarDetails } from "../components/solar-details";
import { SolarCharts } from "../components/solar-charts";
import { ThemeToggle } from "../components/theme-toggle";
import { solarSpots } from "../data/solar-data";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

export default function HomePage() {
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState("city");
  const [filterBy, setFilterBy] = useState("all");

  const filteredAndSortedSpots = useMemo(() => {
    let filtered = solarSpots;

    // Apply filters
    if (filterBy === "suitable") {
      filtered = filtered.filter((spot) => spot.suitable);
    } else if (filterBy === "roof") {
      filtered = filtered.filter((spot) => spot.areaType === "roof");
    } else if (filterBy === "openLand") {
      filtered = filtered.filter((spot) => spot.areaType === "openLand");
    }

    // Apply sorting
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "efficiency":
          return b.efficiency - a.efficiency;
        case "sunHours":
          return b.sunHoursPerDay - a.sunHoursPerDay;
        case "production":
          return b.annualProduction - a.annualProduction;
        case "city":
        default:
          return a.city.localeCompare(b.city);
      }
    });
  }, [sortBy, filterBy]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setIsMobileDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsMobileDetailsOpen(false);
  };

  const handleCityClick = (spot) => {
    handleSpotClick(spot);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 z-[1000] sticky top-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Solar Panel Mapping</h1>
            <p className="text-sm text-muted-foreground">
              Interactive solar potential analysis
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex gap-4 mt-4 relative z-[1001]">
          <Select value={filterBy} onValueChange={setFilterBy}>
            <SelectTrigger className="w-40 z-[1002]">
              <SelectValue placeholder="Filter by" />
            </SelectTrigger>
            <SelectContent className="z-[1003]">
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="suitable">Suitable Only</SelectItem>
              <SelectItem value="roof">Roof Areas</SelectItem>
              <SelectItem value="openLand">Open Land</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 z-[1002]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="z-[1003]">
              <SelectItem value="city">City Name</SelectItem>
              <SelectItem value="efficiency">Efficiency</SelectItem>
              <SelectItem value="sunHours">Sun Hours</SelectItem>
              <SelectItem value="production">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="flex-1 relative min-h-[60vh] lg:min-h-full">
          <SolarMap
            solarSpots={filteredAndSortedSpots}
            onSpotClick={handleSpotClick}
            selectedSpot={selectedSpot}
          />
        </div>

        <div className="hidden lg:block w-80 border-l bg-card overflow-y-auto">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              Locations ({filteredAndSortedSpots.length})
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Click to select
            </p>
          </div>

          <div className="p-4 space-y-2 max-h-64 overflow-y-auto">
            {filteredAndSortedSpots.map((spot) => (
              <Button
                key={spot.id}
                variant={selectedSpot?.id === spot.id ? "default" : "ghost"}
                className="w-full justify-start text-left h-auto p-3"
                onClick={() => handleCityClick(spot)}
              >
                <div>
                  <div className="font-medium">{spot.city}</div>
                  <div className="text-xs text-muted-foreground">
                    {spot.sunHoursPerDay}h sun • {spot.efficiency}% efficiency
                  </div>
                </div>
              </Button>
            ))}
          </div>

          <SolarDetails spot={selectedSpot} />
        </div>

        {isMobileDetailsOpen && (
          <div className="lg:hidden fixed inset-0 bg-black/50 z-[1100] flex items-end">
            <div className="bg-background w-full max-h-[70vh] rounded-t-lg overflow-y-auto">
              <SolarDetails
                spot={selectedSpot}
                onClose={handleCloseDetails}
                isMobile={true}
              />
            </div>
          </div>
        )}
      </div>

      <div className="border-t bg-background">
        <SolarCharts data={filteredAndSortedSpots} />
      </div>
    </div>
  );
}
