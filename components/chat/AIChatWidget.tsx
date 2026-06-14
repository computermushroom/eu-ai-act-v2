"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import type { SupportedLocale } from "@/types";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const SUPPORTED_LANGUAGES: { code: SupportedLocale; label: string; flag: string }[] = [
  { code: "en", label: "English", flag: "EN" },
  { code: "de", label: "Deutsch", flag: "DE" },
  { code: "fr", label: "Francais", flag: "FR" },
  { code: "es", label: "Espanol", flag: "ES" },
  { code: "it", label: "Italiano", flag: "IT" },
  { code: "zh", label: "中文", flag: "中文" },
  { code: "ja", label: "日本語", flag: "日本語" },
  { code: "ko", label: "한국어", flag: "한국어" },
  { code: "ru", label: "Русский", flag: "RU" },
  { code: "ar", label: "العربية", flag: "AR" },
];

const WELCOME_MESSAGES: Record<string, string> = {
  en: "Hello! I'm your EU AI Act Compliance Assistant. I can answer questions about the EU AI Act, help you understand compliance requirements, and guide you to the right plan for your needs. How can I help you today?",
  de: "Hallo! Ich bin Ihr EU AI Act Compliance Assistant. Ich beantworte Fragen zum EU AI Act, helfe Ihnen bei Compliance-Anforderungen und empfehle den passenden Plan. Wie kann ich Ihnen helfen?",
  fr: "Bonjour! Je suis votre assistant de conformite au AI Act europeen. Je peux repondre a vos questions, vous aider a comprendre les exigences et vous guider vers le bon forfait. Comment puis-je vous aider?",
  es: "¡Hola! Soy su asistente de cumplimiento del AI Act de la UE. Puedo responder preguntas, ayudarle a entender los requisitos y guiarle hacia el plan adecuado. ¿Como puedo ayudarle?",
  it: "Ciao! Sono il tuo assistente di conformita all'AI Act dell'UE. Posso rispondere alle domande, aiutarti a capire i requisiti e guidarti verso il piano giusto. Come posso aiutarti?",
  zh: "您好！我是您的 EU AI Act 合规助手。我可以回答关于欧盟人工智能法案的问题，帮助您了解合规要求，并为您推荐合适的方案。今天有什么可以帮您？",
  ja: "こんにちは！EU AI Act コンプライアンスアシスタントです。EU AI Act に関する質問にお答えし、コンプライアンス要件の理解と適切なプランのご案内をお手伝いします。本日は何をお手伝いできますか？",
  ko: "안녕하세요! EU AI Act 컴플라이언스 어시스턴트입니다. EU AI Act 관련 질문에 답변하고, 컴플라이언스 요구사항을 이해하는 데 도우며, 적합한 플랜을 안내해 드립니다. 무엇을 도와드릴까요?",
  ru: "Здравствуйте! Я ваш ассистент по соответствию Закону ЕС об ИИ. Я могу ответить на вопросы о законе, помочь разобраться в требованиях и подобрать подходящий план. Чем могу помочь?",
  ar: "مرحباً! أنا مساعد الامتثال لقانون الاتحاد الأوروبي للذكاء الاصطناعي. يمكنني الإجابة على أسئلتك، ومساعدتك في فهم متطلبات الامتثال، وتوجيهك نحو الخطة المناسبة. كيف يمكنني مساعدتك اليوم؟",
};

const TYPING_LABELS: Record<string, string> = {
  en: "Typing...",
  de: "Tippt...",
  fr: "En train d'ecrire...",
  es: "Escribiendo...",
  it: "Sta scrivendo...",
  zh: "正在输入...",
  ja: "入力中...",
  ko: "입력 중...",
  ru: "Печатает...",
  ar: "يكتب...",
};

const PLACEHOLDERS: Record<string, string> = {
  en: "Ask about EU AI Act compliance...",
  de: "Fragen zur EU AI Act-Konformitat...",
  fr: "Posez une question sur la conformite au AI Act...",
  es: "Pregunte sobre el cumplimiento del AI Act...",
  it: "Chiedi sulla conformita all'AI Act...",
  zh: "询问 EU AI Act 合规问题...",
  ja: "EU AI Act コンプライアンスについて質問...",
  ko: "EU AI Act 컴플라이언스에 대해 질문...",
  ru: "Спросите о соответствии Закону ЕС об ИИ...",
  ar: "اسأل عن الامتثال لقانون الاتحاد الأوروبي للذكاء الاصطناعي...",
};

const SEND_LABELS: Record<string, string> = {
  en: "Send",
  de: "Senden",
  fr: "Envoyer",
  es: "Enviar",
  it: "Invia",
  zh: "发送",
  ja: "送信",
  ko: "병내기",
  ru: "Отправить",
  ar: "إرسال",
};

const CLOSE_LABELS: Record<string, string> = {
  en: "Close",
  de: "Schliessen",
  fr: "Fermer",
  es: "Cerrar",
  it: "Chiudi",
  zh: "关闭",
  ja: "閉じる",
  ko: "닫기",
  ru: "Закрыть",
  ar: "إغلاق",
};

const HEADER_TITLES: Record<string, string> = {
  en: "EU AI Act Compliance Assistant",
  de: "EU AI Act Compliance-Assistent",
  fr: "Assistant de conformite au AI Act",
  es: "Asistente de cumplimiento del AI Act",
  it: "Assistente di conformita AI Act",
  zh: "EU AI Act 合规助手",
  ja: "EU AI Act コンプライアンスアシスタント",
  ko: "EU AI Act 컴플라이언스 어시스턴트",
  ru: "Ассистент по соответствию Закону ЕС об ИИ",
  ar: "مساعد الامتثال لقانون الاتحاد الأوروبي للذكاء الاصطناعي",
};

