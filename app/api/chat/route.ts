// app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getWeather } from "@/lib/weather";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Local demo image path (developer-provided); your infra will convert to a URL when serving assets.
const DEMO_IMAGE_URL = "/mnt/data/4650453d-ddb4-4eab-b3b2-dabd217c7987.png";

function validCoord(v: any) {
  return typeof v === "string" && v.trim() !== "" && !isNaN(Number(v));
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const textInput = (formData.get("text") as string) || "";
    const audioFile = formData.get("audio") as File | null;
    const latitude = (formData.get("latitude") as string) || "";
    const longitude = (formData.get("longitude") as string) || "";
    const language = (formData.get("language") as string) || "en";
    const historyRaw = (formData.get("history") as string) || "[]";
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    const hasCoords = validCoord(latitude) && validCoord(longitude);
    const latNum = hasCoords ? Number(latitude) : undefined;
    const lonNum = hasCoords ? Number(longitude) : undefined;

    let userMessage = textInput || "";

    // 1) Transcribe audio if provided
    if (audioFile) {
      try {
        const transcription = await groq.audio.transcriptions.create({
          file: audioFile,
          model: "whisper-large-v3",
          response_format: "json",
        });
        userMessage = transcription?.text || userMessage;
      } catch (e) {
        console.warn("Transcription error:", e);
      }
    }

    // 2) If coords present, fetch weather (5-day aggregated) and get friendly location name.
    let weather = null;
    let friendlyLocation = "";
    if (hasCoords) {
      weather = await getWeather(String(latNum), String(lonNum), { lang: language === "ja" ? "ja" : "en" } as any);
      if (weather && weather.location) friendlyLocation = weather.location;
    }

    // 3) Prune any trailing assistant "Which city..." question from history if we now have coords
    let normalizedHistory = history.slice(-12);
    if (hasCoords) {
      while (normalizedHistory.length) {
        const last = normalizedHistory[normalizedHistory.length - 1];
        const lastText = String(last.originalText ?? last.text ?? "").toLowerCase();
        if (last.sender === "ai" && /which city|which location|where should i search|which city should|which location should/i.test(lastText)) {
          normalizedHistory.pop();
        } else break;
      }
    }

    // 4) Build compact weather summary for the system prompt
    let weatherSummary = "";
    if (weather && Array.isArray(weather.daily) && weather.daily.length) {
      weatherSummary = "5-day forecast summary:\n";
      for (const d of weather.daily) {
        const pop = (d as any).pop_max !== null ? `${Math.round(((d as any).pop_max as number) * 100)}%` : "N/A";
        weatherSummary += `- ${d.date}: ${d.description || "N/A"} — ${d.temp_max ?? "-"}°C / ${d.temp_min ?? "-"}°C, precip ${pop}\n`;
      }
    }

    // 5) Primary system prompt (TypeScript-safe)
    const systemPrompt = `
You are a helpful bilingual assistant that replies in the user's selected language.
The user selected language: ${language === "ja" ? "JAPANESE (日本語)" : "ENGLISH"}.

IMPORTANT RULES:
1) Reply like ChatGPT in conversational style (no tables unless requested).
2) If latitude and longitude are provided by the client, you MUST NEVER ask for the user's location. Use the provided coordinates as the location and proceed with the query.
3) If the user asks for places (restaurants, attractions), provide up to 5 suggestions. For each suggestion include:
   - Name (bold)
   - One short description
   - Google Maps search link: https://www.google.com/maps/search/?api=1&query=PLACE_NAME
   - Google Images link: https://www.google.com/search?tbm=isch&q=PLACE_NAME
4) If the user explicitly requests a fresh start, output the exact token: <<RESET_CONVERSATION>> followed by a short confirmation.
5) If weather info is available, integrate it naturally into suggestions.
6) Always respond strictly in the selected language.
`.trim();

    // 6) If coords present, inject explicit coordinates message (guarantees model sees numeric coords & friendly name)
    const coordSystemMessage = hasCoords
      ? {
          role: "system",
          content: `CLIENT_COORDINATES_PRESENT: Use these coordinates and NEVER ask for the user's location.
Latitude: ${latNum}
Longitude: ${lonNum}
FriendlyLocation: ${friendlyLocation || `${latNum}, ${lonNum}`}
ExampleImageURL: ${DEMO_IMAGE_URL}`
        }
      : null;

    // 7) Build final messages array (system prompt, injected coord message, pruned history, user)
    const apiMessages: any[] = [
      { role: "system", content: systemPrompt },
      ...(coordSystemMessage ? [coordSystemMessage] : []),
      ...(weather ? [{ role: "system", content: `WeatherContext:\n${weatherSummary}` }] : []),
      ...normalizedHistory
        .map((m: any) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.originalText ?? m.text ?? "",
        }))
        .slice(-6),
      { role: "user", content: userMessage },
    ];

    // 8) Call model
    const completion = await groq.chat.completions.create({
      messages: apiMessages as any,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices?.[0]?.message?.content ?? "";

    // 9) Return response; client will handle <<RESET_CONVERSATION>> token, map/image URLs, and history
    return NextResponse.json({
      response: aiResponse,
      transcription: audioFile ? userMessage : undefined,
      location: hasCoords ? { latitude: latNum, longitude: lonNum, name: friendlyLocation } : undefined,
      weather: weather ?? undefined,
    });
  } catch (err) {
    console.error("chat route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
