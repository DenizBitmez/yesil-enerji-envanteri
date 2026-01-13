import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export const generatePDF = (cityData, simulationData) => {
    const doc = new jsPDF();

    // Branding Colors
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [39, 174, 96]; // Green

    // Header
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("Solar Energy Investment Report", 20, 20);

    doc.setFontSize(12);
    doc.text(`Analysis for: ${cityData.city}`, 20, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 30);

    // Section 1: Location Overview
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text("1. Location Overview", 20, 55);

    autoTable(doc, {
        startY: 60,
        head: [["Metric", "Value", "Source"]],
        body: [
            ["Location", cityData.city, "System"],
            ["Coordinates", `${cityData.coordinates.lat}, ${cityData.coordinates.lng}`, "System"],
            ["Area Type", cityData.areaType.toUpperCase(), "System"],
            ["Annual Sun Hours", `${cityData.sunHoursPerDay.toFixed(2)} hours/day`, "NASA POWER API"],
            ["Panel Efficiency", `${cityData.efficiency}% (Temp Adjusted)`, "NASA POWER API"],
        ],
        theme: "striped",
        headStyles: { fillColor: primaryColor },
    });

    // Section 2: Financial Configuration
    let currentY = doc.lastAutoTable.finalY + 20;
    doc.text("2. Simulation Parameters", 20, currentY);

    autoTable(doc, {
        startY: currentY + 5,
        head: [["Parameter", "Configured Value"]],
        body: [
            ["Monthly Bill", `$${simulationData.monthlyBill}`],
            ["System Size", `${simulationData.systemSize} kW`],
            ["Electricity Price", `$${simulationData.electricityPrice}/kWh`],
            ["Installation Cost", `$${simulationData.systemCost.toLocaleString()}`],
        ],
        theme: "grid",
        headStyles: { fillColor: secondaryColor },
    });

    // Section 3: Projections
    currentY = doc.lastAutoTable.finalY + 20;
    doc.text("3. Financial Projections (20 Years)", 20, currentY);

    autoTable(doc, {
        startY: currentY + 5,
        body: [
            ["Payback Period", `${simulationData.paybackPeriod} Years`],
            ["Total Savings (20y)", `$${simulationData.totalSavings.toLocaleString()}`],
            ["Net Profit (20y)", `$${(simulationData.totalSavings - simulationData.systemCost).toLocaleString()}`],
            ["CO2 Reduction", `${simulationData.co2Saved} Tons`],
        ],
        theme: "plain",
        styles: { fontSize: 12, fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 80 } },
    });

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text("Green Energy Inventory - Automated Analysis Report", 20, 280);
    doc.text("Verified by NASA POWER Data", 150, 280);

    doc.save(`Solar_Report_${cityData.city}_${Date.now()}.pdf`);
};
