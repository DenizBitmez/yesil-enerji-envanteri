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
        // Let's assume the JSON "efficiency" was a simplified 0-100 score, but real panel efficiency is ~18-22%
        // To match the app's existing scale (Example: 80% "score" not raw efficiency), we map it.
        // Let's calculate a "Performance Score" (0-100) based on temp.
        const tempLoss = Math.max(0, (annualTemp - 25) * 0.4);
        const baseScore = 85;
        const efficiencyScore = Math.round(baseScore - tempLoss);

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
        // Simple logic: > 3.5 kWh/m2/day is generally "Suitable"
        const suitable = annualSolar > 3.5;

        return {
            solarIrradiance: annualSolar, // kWh/m²/day (Sun Hours)
            temperature: annualTemp,      // Celsius
            efficiency: efficiencyScore,  // 0-100 Score
            annualProduction: annualProduction, // kWh
            co2Reduction: co2Reduction, // tons
            suitable: suitable,
            source: "NASA POWER",
        };
    } catch (error) {
        console.error("Error fetching NASA data:", error);
        return null;
    }
}
