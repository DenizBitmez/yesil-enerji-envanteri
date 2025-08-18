// app/api/solar-analysis/route.js
import fetch from "node-fetch";
import Bottleneck from "bottleneck";
import pRetry from "p-retry";
import qs from "qs";

// ====== KONFİGÜRASYON AYARLARI ======
const CONFIG = {
  // Ekonomik varsayımlar (ihtiyaca göre ayarlanabilir)
  costPerKW: 15000, // kWp başına TRY cinsinden kurulum maliyeti
  electricityPricePerKWh: 1.4, // TRY/kWh elektrik fiyatı
  gridEmissionFactorKgPerKWh: 0.43, // kWh başına kg CO2e (güncel veriye göre ayarlanabilir)

  // PVGIS kısıtlamaları
  tmy: {
    startyear: 2005,
    endyear: 2020,
  },
  pvcalc: {
    raddatabase: "PVGIS-SARAH2",
    peakpower: 1,
    loss: 10,
    mountingplace: "free",
    pvtechchoice: "crystSi",
  },

  // Uygunluk kriterleri
  suitability: {
    minSunHours: 3,
    minEfficiency: 15,
    minAnnualProduction: 1000,
  },

  // Hız sınırlaması
  rateLimit: {
    maxConcurrent: 3,
    minTime: 350, // ~3 req/sec genel olarak tüm endpoint'lerde
  },
};

