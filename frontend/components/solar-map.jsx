"use client";

import { useEffect, useRef } from "react";

export function SolarMap({
  solarSpots,
  onSpotClick,
  selectedSpot,
  theme = "light",
}) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;

    const initMap = async () => {
      try {
        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
        }

        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href =
            "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css";
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        const L = await import("leaflet");

        // Initialize map
        const map = L.map(mapRef.current, {
          center: [39.0, 35.0],
          zoom: 6,
          zoomControl: true,
        });

        mapInstanceRef.current = map;

        // Add tile layer
        const tileUrl =
          theme === "dark"
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

        L.tileLayer(tileUrl, {
          attribution:
            theme === "dark" ? "&copy; CARTO" : "&copy; OpenStreetMap",
          maxZoom: 18,
        }).addTo(map);

        // Clear markers
        markersRef.current = [];

        // Add markers
        solarSpots?.forEach((spot) => {
          if (!spot.coordinates?.lat || !spot.coordinates?.lng) return;

          const isSelected = selectedSpot?.id === spot.id;
          const color = spot.suitable
            ? isSelected
              ? "#3b82f6"
              : "#10b981"
            : "#ef4444";

          const marker = L.circleMarker(
            [spot.coordinates.lat, spot.coordinates.lng],
            {
              radius: isSelected ? 12 : 8,
              fillColor: color,
              color: "#ffffff",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
            }
          ).addTo(map);

          marker.bindPopup(`
            <div style="padding: 8px; font-family: system-ui;">
              <h3 style="margin: 0 0 8px 0; font-weight: 600;">${spot.city}</h3>
              <p style="margin: 2px 0;">Sun Hours: ${
                spot.sunHoursPerDay
              }/day</p>
              <p style="margin: 2px 0;">Type: ${spot.areaType || "N/A"}</p>
              <p style="margin: 2px 0;">Status: ${
                spot.suitable ? "Suitable" : "Not Suitable"
              }</p>
            </div>
          `);

          marker.on("click", () => onSpotClick?.(spot));
          markersRef.current.push({ marker, spot });
        });

        // Handle map clicks
        map.on("click", () => onSpotClick?.(null));

        setTimeout(() => map.invalidateSize(), 100);
      } catch (error) {
        console.error("Map error:", error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [solarSpots, theme]);

  // Update marker styles when selection changes
  useEffect(() => {
    markersRef.current.forEach(({ marker, spot }) => {
      const isSelected = selectedSpot?.id === spot.id;
      const color = spot.suitable
        ? isSelected
          ? "#3b82f6"
          : "#10b981"
        : "#ef4444";

      marker.setStyle({
        radius: isSelected ? 12 : 8,
        fillColor: color,
      });
    });
  }, [selectedSpot]);

  return (
    <div
      ref={mapRef}
      className="w-full h-full max-w-full max-h-[600px] min-h-[400px] lg:min-h-full relative z-0"
      style={{ minHeight: "60vh" }}
    />
  );
}
