// app/api/chat/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";
import { getWeather } from "@/lib/weather";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

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

    let userMessage = textInput || "";

    // Transcribe if audio given
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

    // Get 5-day forecast (aggregated) if coords given
    let weather = null;
    if (latitude && longitude) {
      weather = await getWeather(latitude, longitude);
    }

    // Build short weather summary for system prompt
    let weatherSummary = "";
    if (weather && Array.isArray(weather.daily)) {
      weatherSummary = "5-day forecast summary:\n";
      for (const d of weather.daily) {
        const pop = d.pop_max !== null ? `${Math.round((d.pop_max as number) * 100)}%` : "N/A";
        weatherSummary += `- ${d.date}: ${d.description || "N/A"} — ${d.temp_max ?? "-"}°C / ${d.temp_min ?? "-"}°C, precip ${pop}\n`;
      }
    }

    const systemPrompt = `You are a helpful Weather Assistant.
IMPORTANT: The user selected language: ${language === "ja" ? "JAPANESE (日本語)" : "ENGLISH"}.
RULES:
1) Reply ONLY in the selected language.
2) Use Markdown formatting (lists, bold).
3) If weather is available, incorporate it into recommendations.

${weather ? `Location: ${weather.location}\n\n${weatherSummary}` : ""}`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history
        .map((m: any) => ({
          role: m.sender === "ai" ? "assistant" : "user",
          content: m.originalText ?? m.text ?? "",
        }))
        .slice(-6),
      { role: "user", content: userMessage },
    ];

    const completion = await groq.chat.completions.create({
      messages: apiMessages as any,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({
      response: aiResponse,
      transcription: audioFile ? userMessage : undefined,
      location: latitude && longitude ? { latitude, longitude } : undefined,
      weather: weather ?? undefined,
    });
  } catch (err) {
    console.error("chat route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
