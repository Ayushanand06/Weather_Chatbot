Weather ChatBot — Bilingual Weather Assistant

Live Deployment →

(Replace # with your deployed URL)

An intelligent, bilingual chatbot that accepts both voice and text, automatically detects English ↔ Japanese, and provides real-time, weather-aware recommendations using AI.
This application uses advanced LLM reasoning, Whisper-style transcription, location awareness, and a fully responsive UI built with Next.js.

This project was initially developed as a practical demo but evolved into a polished, production-grade showcase of AI engineering, full-stack development, and user-centric design.

✨ Key Features

🧠 Conversational Memory: Maintains context across turns for natural and seamless conversations.

🎙️ Multi-Modal Input: Supports both Japanese and English voice commands and typed text.

🤖 AI-Powered Intent Understanding: Determines whether a request requires weather analysis, general information, or simple chat.

🌐 Auto Language Detection: Detects whether the user typed in EN or JP and auto-translates to the UI language.

📄 Structured Output: LLM responses can be parsed into structured data for dynamic UI rendering.

🈺 Full Bilingual Interface: Instant toggle between Japanese 🇯🇵 and English 🇬🇧 — the entire conversation re-translates in real time.

🎨 Polished UX: Smooth animations, message bubbles, themes, loading states, and full mobile responsiveness.

🛠️ Technology Stack
Layer	Technology	Purpose
Frontend	Next.js (React, App Router)	Modern UI, client/server rendering
	TypeScript	Strong typing & maintainability
	Tailwind CSS	Responsive utility-first styling
	lucide-react icons	UI iconography
Backend	Next.js API Routes (/api/chat, /api/translate)	LLM orchestration, translations, transcription
AI / Data	Groq / OpenAI LLMs	Fast reasoning, chat, translation
	Whisper-style STT	Voice transcription (JP/EN)
Weather	OpenWeatherMap API	Geocoding & 5-day weather forecast
Deployment	Vercel	Frontend hosting & CI/CD
	Render / Serverless	Backend hosting
🏛️ System Architecture
