"use client"

import React, { useEffect, useRef, useState } from "react"
import { Send, Mic, Square, Globe, Moon, Sun, Palette } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Language = "en" | "ja"

interface Message {
  id: string
  text: string
  originalText: string
  sender: "user" | "ai"
  timestamp: Date
}

const Button = ({ onClick, disabled, className, children, type = "button", title, style }: any) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={style}
    className={`inline-flex items-center justify-center transition-colors disabled:opacity-50 disabled:pointer-events-none ${className}`}
  >
    {children}
  </button>
)

const uiCopy = {
  en: {
    title: "AmeAI",
    welcome: "Just Ask the Weather",
    welcomeMsg: "Ask for outfit ideas, travel spots, or weekend plans based on the weather.",
    locating: "Locating...",
    recording: "Recording...",
    placeholder: "Suggest some outfits for tomorrow....",
    error: "Error. Try again.",
    allowLocation: "Allow location to provide local weather",
    allowButton: "Allow location",
  },
  ja: {
    title: "天気チャットボット",
    welcome: "天気チャットボット",
    welcomeMsg: "今日はどのようなご用件でしょうか？",
    locating: "位置情報を取得中...",
    recording: "録音中...",
    placeholder: "メッセージを入力...",
    error: "エラーが発生しました。もう一度試してください。",
    allowLocation: "現在地を許可すると天気がより正確になります",
    allowButton: "位置情報を許可する",
  },
}

