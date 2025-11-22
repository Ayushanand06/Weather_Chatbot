// lib/weather.ts
import NodeCache from "node-cache";

export interface DailyWeather {
  date: string; // YYYY-MM-DD
  temp_avg: number | null;
  temp_min: number | null;
  temp_max: number | null;
  description: string;
  humidity_avg: number | null;
  wind_speed_avg: number | null;
  pop_max: number | null; // max precipitation probability (0..1) for the day
}

export interface WeatherData {
  location: string;
  lat: number;
  lon: number;
  daily: DailyWeather[];
  source?: string;
}

// Config
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) {
  console.warn("OPENWEATHER_API_KEY is not set. getWeather will fail without it.");
}

// Cache: 10 minutes
const cache = new NodeCache({ stdTTL: 600, useClones: true });

function cacheKey(lat: string, lon: string) {
  return `forecast:${Number(lat).toFixed(2)}:${Number(lon).toFixed(2)}`;
}

// Helper: YYYY-MM-DD from unix seconds
function ymdFromUnix(sec: number) {
  return new Date(sec * 1000).toISOString().split("T")[0];
}

export async function getWeather(lat: string, lon: string): Promise<WeatherData | null> {
  if (!lat || !lon) return null;
  if (!OPENWEATHER_API_KEY) {
    console.error("Missing OPENWEATHER_API_KEY");
    return null;
  }

  const key = cacheKey(lat, lon);
  const cached = cache.get<WeatherData>(key);
  if (cached) return cached;

  try {
    // 1) Reverse geocode to get location name (optional)
    let locationName = `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const gres = await fetch(geoUrl);
      if (gres.ok) {
        const gj = await gres.json();
        if (Array.isArray(gj) && gj.length > 0) {
          const g = gj[0];
          const parts = [];
          if (g.name) parts.push(g.name);
          if (g.state) parts.push(g.state);
          if (g.country) parts.push(g.country);
          if (parts.length) locationName = parts.join(", ");
        }
      }
    } catch (e) {
      // ignore
    }

    // 2) Fetch 5-day / 3-hour forecast
    // returns list of 3-hour items covering ~5 days (40 entries)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenWeather forecast error: ${res.status} ${txt}`);
    }
    const payload = await res.json();

    // 3) Aggregate 3-hour entries into daily buckets (YYYY-MM-DD)
    const list = Array.isArray(payload.list) ? payload.list : [];
    const buckets: Record<string, any[]> = {};
    for (const item of list) {
      const day = ymdFromUnix(item.dt);
      if (!buckets[day]) buckets[day] = [];
      buckets[day].push(item);
    }

    // Keep the next 5 days in chronological order (today may be partial)
    const days = Object.keys(buckets).sort().slice(0, 5);

    const daily: DailyWeather[] = days.map((d) => {
      const items = buckets[d];
      // Temperature stats
      const temps = items.map((it: any) => it.main?.temp).filter((v: any) => typeof v === "number");
      const temp_min = Math.min(...items.map((it: any) => it.main?.temp_min).filter((v: any) => typeof v === "number"));
      const temp_max = Math.max(...items.map((it: any) => it.main?.temp_max).filter((v: any) => typeof v === "number"));
      const temp_avg = temps.length ? temps.reduce((a: number, b: number) => a + b, 0) / temps.length : null;

      // Humidity average
      const hums = items.map((it: any) => it.main?.humidity).filter((v: any) => typeof v === "number");
      const humidity_avg = hums.length ? Math.round(hums.reduce((a: number, b: number) => a + b, 0) / hums.length) : null;

      // Wind speed avg
      const winds = items.map((it: any) => it.wind?.speed).filter((v: any) => typeof v === "number");
      const wind_speed_avg = winds.length ? Number((winds.reduce((a: number, b: number) => a + b, 0) / winds.length).toFixed(1)) : null;

      // max precipitation probability (pop) available in some items
      const pops = items.map((it: any) => (typeof it.pop === "number" ? it.pop : 0));
      const pop_max = pops.length ? Math.max(...pops) : null;

      // representative description: choose the most frequent weather.description (mode)
      const descs = items.map((it: any) => (Array.isArray(it.weather) && it.weather[0] ? it.weather[0].description : "")).filter(Boolean);
      const description = descs.length
        ? descs.sort((a: string, b: string) =>
            descs.filter((v) => v === a).length - descs.filter((v) => v === b).length
          ).pop() || descs[0]
        : "";

      return {
        date: d,
        temp_avg: temp_avg === null ? null : Number(temp_avg.toFixed(1)),
        temp_min: typeof temp_min === "number" ? Number(temp_min.toFixed(1)) : null,
        temp_max: typeof temp_max === "number" ? Number(temp_max.toFixed(1)) : null,
        description,
        humidity_avg,
        wind_speed_avg,
        pop_max,
      } as DailyWeather;
    });

    const out: WeatherData = {
      location: locationName,
      lat: Number(lat),
      lon: Number(lon),
      daily,
      source: "openweathermap-forecast",
    };

    cache.set(key, out);
    return out;
  } catch (err) {
    console.error("getWeather error:", err);
    return null;
  }
}
