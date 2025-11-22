<div align="center">

# TenkiSense | 天気センス

AI-powered Weather, Travel, Fashion & Activity Recommendation System | AI を活用した天気 × 旅行 × ファッション × アクティビティ提案システム

</div>

---

## Overview

**TenkiSense** is an intelligent, multilingual AI assistant that analyzes weather, location, and user intent to recommend the best activities, outfits, travel ideas, music moods, sports, agricultural tips, and more. Users can interact via text or voice, and receive dynamic suggestions enhanced by Google Maps links and forecast-based planning.

Powered by Next.js, Groq LLMs, Whisper speech recognition, and OpenWeather APIs, TenkiSense delivers real-time, personalized advice in both English and Japanese.

---

## 概要

**天気センス（TenkiSense）** は、天気・位置情報・ユーザーの意図を解析し、最適なアクティビティ、旅行先、服装、音楽ムード、スポーツ、農業アドバイスなどを提案する多機能 AI アシスタントです。 ユーザーは **音声またはテキスト** で操作でき、AI が **英語と日本語の両方で** パーソナライズされた提案を行います。

Next.js、Groq LLM、Whisper 音声認識、OpenWeather API を活用し、リアルタイムの洞察と高度な提案を提供します。

---

## Live demo and Video

* Live App: https://weather-chatbot-eta.vercel.app/
* Demo Video: https://drive.google.com/file/d/1rGTLNeD87gQGbSBayCcyyD_2f-CVbDcO/view?usp=sharing

---

## Screenshots

<img width="1862" height="874" alt="Screenshot 2025-11-23 035119" src="https://github.com/user-attachments/assets/08f17f79-039a-42b6-beab-4f94b1e5dd97" />

<img width="1860" height="890" alt="Screenshot 2025-11-23 035250" src="https://github.com/user-attachments/assets/93cdc0ea-2b2a-49c5-8919-c337c562258c" />

<img width="1859" height="894" alt="Screenshot 2025-11-23 035310" src="https://github.com/user-attachments/assets/0366246f-50d9-4f75-b817-2d02aa701411" />

---

## Features

*   🌦️ **5-Day Advanced Weather Forecast:** Detailed temperature, humidity, wind & precipitation analysis.
*   👕 **Smart Outfit Recommendations:** AI suggests clothing based on real weather conditions.
*   🧭 **Travel & Activity Planning:** Get suggestions for outings, cafes, places, sightseeing spots, and events.
*   🎶 **Music Mood Recommender:** AI suggests music style depending on your weather, mood, or inquiry.
*   🏃 **Sports Suggestions:** Activity-friendly days, indoor/outdoor ideas.
*   🌾 **Agriculture Tips:** Farming advice tied to weather patterns and crop suitability.
*   🗺️ **Location-aware Maps Integration:** Google Maps search links + Google Image previews for places.
*   🎤 **Voice & Text Input:** Whisper STT for fast bilingual transcription.
*   🌐 **Bilingual Output:** Instant English ↔ Japanese responses.

---

## 特徴

*   🌦️ **5 日間の詳細天気予報:** 気温、湿度、風速、降水量を AI が解析。
*   👕 **スマート服装提案:** 天候に合わせたコーディネートを自動生成。
*   🧭 **旅行・外出アクティビティ提案:** 観光地、カフェ、レストラン、イベントなどを紹介。
*   🎶 **音楽ムードレコメンド:** 天気や気分に合わせて音楽ジャンルを提案。
*   🏃 **スポーツアドバイス:** 屋内/屋外スポーツやアクティビティの最適日を提案。
*   🌾 **農業向けアドバイス:** 天気・季節・作物の適合性に基づく AI ガイド。
*   🗺️ **場所の Google マップ連携:** 地図検索と画像検索リンクを自動生成。
*   🎤 **音声・テキスト入力対応:** Whisper による高速な音声認識。
*   🌐 **日英対応のバイリンガル出力:** リアルタイムで英語/日本語に切り替え可能。

---

*   ## 🛠️ Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | **Next.js (React)** | For building a modern, server-aware, and performant user interface. |
| | **TypeScript** | Ensures type safety and improves code quality and maintainability. |
| | **Tailwind CSS** | For rapid, utility-first styling and creating a responsive design. |
| **Backend** | **Node.js & Express** | Provides a fast, scalable, and lightweight foundation for the API server. |
| **AI / Data** | **Groq** | **Whisper-Large-V3:** For high-speed, accurate Japanese/English speech-to-text.<br>**Llama 3:** For generative tasks (intent classification, entity extraction, proposal generation). |
| | **OpenWeatherMap API** | Provides free, reliable geocoding and 5-day weather forecast data. |
| | **Google Maps API** | Generates location links and visual map previews. |
| **Deployment** | **Vercel** | For continuous deployment and hosting of the Next.js frontend. |
| | **Render** | For continuous deployment and hosting of the backend service. |

---

## 🏗️ Architecture

The following diagram illustrates the flow of data from the user's voice/text input through the translation layer, AI processing, weather API, and back to the UI.

<img width="1433" height="742" alt="Screenshot 2025-11-22 165142" src="https://github.com/user-attachments/assets/b92e48dc-d2c2-47bd-82a7-6c1ecfa02bc5" />


