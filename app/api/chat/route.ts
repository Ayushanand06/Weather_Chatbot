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
    const textInput = formData.get("text") as string | null;
    const audioFile = formData.get("audio") as File | null;
    const latitude = formData.get("latitude") as string;
    const longitude = formData.get("longitude") as string;
    const language = formData.get("language") as string || "en"; 
    const historyRaw = formData.get("history") as string;
    const history = historyRaw ? JSON.parse(historyRaw) : [];

    let userMessage = textInput || "";

    // 1. Audio Transcription
    if (audioFile) {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-large-v3",
        response_format: "json",
      });
      userMessage = transcription.text;
    }

    // 2. Weather
    const weatherData = await getWeather(latitude, longitude);

    // 3. System Prompt (Strict Language Control)
    let systemPrompt = `You are a helpful Weather Assistant.
    
    IMPORTANT: The user has chosen the language: ${language === 'ja' ? 'JAPANESE (日本語)' : 'ENGLISH'}.
    
    RULES:
    1. If the language is Japanese, you MUST output ONLY in Japanese.
    2. Format your response nicely using Markdown (bolding, lists).
    3. Be friendly and concise.
    `;

    if (weatherData) {
      systemPrompt += `
      Current Weather:
      - Location: ${weatherData.location}
      - Temp: ${weatherData.temp}°C
      - Condition: ${weatherData.description}
      - Humidity: ${weatherData.humidity}%
      `;
    }

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m: any) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.originalText || m.text // Use original text to avoid translation loops
      })).slice(-6),
      { role: "user", content: userMessage }
    ];

    const completion = await groq.chat.completions.create({
      messages: apiMessages as any,
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      temperature: 0.7,
      max_tokens: 1024,
    });

    const aiResponse = completion.choices[0]?.message?.content || "";

    return NextResponse.json({
      response: aiResponse,
      transcription: audioFile ? userMessage : undefined,
      location: { latitude, longitude },
      weather: weatherData
    });

  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}