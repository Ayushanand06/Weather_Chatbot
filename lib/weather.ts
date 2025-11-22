import NodeCache from "node-cache";
export interface WeatherData {
  location: string;
  temp: number;
  description: string;
  feels_like: number;
  humidity: number;
}

// Cache for 10 minutes (600 seconds)
const weatherCache = new NodeCache({ stdTTL: 600 });

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// 2. Set the return type of the function to Promise<WeatherData | null>
export async function getWeather(lat: string, lon: string): Promise<WeatherData | null> {
  if (!lat || !lon) return null;

  // Create a cache key based on rounded coordinates
  const cacheKey = `${parseFloat(lat).toFixed(2)},${parseFloat(lon).toFixed(2)}`;

  // 3. Tell TypeScript the cached data matches our Interface
  const cachedData = weatherCache.get<WeatherData>(cacheKey);
  if (cachedData) {
    console.log("Returning cached weather data");
    return cachedData;
  }

  try {
    console.log("Fetching new weather data from API");
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=ja`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather");
    }

    const data = await response.json();

    // Format data using the Interface
    const formattedWeather: WeatherData = {
      location: data.name,
      temp: data.main.temp,
      description: data.weather[0].description,
      feels_like: data.main.feels_like,
      humidity: data.main.humidity,
    };

    // Store in cache
    weatherCache.set(cacheKey, formattedWeather);
    return formattedWeather;
  } catch (error) {
    console.error("Weather API Error:", error);
    return null;
  }
}