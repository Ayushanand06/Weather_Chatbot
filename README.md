🤖 AI Outdoor Adventure Planner
Live Deployment

An intelligent, multi-modal chatbot that provides weather-aware recommendations for outdoor activities. This application leverages generative AI to analyze weather forecasts in the context of a user's request, offering safe, actionable, and personalized advice in both Japanese and English.

This project was developed for a technical assessment and evolved into a portfolio-grade application showcasing advanced AI engineering, full-stack development, and a user-centric design philosophy.

Chatbot Demo

✨ Key Features
🧠 Conversational Memory: Remembers the context of the conversation for natural follow-up questions.
🗣️ Multi-Modal Input: Seamlessly accepts both Japanese voice commands and text input.
🤖 AI-Powered Intent Classification: Intelligently determines whether a user's query requires a detailed weather analysis or a general chat response.
📄 Structured JSON Output: The AI generates detailed, structured data (not just text), enabling a rich and dynamic user interface.
🌐 Bilingual Interface: The entire frontend is internationalized, with a real-time toggle for both Japanese (ja) and English (en).
✨ Polished UX: A full-featured chat interface with real-time updates, loading states, error handling, and a conversation reset function.
🚀 Live Demo
Access the live application here!

🛠️ Technology Stack
Layer	Technology	Purpose
Frontend	Next.js (React)	For building a modern, server-aware, and performant user interface.
TypeScript	Ensures type safety and improves code quality and maintainability.
Tailwind CSS	For rapid, utility-first styling and creating a responsive design.
Backend	Node.js & Express	Provides a fast, scalable, and lightweight foundation for the API server.
AI / Data	Groq	- Whisper-Large-V3: For high-speed, accurate Japanese speech-to-text.
- Llama 3: For all generative tasks (intent classification, entity extraction, proposal generation).
OpenWeatherMap API	Provides free, reliable geocoding and 5-day weather forecast data.
Deployment	Vercel	For continuous deployment and hosting of the Next.js frontend.
Render	For continuous deployment and hosting of the Node.js backend service.
🏛️ System Architecture
The application follows a decoupled frontend/backend architecture. The backend acts as an intelligent orchestrator, managing multiple AI and data API calls to fulfill a user's request.

