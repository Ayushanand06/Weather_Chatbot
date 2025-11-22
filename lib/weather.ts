// lib/weather.ts
import NodeCache from "node-cache";

export interface DailyWeather {
  date: string; // YYYY-MM-DD (in location timezone when available)
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
  timezone?: number | null;
}

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) {
  console.warn("OPENWEATHER_API_KEY is not set. getWeather will fail without it.");
}

// Cache: 10 minutes
const cache = new NodeCache({ stdTTL: 600, useClones: true });

// Use 3 decimals to balance locality and cache hits
function cacheKey(lat: string, lon: string) {
  return `forecast:${Number(lat).toFixed(3)}:${Number(lon).toFixed(3)}`;
}

// Helper: convert unix seconds to YYYY-MM-DD in a timezone offset (seconds)
function ymdFromUnixWithOffset(sec: number, tzOffsetSeconds?: number) {
  const date = new Date(sec * 1000);
  if (typeof tzOffsetSeconds === "number") {
    const local = new Date(date.getTime() + tzOffsetSeconds * 1000);
    return local.toISOString().split("T")[0];
  }
  return date.toISOString().split("T")[0];
}

/**
 * Get 5-day aggregated forecast.
 * Accepts optional opts.lang (e.g. 'ja') to request localized descriptions from OpenWeather.
 *
 * Signature intentionally allows a third optional arg so callers that pass { lang } won't fail.
 */
export async function getWeather(
  lat: string,
  lon: string,
  opts?: { lang?: string }
): Promise<WeatherData | null> {
  if (!lat || !lon) return null;
  if (!OPENWEATHER_API_KEY) {
    console.error("Missing OPENWEATHER_API_KEY");
    return null;
  }

  const key = cacheKey(lat, lon);
  const cached = cache.get<WeatherData>(key);
  if (cached) return cached;

  try {
    // 1) Reverse geocode to get a friendly location name (optional)
    let locationName = `${Number(lat).toFixed(2)}, ${Number(lon).toFixed(2)}`;
    try {
      const geoUrl = `http://api.openweathermap.org/geo/1.0/reverse?lat=${encodeURIComponent(
        lat
      )}&lon=${encodeURIComponent(lon)}&limit=1&appid=${OPENWEATHER_API_KEY}`;
      const gres = await fetch(geoUrl);
      if (gres.ok) {
        const gj = await gres.json();
        if (Array.isArray(gj) && gj.length > 0) {
          const g = gj[0];
          const parts: string[] = [];
          if (g.name) parts.push(g.name);
          if (g.state) parts.push(g.state);
          if (g.country) parts.push(g.country);
          if (parts.length) locationName = parts.join(", ");
        }
      }
    } catch (e) {
      // ignore reverse-geocode errors; continue with coords as fallback
      console.warn("Reverse geocode failed:", e);
    }

    // 2) Fetch 5-day / 3-hour forecast (allow localized descriptions with opts.lang)
    const langParam = opts?.lang ? `&lang=${encodeURIComponent(opts.lang)}` : "";
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${encodeURIComponent(
      lat
    )}&lon=${encodeURIComponent(lon)}&units=metric${langParam}&appid=${OPENWEATHER_API_KEY}`;

    const res = await fetch(url);
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`OpenWeather forecast error: ${res.status} ${txt}`);
    }
    const payload = await res.json();

    // timezone offset in seconds (if provided)
    const tzOffsetSeconds = payload?.city?.timezone ?? undefined;

    // 3) Aggregate 3-hour entries into daily buckets (YYYY-MM-DD)
    const list = Array.isArray(payload.list) ? payload.list : [];
    const buckets: Record<string, any[]> = {};
    for (const item of list) {
      const day = ymdFromUnixWithOffset(item.dt, tzOffsetSeconds);
      if (!buckets[day]) buckets[day] = [];
      buckets[day].push(item);
    }

    // Keep the next 5 days in chronological order
    const days = Object.keys(buckets)
      .sort()
      .slice(0, 5);

    const daily: DailyWeather[] = days.map((d) => {
      const items = buckets[d] || [];

      const numberArray = (arr: any[], fn: (it: any) => any) =>
        arr.map(fn).filter((v) => typeof v === "number") as number[];

      const temps = numberArray(items, (it) => it.main?.temp);
      const temp_mins = numberArray(items, (it) => it.main?.temp_min);
      const temp_maxs = numberArray(items, (it) => it.main?.temp_max);

      const safeMin = (arr: number[]) => (arr.length ? Math.min(...arr) : null);
      const safeMax = (arr: number[]) => (arr.length ? Math.max(...arr) : null);
      const safeAvg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null);

      const temp_min = safeMin(temp_mins);
      const temp_max = safeMax(temp_maxs);
      const temp_avg = safeAvg(temps);

      const hums = numberArray(items, (it) => it.main?.humidity);
      const humidity_avg = hums.length ? Math.round(safeAvg(hums) as number) : null;

      const winds = numberArray(items, (it) => it.wind?.speed);
      const wind_speed_avg = winds.length ? Number((safeAvg(winds) as number).toFixed(1)) : null;

      const pops = numberArray(items, (it) => (typeof it.pop === "number" ? it.pop : 0));
      const pop_max = pops.length ? Math.max(...pops) : null;

      // choose most frequent description (mode)
      const descs = items
        .map((it: any) => (Array.isArray(it.weather) && it.weather[0] ? it.weather[0].description : ""))
        .filter(Boolean);
      let description = "";
      if (descs.length) {
        const freq: Record<string, number> = {};
        for (const s of descs) freq[s] = (freq[s] || 0) + 1;
        description = Object.keys(freq).sort((a, b) => freq[b] - freq[a])[0];
      }

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
      timezone: payload?.city?.timezone ?? tzOffsetSeconds ?? null,
    };

    cache.set(key, out);
    return out;
  } catch (err) {
    console.error("getWeather error:", err);
    return null;
  }
}
