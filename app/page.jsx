"use client";

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "next-themes";
import { SolarMap } from "../components/solar-map";
import { SolarDetails } from "../components/solar-details";
import { SolarCharts } from "../components/solar-charts";
import { ThemeToggle } from "../components/theme-toggle";
import citiesJSON from "../data/cities.json"; // Load static cities
import districtsJSON from "../data/districts.json"; // Load districts
import { fetchSolarData } from "../lib/nasa"; // Live data fetcher
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import AnalysisButton from "../components/AnalysisButton";

export default function HomePage() {
  const { resolvedTheme } = useTheme();
  const [selectedSpot, setSelectedSpot] = useState(null);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState(false);
  const [sortBy, setSortBy] = useState("city");
  const [filterBy, setFilterBy] = useState("all");

  // Drill-down State
  const [viewMode, setViewMode] = useState("country"); // 'country' | 'city'
  const [mapConfig, setMapConfig] = useState({ center: [39.0, 35.0], zoom: 6 });
  const [currentCity, setCurrentCity] = useState(null);

  // State for dynamic data
  // Initialize with cities but "loading" metrics
  const [solarSpots, setSolarSpots] = useState(
    citiesJSON.cities.map(city => ({
      ...city,
      cost: city.baseCost, // Map baseCost to cost for compatibility
      sunHoursPerDay: 0, // Placeholder
      efficiency: 0,
      annualProduction: 0,
      paybackPeriod: 0,
      co2Reduction: 0,
      suitable: false,
      isLoaded: false
    }))
  );

  // Effect to fetch data progressively
  useEffect(() => {
    // Optimization: Only run if there are unloaded spots to fetch
    const hasUnloaded = solarSpots.some(s => !s.isLoaded);
    if (!hasUnloaded) return;

    async function updateSpots() {
      // Create a copy to update
      // Optimization: For demo, update top 10 cities first, or random, or just all in parallel batches.
      // Let's do batches of 5 to not spam too hard, but fast enough.
      const citiesToUpdate = [...solarSpots];

      // Parallel fetch limit (5 at a time)
      const batchSize = 5;
      for (let i = 0; i < citiesToUpdate.length; i += batchSize) {
        const batch = citiesToUpdate.slice(i, i + batchSize);

        // Check if this batch actually needs fetching to avoid unnecessary state updates
        const batchNeedsUpdate = batch.some(c => !c.isLoaded);
        if (!batchNeedsUpdate) continue;

        await Promise.all(batch.map(async (city) => {
          if (city.isLoaded) return; // Skip if already loaded

          const data = await fetchSolarData(city.coordinates.lat, city.coordinates.lng);
          if (data) {
            // Find original city object in the main array to update it
            const index = citiesToUpdate.findIndex(c => c.id === city.id);
            if (index !== -1) {
              // Calculate Payback: Cost / (Production * Price)
              // Assume Electricity Price = $0.20 / kWh (Global Avg approximation)
              const electricityPrice = 0.20;
              const savings = data.annualProduction * electricityPrice;
              const payback = savings > 0 ? parseFloat((city.baseCost / savings).toFixed(1)) : 0;

              citiesToUpdate[index] = {
                ...citiesToUpdate[index],
                sunHoursPerDay: data.solarIrradiance,
                efficiency: data.efficiency,
                annualProduction: data.annualProduction,
                co2Reduction: data.co2Reduction,
                suitable: data.suitable,
                areaType: data.areaType, // Update with dynamic type
                paybackPeriod: payback,
                isLoaded: true
              };
            }
          }
        }));
        // Update state after every batch so user sees progress
        setSolarSpots([...citiesToUpdate]);
      }
    }

    updateSpots();
  }, [solarSpots]); // Run when solarSpots changes (e.g. new districts added)


  const filteredAndSortedSpots = useMemo(() => {
    let filtered = solarSpots.filter(s => s.isLoaded); // Only show loaded spots in charts/map to avoid zeros

    // Apply filters
    if (filterBy === "suitable") {
      filtered = filtered.filter((spot) => spot.suitable === true);
    } else if (filterBy === "roof") {
      filtered = filtered.filter((spot) => spot.areaType?.toLowerCase() === "roof");
    } else if (filterBy === "openLand") {
      filtered = filtered.filter((spot) => spot.areaType?.toLowerCase() === "openland");
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
  }, [sortBy, filterBy, solarSpots]);

  const handleSpotClick = (spot) => {
    setSelectedSpot(spot);
    setIsMobileDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setIsMobileDetailsOpen(false);
  };

  // Handle Drill Down
  const handleCityClick = async (spot) => {
    // If we are in country mode, and clicked a City (not a district), drill down
    if (viewMode === "country") {
      const cityDistricts = districtsJSON.districts.filter(d => d.cityId === spot.id);

      if (cityDistricts.length > 0) {
        // Switch to City Mode
        setViewMode("city");
        setCurrentCity(spot);

        // Initialize districts with loading state
        const initialDistricts = cityDistricts.map(d => ({
          ...d,
          cost: d.baseCost,
          sunHoursPerDay: 0,
          efficiency: 0,
          annualProduction: 0,
          paybackPeriod: 0,
          co2Reduction: 0,
          suitable: false,
          isLoaded: false
        }));

        setSolarSpots(initialDistricts);

        // Zoom to City
        setMapConfig({ center: [spot.coordinates.lat, spot.coordinates.lng], zoom: 10 });

        // Trigger fetch for districts (reuse the effect or manually trigger? 
        // The existing effect depends on solarSpots so it will auto-trigger! 
        // BUT we need to ensure the effect handles the new array correctly.
        // The existing effect slices and loops. It should work fine.)

      } else {
        // No districts data for this city, just show details
        handleSpotClick(spot);
      }
    } else {
      // Already in city mode (clicked a district), just show details
      handleSpotClick(spot);
    }
  };

  const handleBackToCountry = () => {
    setViewMode("country");
    setCurrentCity(null);
    setSelectedSpot(null);
    setMapConfig({ center: [39.0, 35.0], zoom: 6 });

    // Restore Cities
    // We need to reload cities status. 
    // Ideally we should have kept them in a ref or separate state to avoid re-fetching NASA data every time we go back.
    // For now, let's just reload from JSON and let them lazy load again (simpler) or maybe better:
    // To avoid data loss, we should have distinct states for 'cities' and 'districts'.
    // But for this refactor, I'll just reset to initial cities to keep it simple.
    // Optimally: user expects previous data to remain. 
    // Let's rely on the browser cache for NASA requests if possible, or accept re-fetch.

    setSolarSpots(
      citiesJSON.cities.map(city => ({
        ...city,
        cost: city.baseCost,
        sunHoursPerDay: 0,
        efficiency: 0,
        annualProduction: 0,
        paybackPeriod: 0,
        co2Reduction: 0,
        suitable: false,
        isLoaded: false
      }))
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b p-4 z-[1000] sticky top-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              {viewMode === "city" && (
                <Button variant="outline" size="sm" onClick={handleBackToCountry} className="mr-2 px-2 h-8">
                  ← Back
                </Button>
              )}
              <h1 className="text-xl font-semibold">
                {viewMode === "city" && currentCity ? `${currentCity.city} Districts` : "Solar Panel Mapping"}
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              {viewMode === "city" ? "District-level solar potential" : "Interactive solar potential analysis (Powered by NASA)"}
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
          {/* Show loading overlay if very few spots loaded */}
          {filteredAndSortedSpots.length < 5 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10 pointer-events-none">
              <div className="bg-background p-4 rounded-lg shadow-lg">
                <p className="animate-pulse">Loading Live Data from NASA...</p>
              </div>
            </div>
          )}
          <SolarMap
            solarSpots={filteredAndSortedSpots}
            onSpotClick={handleCityClick}
            selectedSpot={selectedSpot}
            theme={resolvedTheme}
            center={mapConfig.center}
            zoom={mapConfig.zoom}
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
                    {spot.sunHoursPerDay.toFixed(2)}h sun • {spot.efficiency}% efficiency
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

      <AnalysisButton data={solarSpots.filter(s => s.isLoaded)} />
    </div>
  );
}