export const PROVINCES = [
  { id: "01", city: "Adana", lat: 37.0, lng: 35.3213 },
  { id: "02", city: "Adıyaman", lat: 37.7648, lng: 38.2786 },
  { id: "03", city: "Afyonkarahisar", lat: 38.7569, lng: 30.5433 },
  { id: "04", city: "Ağrı", lat: 39.7191, lng: 43.0503 },
  { id: "05", city: "Amasya", lat: 40.6539, lng: 35.8331 },
  { id: "06", city: "Ankara", lat: 39.9208, lng: 32.8541 },
  { id: "07", city: "Antalya", lat: 36.8841, lng: 30.7056 },
  { id: "08", city: "Artvin", lat: 41.1828, lng: 41.8183 },
  { id: "09", city: "Aydın", lat: 37.856, lng: 27.8416 },
  { id: "10", city: "Balıkesir", lat: 39.6484, lng: 27.8826 },
  { id: "11", city: "Bilecik", lat: 40.15, lng: 29.9833 },
  { id: "12", city: "Bingöl", lat: 38.8848, lng: 40.4938 },
  { id: "13", city: "Bitlis", lat: 38.4, lng: 42.1167 },
  { id: "14", city: "Bolu", lat: 40.7359, lng: 31.6111 },
  { id: "15", city: "Burdur", lat: 37.7203, lng: 30.29 },
  { id: "16", city: "Bursa", lat: 40.195, lng: 29.06 },
  { id: "17", city: "Çanakkale", lat: 40.1553, lng: 26.4142 },
  { id: "18", city: "Çankırı", lat: 40.6013, lng: 33.6134 },
  { id: "19", city: "Çorum", lat: 40.5506, lng: 34.9556 },
  { id: "20", city: "Denizli", lat: 37.7765, lng: 29.0864 },
  { id: "21", city: "Diyarbakır", lat: 37.9144, lng: 40.2306 },
  { id: "22", city: "Edirne", lat: 41.6772, lng: 26.5557 },
  { id: "23", city: "Elazığ", lat: 38.6789, lng: 39.2222 },
  { id: "24", city: "Erzincan", lat: 39.75, lng: 39.5 },
  { id: "25", city: "Erzurum", lat: 39.9083, lng: 41.2769 },
  { id: "26", city: "Eskişehir", lat: 39.7767, lng: 30.5206 },
  { id: "27", city: "Gaziantep", lat: 37.0662, lng: 37.3833 },
  { id: "28", city: "Giresun", lat: 40.9128, lng: 38.3895 },
  { id: "29", city: "Gümüşhane", lat: 40.46, lng: 39.4819 },
  { id: "30", city: "Hakkâri", lat: 37.5744, lng: 43.74 },
  { id: "31", city: "Hatay", lat: 36.2028, lng: 36.16 },
  { id: "32", city: "Isparta", lat: 37.7648, lng: 30.5566 },
  { id: "33", city: "Mersin", lat: 36.8, lng: 34.6417 },
  { id: "34", city: "İstanbul", lat: 41.0053, lng: 28.977 },
  { id: "35", city: "İzmir", lat: 38.4192, lng: 27.1287 },
  { id: "36", city: "Kars", lat: 40.6083, lng: 43.0972 },
  { id: "37", city: "Kastamonu", lat: 41.3781, lng: 33.775 },
  { id: "38", city: "Kayseri", lat: 38.7312, lng: 35.4787 },
  { id: "39", city: "Kırklareli", lat: 41.7333, lng: 27.2167 },
  { id: "40", city: "Kırşehir", lat: 39.1422, lng: 34.1703 },
  { id: "41", city: "Kocaeli", lat: 40.765, lng: 29.94 },
  { id: "42", city: "Konya", lat: 37.8716, lng: 32.4847 },
  { id: "43", city: "Kütahya", lat: 39.42, lng: 29.9833 },
  { id: "44", city: "Malatya", lat: 38.355, lng: 38.3092 },
  { id: "45", city: "Manisa", lat: 38.6191, lng: 27.4289 },
  { id: "46", city: "Kahramanmaraş", lat: 37.5833, lng: 36.9333 },
  { id: "47", city: "Mardin", lat: 37.3122, lng: 40.735 },
  { id: "48", city: "Muğla", lat: 37.215, lng: 28.3636 },
  { id: "49", city: "Muş", lat: 38.7439, lng: 41.5069 },
  { id: "50", city: "Nevşehir", lat: 38.6244, lng: 34.7142 },
  { id: "51", city: "Niğde", lat: 37.9667, lng: 34.6833 },
  { id: "52", city: "Ordu", lat: 40.9833, lng: 37.8833 },
  { id: "53", city: "Rize", lat: 41.0201, lng: 40.5234 },
  { id: "54", city: "Sakarya", lat: 40.7766, lng: 30.3945 },
  { id: "55", city: "Samsun", lat: 41.2867, lng: 36.33 },
  { id: "56", city: "Siirt", lat: 37.9333, lng: 41.95 },
  { id: "57", city: "Sinop", lat: 42.0231, lng: 35.1533 },
  { id: "58", city: "Sivas", lat: 39.7477, lng: 37.0179 },
  { id: "59", city: "Tekirdağ", lat: 40.9833, lng: 27.5167 },
  { id: "60", city: "Tokat", lat: 40.3167, lng: 36.55 },
  { id: "61", city: "Trabzon", lat: 41.0017, lng: 39.7178 },
  { id: "62", city: "Tunceli", lat: 39.1081, lng: 39.54 },
  { id: "63", city: "Şanlıurfa", lat: 37.1675, lng: 38.795 },
  { id: "64", city: "Uşak", lat: 38.68, lng: 29.405 },
  { id: "65", city: "Van", lat: 38.5011, lng: 43.4167 },
  { id: "66", city: "Yozgat", lat: 39.8181, lng: 34.8147 },
  { id: "67", city: "Zonguldak", lat: 41.4564, lng: 31.7987 },
  { id: "68", city: "Aksaray", lat: 38.3687, lng: 34.0369 },
  { id: "69", city: "Bayburt", lat: 40.255, lng: 40.2242 },
  { id: "70", city: "Karaman", lat: 37.1811, lng: 33.215 },
  { id: "71", city: "Kırıkkale", lat: 39.8461, lng: 33.515 },
  { id: "72", city: "Batman", lat: 37.8872, lng: 41.1322 },
  { id: "73", city: "Şırnak", lat: 37.5211, lng: 42.4611 },
  { id: "74", city: "Bartın", lat: 41.5811, lng: 32.4611 },
  { id: "75", city: "Ardahan", lat: 41.11, lng: 42.7025 },
  { id: "76", city: "Iğdır", lat: 39.8886, lng: 44.0048 },
  { id: "77", city: "Yalova", lat: 40.65, lng: 29.2667 },
  { id: "78", city: "Karabük", lat: 41.2, lng: 32.6167 },
  { id: "79", city: "Kilis", lat: 36.7167, lng: 37.1167 },
  { id: "80", city: "Osmaniye", lat: 37.0667, lng: 36.2333 },
  { id: "81", city: "Düzce", lat: 40.8433, lng: 31.1567 },
];

