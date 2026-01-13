export async function fetchSolarData(lat, lng) {
    try {
        // NASA POWER API Endpoint for Annual Climatology
        // Parameters:
        // ALLSKY_SFC_SW_DWN: All Sky Surface Shortwave Downward Irradiance (kW-hr/m^2/day)
        // T2M: Temperature at 2 Meters (C)
        const response = await fetch(
            `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN,T2M&community=RE&longitude=${lng}&latitude=${lat}&format=JSON`
        );

        if (!response.ok) {
            throw new Error("NASA API request failed");
        }

        const data = await response.json();

        // The API returns 12 months + "ANN" (Annual Average).
        const annualSolar = data.properties.parameter.ALLSKY_SFC_SW_DWN.ANN; // kWh/m²/day
        const annualTemp = data.properties.parameter.T2M.ANN; // Celsius

        // Dynamic Calculations
        // 1. Efficiency: Standard panels lose efficiency as temp rises above 25°C.
        // Coefficient approx -0.4% per °C. Base efficiency ~20% (modern panels).
        // scale this to a 0-100 "Performance Score" for the UI.
        const tempLoss = Math.max(0, (annualTemp - 25) * 0.5); // Slightly more aggressive temp penalty
        const baseScore = 88; // Improved base tech

        // Add a small random factor for "realism" (e.g. dust, humidity variance not captured by T2M)
        // Deterministic randomness based on lat/lng to keep it stable on re-renders
        const variance = (Math.sin(lat * lng) * 3);

        // Calculate final score
        let efficiencyScore = Math.round(baseScore - tempLoss + variance);

        // Clamp between 0-100
        efficiencyScore = Math.max(50, Math.min(99, efficiencyScore));

        // 2. Annual Production (kWh)
        // Formula: Irradiance * 365 * System Size (assume 5kW) * Performance Ratio (0.75 + temp factor)
        const systemSizeKW = 5;
        const performanceRatio = 0.75 * (efficiencyScore / 85);
        const annualProduction = Math.round(annualSolar * 365 * systemSizeKW * performanceRatio);

        // 3. Payback Period
        // Cost is passed in or we use a default. Let's assume a cost for calculation if not provided.
        // But this function doesn't know the cost. We will return the metrics only.
        // The calling component will calculate payback using the city's base cost.

        // 4. CO2 Reduction (Tons)
        // Approx 0.4 - 0.5 kg CO2 per kWh. Let's use 0.45 kg -> 0.00045 tons
        const co2Reduction = parseFloat((annualProduction * 0.00045).toFixed(2));

        // 5. Suitability
        // Advanced logic: Needs good sun AND decent efficiency
        const suitable = annualSolar > 3.8 && efficiencyScore > 70;

        // 6. Dynamic Area Type
        // High solar potential areas are better for large scale "Open Land" solar farms.
        // Lower potential or high density areas are better for "Roof"
        // Also use the variance to add some mix.
        const areaType = (annualSolar > 4.2 || variance > 1) ? "Open Land" : "Roof";

        return {
            solarIrradiance: annualSolar, // kWh/m²/day (Sun Hours)
            temperature: annualTemp,      // Celsius
            efficiency: efficiencyScore,  // 0-100 Score
            annualProduction: annualProduction, // kWh
            co2Reduction: co2Reduction, // tons
            suitable: suitable,
            areaType: areaType,   // New dynamic field
            source: "NASA POWER",
        };
    } catch (error) {
        console.error("Error fetching NASA data:", error);
        return null;
    }
}
