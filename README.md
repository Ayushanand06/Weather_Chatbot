🤖 Weather ChatBot — Bilingual Weather Assistant (EN / JP)

Live Deployment: 

An intelligent, bilingual (English ↔ Japanese) weather chatbot that accepts text and voice, understands user intent, and provides weather-aware advice and recommendations. Built with a modern Next.js frontend, a small server API (Next app routes) for orchestration, Groq/OpenAI models for generation and Whisper-style transcription for voice input.

Key Features

🗣️ Voice + Text Input — Record audio or type messages; the bot handles both seamlessly.

🤖 Auto Language Detection — Automatically detects English/Japanese input and translates into UI language.

🌐 Bilingual UI — Full English ↔ Japanese toggle with dynamic re-translation of the entire conversation.

🧠 Conversational Memory — Maintains context for follow-up questions.

🎙️ Whisper-Style Transcription — High-accuracy audio transcription (JP/EN).

🌦️ Weather-Aware Responses — Uses optional user location and external weather APIs (e.g., OpenWeatherMap).

💬 Polished Chat Interface — Smooth UX, loading indicators, smart scrolling, microphone controls, theme switching.

🔁 Smart LLM Orchestration — Server builds prompts, handles history, enforces target language, and integrates context.

🛠️ Tech Stack
Layer	Technology	Purpose
🖥️ Frontend	Next.js (React, App Router) + TypeScript	UI, chat interface, multi-modal input
🎨 Styling	Tailwind CSS, lucide-react icons	Modern, responsive UI & iconography
🧩 Backend	Next.js API Routes (/api/chat, /api/translate)	LLM orchestration, transcription, translation
🧠 AI Models	Groq/OpenAI LLMs, Whisper-style STT	Chat responses, translation, speech-to-text
🌦️ Weather	OpenWeatherMap API	Geocoding & 5-day weather forecasting
🚀 Deployment	Vercel (frontend) + Render/Serverless (backend)	Hosting, CI/CD, and global edge network

System Architecture

The application follows a decoupled frontend/backend architecture. The backend acts as an intelligent orchestrator, managing multiple AI and data API calls to fulfill a user's request.