// API Base URL
const BASE = "https://re.jrc.ec.europa.eu/api/v5_2";

// ====== YARDIMCI FONKSİYONLAR ======
const limiter = new Bottleneck({
  maxConcurrent: CONFIG.rateLimit.maxConcurrent,
  minTime: CONFIG.rateLimit.minTime,
});

async function _fetchJSON(url, meta = {}) {
  const run = async () => {
    const res = await fetch(url, {
      headers: { "User-Agent": "solar-analysis-agent/0.1" },
    });
    const status = res.status;
    const text = await res.text();

    if (!res.ok) {
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
      const err = new Error(`HTTP ${status} for ${url}`);
      err.status = status;
      throw err;
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw e;
    }
    return data;
  };

  return pRetry(() => limiter.schedule(run), {
    retries: 3,
    minTimeout: 500,
    maxTimeout: 2500,
  });
}

function normalizeStr(s) {
  return s
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}+/gu, "")
    .toLowerCase();
}

// ====== API FONKSİYONLARI ======
async function mrCalc(lat, lon) {
  const params = {
    lat,
    lon,
    month_min: 1,
    month_max: 12,
    optimalangles: 1,
    horirrad: 1,
    globalirrad: 1,
    diffuseirrad: 1,
    usehorizon: 1,
    outputformat: "json",
  };
  const url = `${BASE}/MRcalc?${qs.stringify(params)}`;
  return _fetchJSON(url, { endpoint: "MRcalc", params });
}

async function tmy(lat, lon) {
  const params = {
    lat,
    lon,
    startyear: CONFIG.tmy.startyear,
    endyear: CONFIG.tmy.endyear,
    usehorizon: 1,
    outputformat: "json",
  };
  const url = `${BASE}/tmy?${qs.stringify(params)}`;
  return _fetchJSON(url, { endpoint: "tmy", params });
}

async function pvCalc({ lat, lon, angle, aspect }) {
  const params = {
    lat,
    lon,
    peakpower: CONFIG.pvcalc.peakpower,
    loss: CONFIG.pvcalc.loss,
    mountingplace: CONFIG.pvcalc.mountingplace,
    pvtechchoice: CONFIG.pvcalc.pvtechchoice,
    angle,
    aspect,
    raddatabase: CONFIG.pvcalc.raddatabase,
    outputformat: "json",
  };
  const url = `${BASE}/PVcalc?${qs.stringify(params)}`;
  return _fetchJSON(url, { endpoint: "PVcalc", params });
}

// ====== VERİ İŞLEME FONKSİYONLARI ======
function extractOptimalAnglesFromMR(mrJson) {
  try {
    // PVGIS MRcalc optimal eğim (angle) ve yönelim (aspect) döndürür
    const { optimal } = mrJson;
    if (!optimal) return null;

    const angle = optimal.tilt || optimal.angle || optimal.optimal_tilt;
    const aspect = optimal.azimuth || optimal.aspect || optimal.optimal_azimuth;

    if (angle == null || aspect == null) return null;
    return { angle: Number(angle), aspect: Number(aspect) };
  } catch (_) {
    return null;
  }
}

function extractPVResults(pvJson) {
  const out = { annualProduction: null, pr: null };

  try {
    const totals = pvJson?.outputs?.totals;
    const fixed = totals?.fixed ?? totals;

    // kWp başına yıllık enerji
    const E_y =
      fixed?.E_y?.value ?? fixed?.E_y ?? fixed?.yearly?.energy ?? null;
    if (E_y != null) out.annualProduction = Number(E_y);

    // Performans oranı
    let pr =
      pvJson?.outputs?.performance_ratio?.value ??
      pvJson?.outputs?.performance_ratio ??
      pvJson?.performance_ratio;

    if (pr == null) {
      const Hiy = fixed?.["H(i)_y"]?.value ?? fixed?.["H(i)_y"]; // panel düzlemindeki ışınım
      if (Hiy != null && Number(Hiy) > 0 && out.annualProduction != null) {
        pr = Number(out.annualProduction) / Number(Hiy);
      }
    }

    if (pr != null) out.pr = Number(pr);
  } catch (_) {}

  return out;
}