const ERROR_MESSAGES: Record<string, string> = {
  en: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
  de: "Entschuldigung, ich habe gerade Verbindungsprobleme. Bitte versuchen Sie es gleich noch einmal.",
  fr: "Desole, j'ai des problemes de connexion en ce moment. Veuillez reessayer dans un instant.",
  es: "Lo siento, estoy teniendo problemas de conexion. Por favor, intentelo de nuevo en un momento.",
  it: "Mi dispiace, sto avendo problemi di connessione. Riprova tra un momento.",
  zh: "抱歉，我目前连接出现问题。请稍后再试。",
  ja: "申し訳ございませんが、現在接続に問題が発生しています。しばらくしてからもう一度お試しください。",
  ko: "죄송합니다. 현재 연결에 문제가 있습니다. 잠시 후 다시 시도해 주세요.",
  ru: "Извините, сейчас возникли проблемы с подключением. Пожалуйста, попробуйте еще раз через минуту.",
  ar: "عذراً، أواجه مشاكل في الاتصال حالياً. يرجى المحاولة مرة أخرى بعد قليل.",
};

export default function AIChatWidget() {
  const currentLocale = useLocale() as SupportedLocale;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chatLanguage, setChatLanguage] = useState<SupportedLocale>(currentLocale);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: WELCOME_MESSAGES[chatLanguage] || WELCOME_MESSAGES["en"],
        },
      ]);
    }
  }, [isOpen, messages.length, chatLanguage]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setShowLangDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (lang: SupportedLocale) => {
    setChatLanguage(lang);
    setShowLangDropdown(false);
    if (messages.length === 1 && messages[0]?.role === "assistant") {
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: WELCOME_MESSAGES[lang] || WELCOME_MESSAGES["en"],
        },
      ]);
    }
  };

  const handleSend = useCallback(
    async (text?: string) => {
      const messageText = text || input.trim();
      if (!messageText) return;

      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: messageText,
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsTyping(true);

      try {
        const response = await fetch("/api/chat/support", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: messageText,
            language: chatLanguage,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.response || ERROR_MESSAGES[chatLanguage] || ERROR_MESSAGES["en"],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } catch {
        const assistantMessage: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: ERROR_MESSAGES[chatLanguage] || ERROR_MESSAGES["en"],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [input, chatLanguage]
  );

  const currentLangLabel = SUPPORTED_LANGUAGES.find((l) => l.code === chatLanguage)?.flag || chatLanguage.toUpperCase();

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="pointer-events-auto fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={isOpen ? (CLOSE_LABELS[chatLanguage] || "Close") : "Open chat"}
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h.01" />
            <path d="M12 10h.01" />
            <path d="M16 10h.01" />
          </svg>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={
          "pointer-events-auto fixed bottom-24 right-6 z-[100] flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl transition-all duration-300 ease-in-out " +
          (isOpen
            ? "h-[520px] w-[380px] translate-y-0 opacity-100 sm:w-[400px]"
            : "h-0 w-[380px] translate-y-4 opacity-0 pointer-events-none sm:w-[400px]")
        }
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="8" y1="22" x2="16" y2="22" />
              </svg>
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {HEADER_TITLES[chatLanguage] || HEADER_TITLES["en"]}
              </h3>
              <p className="text-xs text-blue-100 truncate">AI-powered compliance expert</p>
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            {/* Language Selector */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setShowLangDropdown((prev) => !prev)}
                className="flex h-7 items-center gap-1 rounded-md bg-white/20 px-2 text-xs font-medium text-white transition-colors hover:bg-white/30"
                aria-label="Select language"
              >
                <span>{currentLangLabel}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {showLangDropdown && (
                <div className="absolute right-0 top-8 z-[200] max-h-48 w-32 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={
                        "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-gray-50 " +
                        (lang.code === chatLanguage ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-700")
                      }
                    >
                      <span className="text-xs">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/80 transition-colors hover:bg-white/20 hover:text-white"
              aria-label={CLOSE_LABELS[chatLanguage] || "Close"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={
                "mb-3 " +
                (message.role === "user" ? "flex justify-end" : "flex justify-start")
              }
            >
              <div
                className={
                  "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
                  (message.role === "user"
                    ? "bg-blue-600 text-white rounded-br-md"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-md")
                }
              >
                {message.content.split("\n").map((line, i) => (
                  <span key={i}>
                    {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j} className={message.role === "user" ? "text-white" : "text-gray-900"}>
                          {part.slice(2, -2)}
                        </strong>
                      ) : (
                        <span key={j}>{part}</span>
                      )
                    )}
                    {i < message.content.split("\n").length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="mb-3 flex justify-start">
              <div className="rounded-2xl bg-white border border-gray-100 px-4 py-3 text-sm text-gray-500 shadow-sm rounded-bl-md">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "0ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "150ms" }} />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: "300ms" }} />
                  <span className="ml-1 text-xs">{TYPING_LABELS[chatLanguage] || "Typing..."}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex items-center gap-2 border-t border-gray-100 bg-white px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={PLACEHOLDERS[chatLanguage] || "Ask a question..."}
            className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            dir={chatLanguage === "ar" ? "rtl" : "ltr"}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all hover:bg-blue-700 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-sm"
            aria-label={SEND_LABELS[chatLanguage] || "Send"}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