async function translateTextClient(text: string, targetLanguage: Language) {
  if (!text) return text
  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, targetLanguage }),
    })
    const data = await res.json()
    return data.translatedText ?? text
  } catch (e) {
    console.warn("translateTextClient error", e)
    return text
  }
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [language, setLanguage] = useState<Language>("en")
  const [theme, setTheme] = useState<"light" | "dark">("dark")
  const [bgTheme, setBgTheme] = useState<"japanese" | "normal">("japanese")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationDenied, setLocationDenied] = useState(false)

  const inputRef = useRef<HTMLInputElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const t = uiCopy[language]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setLocationDenied(true)
      },
    )
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (messages.length === 0) return
    const translateHistory = async () => {
      setLoading(true)
      const translatedMsgs = await Promise.all(
        messages.map(async (m) => {
          try {
            const newText = await translateTextClient(m.originalText, language)
            return { ...m, text: newText }
          } catch {
            return m
          }
        })
      )
      setMessages(translatedMsgs)
      setLoading(false)
    }
    translateHistory()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      audioChunksRef.current = []
      mr.ondataavailable = (e) => audioChunksRef.current.push(e.data)
      mr.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        await handleSend(null, audioBlob)
        stream.getTracks().forEach((t) => t.stop())
      }
      mr.start()
      setRecording(true)
    } catch (err) {
      console.error(err)
      alert("Microphone access required")
    }
  }
  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const requestLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation not supported")
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        setLocationDenied(false)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setLocationDenied(true)
          alert("Location permission denied")
        }
      },
    )
  }

  const handleSend = async (textInput: string | null, audioBlob: Blob | null) => {
    if (!textInput && !audioBlob) return
    const msgId = Date.now().toString() + "-u"
    const rawUserText = textInput ?? (audioBlob ? "..." : "") 
    const userMsg: Message = {
      id: msgId,
      text: rawUserText,
      originalText: rawUserText,
      sender: "user",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMsg])

    setInput("")
    inputRef.current?.focus()
    setLoading(true)

    try {
      let finalUserText = rawUserText
      if (textInput) {
        try {
           const translatedInput = await translateTextClient(textInput, language)
           finalUserText = translatedInput
           setMessages((prev) => 
             prev.map((m) => m.id === msgId ? { ...m, text: finalUserText, originalText: finalUserText } : m)
           )
        } catch(e) {
           console.error("Input translation failed", e)
        }
      }
      const form = new FormData()
      if (textInput) form.append("text", finalUserText)
      if (audioBlob) form.append("audio", audioBlob, "audio.wav")
      if (location) {
        form.append("latitude", String(location.latitude))
        form.append("longitude", String(location.longitude))
      }
      form.append("language", language)
      form.append("history", JSON.stringify(messages))

      const res = await fetch("/api/chat", { method: "POST", body: form })
      const data = await res.json()

      if (audioBlob && data.transcription) {
        let finalTranscription = data.transcription
        try {
            finalTranscription = await translateTextClient(data.transcription, language)
        } catch (e) {
            console.warn("Audio translation failed", e)
        }
        setMessages((prev) => 
            prev.map((m) => (m.id === userMsg.id ? { ...m, text: finalTranscription, originalText: finalTranscription } : m))
        )
      }
      let aiText = data.response || (language === "ja" ? "応答がありませんでした。" : "No response.")
      aiText = await translateTextClient(aiText, language)

      const aiMsg: Message = {
        id: Date.now().toString() + "-a",
        text: aiText,
        originalText: aiText,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      console.error("send error", err)
      const errMsg: Message = {
        id: Date.now().toString() + "-err",
        text: uiCopy[language].error,
        originalText: uiCopy[language].error,
        sender: "ai",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const toggleLanguage = () => setLanguage((l) => (l === "en" ? "ja" : "en"))
  const toggleTheme = () => setTheme((s) => (s === "dark" ? "light" : "dark"))

  // Generate the correct class based on BOTH Theme and Palette
  const getThemeClass = () => {
    if (bgTheme === 'japanese') {
      return theme === 'dark' ? 'theme-japanese-dark' : 'theme-japanese-light';
    } else {
      return theme === 'dark' ? 'theme-normal-dark' : 'theme-normal-light';
    }
  }

  return (
    <div className={`chat-root flex flex-col min-h-screen transition-colors duration-200 ${getThemeClass()}`}>
      {/* Header */}
      <header className="chat-header sticky top-0 z-50">
        <div className="header-inner max-w-6xl mx-auto w-full">
          <div className="left-loc">{location ? `📍 ${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}` : t.locating}</div>

          <div className="center-title">
            <h1 className="title-text">{t.title}</h1>
          </div>

          <div className="right-controls">
            <Button onClick={() => setBgTheme((b) => (b === "japanese" ? "normal" : "japanese"))} className="top-icon" title="Background theme">
              <Palette size={18} />
            </Button>

            <Button onClick={toggleLanguage} className="top-icon" title="Language">
              <Globe size={16} />
              <span style={{ marginLeft: 6, fontWeight: 700, fontSize: 12 }}>{language === "en" ? "EN" : "日本語"}</span>
            </Button>

            <Button onClick={toggleTheme} className="top-icon" title="Dark / Light">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
          </div>
        </div>
      </header>

      

      {/* Chat Main Area */}
      <main className="flex-1 flex justify-center">
        <div className="chat-column w-full max-w-[980px] px-6 py-6">
          <div className="messages-scroll h-[calc(100vh-220px)] overflow-y-auto pr-2 space-y-8">
            {messages.length === 0 ? (
              <div className="welcome-container">
                <div className="welcome-emoji">☁️</div>
                <h2 className="welcome-title">{t.welcome}</h2>
                <p className="welcome-subtitle">{t.welcomeMsg}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.sender === "ai" ? (
                    <div className="bg-glass-bubble p-5">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                      <div className="text-xs text-slate-400 mt-3">{msg.timestamp.toLocaleTimeString(language === "ja" ? "ja-JP" : "en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  ) : (
                    <div className="user-bubble">
                      <div className="text-sm break-words">{msg.text}</div>
                      <div className="text-xs opacity-80 mt-2 text-blue-100">{msg.timestamp.toLocaleTimeString(language === "ja" ? "ja-JP" : "en-US", { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  )}
                </div>
              ))
            )}

            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-75" />
                <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce delay-150" />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="composer-wrap">
        <div className="w-full flex justify-center">
          <div className="chat-column w-full max-w-[980px] px-6 py-4">
            
            <div className="relative w-full">
              
              <Button 
                onClick={recording ? stopRecording : startRecording} 
                className={`mic-btn absolute top-1/2 -translate-y-1/2 z-10 ${recording ? "recording" : ""}`} 
                style={{ left: '10px' }}
                title="Record"
              >
                {recording ? <Square /> : <Mic />}
              </Button>

              <input
                ref={inputRef}
                aria-label="Message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(input, null)
                }}
                placeholder={t.placeholder}
                className="composer-input"
              />

              <Button 
                onClick={() => handleSend(input, null)} 
                className="send-btn absolute top-1/2 -translate-y-1/2 z-10" 
                style={{ right: '10px' }}
                title="Send"
              >
                <Send />
              </Button>
              
            </div>

          </div>
        </div>
      </footer>
    </div>
  )
}