function computeEconomics(annualProductionKWh) {
  const cost = CONFIG.costPerKW; // 1 kWp sistem
  const annualSavings = annualProductionKWh * CONFIG.electricityPricePerKWh;
  const paybackPeriod = annualSavings > 0 ? cost / annualSavings : null;
  const co2ReductionTons =
    (annualProductionKWh * CONFIG.gridEmissionFactorKgPerKWh) / 1000;

  return { cost, paybackPeriod, co2ReductionTons };
}

function toSpot({ id, city, lat, lng }, pvOut, optimal) {
  const annualProduction = pvOut.annualProduction ?? null; // kWp başına kWh
  const pr =
    pvOut.pr != null ? (pvOut.pr <= 1 ? pvOut.pr * 100 : pvOut.pr) : null; // gerekirse %'ye çevir
  const efficiency = pr != null ? Math.round(pr) : null;

  // Günlük güneş saati, MRcalc veya TMY verisinden alınabilir
  // Eğer yoksa annualProduction / 365 yaklaşık bir değer olarak kalır
  const sunHoursPerDay =
    pvOut.sunHoursPerDay ??
    (annualProduction != null ? +(annualProduction / 365).toFixed(2) : null);

  const { cost, paybackPeriod, co2ReductionTons } =
    annualProduction != null
      ? computeEconomics(annualProduction)
      : { cost: null, paybackPeriod: null, co2ReductionTons: null };

  // Uygunluk kriterleri CONFIG'den alınıyor
  const suitable =
    sunHoursPerDay != null &&
    sunHoursPerDay >= CONFIG.suitability.minSunHours + 1 && // 1 saat daha katı
    efficiency != null &&
    efficiency >= CONFIG.suitability.minEfficiency + 5 && // %5 daha katı
    annualProduction != null &&
    annualProduction >= CONFIG.suitability.minAnnualProduction * 1.1; // %10 daha katı

  return {
    id,
    city,
    coordinates: { lat, lng },
    areaType: "roof",
    sunHoursPerDay,
    efficiency,
    annualProduction:
      annualProduction != null ? Math.round(annualProduction) : null,
    cost,
    paybackPeriod: paybackPeriod != null ? +paybackPeriod.toFixed(1) : null,
    co2Reduction:
      co2ReductionTons != null ? +co2ReductionTons.toFixed(2) : null,
    suitable,
  };
}

async function processProvince(p) {
  const { lat, lng } = p;
  const [mr, _tmy] = await Promise.all([mrCalc(lat, lng), tmy(lat, lng)]);
  const optimal = extractOptimalAnglesFromMR(mr) || { angle: 30, aspect: 0 };

  const pv = await pvCalc({
    lat,
    lon: lng,
    angle: optimal.angle,
    aspect: optimal.aspect,
  });

  const pvOut = extractPVResults(pv);
  return toSpot(p, pvOut, optimal);
}

// ====== APP ROUTER API HANDLER ======
export async function POST(request) {
  try {
    // İsteğin body'sinden parametreleri al
    const { limit, cityName, cityId } = await request.json();

    // İl listesini hazırla
    let list = PROVINCES.map((c) => ({
      id: c.id,
      city: c.city,
      lat: c.lat,
      lng: c.lng,
    }));

    // Şehir filtreleme
    if (cityName || cityId) {
      list = list.filter(
        (x) =>
          normalizeStr(x.city) === normalizeStr(cityName || "") ||
          x.id === cityId
      );
    }

    // Limit uygulama
    if (limit) list = list.slice(0, limit);

    const spots = [];
    const errors = [];

    // Her il için analiz yap
    for (const p of list) {
      try {
        const spot = await processProvince(p);
        spots.push(spot);
      } catch (err) {
        errors.push({ city: p.city, error: err.message });
      }
    }

    // Başarılı yanıt döndür
    return Response.json({
      success: true,
      data: spots,
      errors,
      total: spots.length,
    });
  } catch (error) {
    // Hata durumu
    return Response.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
