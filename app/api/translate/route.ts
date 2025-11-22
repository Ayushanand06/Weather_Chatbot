import { NextResponse } from "next/server";
import OpenAI from "openai";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

export async function POST(req: Request) {
  let textToTranslate = "";

  try {
    const body = await req.json();
    textToTranslate = body.text || "";
    const targetLanguage = body.targetLanguage; // "en" or "ja"

    if (!textToTranslate) return NextResponse.json({ translatedText: "" });

    // Explicitly name the target language
    const targetLangName = targetLanguage === "ja" ? "Japanese" : "English";

    const prompt = `Translate the following text into ${targetLangName}. 
    If the text is already in ${targetLangName}, return it exactly as is.
    Do not add explanations or extra punctuation. Just return the translated text.
    Text: "${textToTranslate}"`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b", 
      // You can use "llama3-8b-8192" or "mixtral-8x7b-32768" on Groq usually
      // "openai/gpt-oss-20b" assumes you have access to that specific model via a specific gateway.
    });

    return NextResponse.json({
      translatedText: completion.choices[0]?.message?.content || textToTranslate,
    });
  } catch (error) {
    console.error("Translation error:", error);
    // Return original text on failure
    return NextResponse.json({ translatedText: textToTranslate });
  }
}