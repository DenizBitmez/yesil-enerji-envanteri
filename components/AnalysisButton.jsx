"use client";

import { useState } from "react";

const fetchDataAndDownload = async () => {
  try {
    const response = await fetch("/api/solar-analysis", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ limit: 200 }),
    });

    if (!response.ok) throw new Error("API hatası");

    const data = await response.json();

    // JSON dosyası indir
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "solar-analysis.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Hata:", error);
    alert("An error occurred during analysis!");
  }
};

export default function AnalysisButton() {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    const confirmAction = window.confirm(
      "Are you sure you want to start the analysis?"
    );
    if (!confirmAction) return;

    setLoading(true);
    await fetchDataAndDownload();
    setLoading(false);
  };

  return (
    <button onClick={handleClick} disabled={loading}>
      {loading
        ? "🔄 Analysis in progress. This may take a few minutes..."
        : "Analyze and Download"}
    </button>
  );
}
