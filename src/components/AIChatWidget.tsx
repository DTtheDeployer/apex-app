'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface AIChatWidgetProps {
  userId: string
}

export default function AIChatWidget({ userId }: AIChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input
    if (!text.trim() || isLoading) return

    const userMessage: Message = { 
      role: 'user', 
      content: text,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, userId }),
      })

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, I\'m having trouble connecting. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const quickQuestions = [
    { icon: '🎯', text: 'Why this position?' },
    { icon: '📊', text: 'How am I doing?' },
    { icon: '⚠️', text: 'Current risk?' },
    { icon: '🌊', text: 'Market regime?' },
  ]

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 group"
        aria-label="Open APEX AI Chat"
      >
        <div className={`
          relative w-14 h-14 rounded-full 
          bg-gradient-to-br from-emerald-400 to-emerald-600
          shadow-lg shadow-emerald-500/30
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:scale-110 hover:shadow-xl hover:shadow-emerald-500/40
          ${isOpen ? 'rotate-90 scale-95' : ''}
        `}>
          {/* Pulse ring */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-30" />
          )}
          
          {/* Icon */}
          <svg 
            className={`w-6 h-6 text-white transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            )}
          </svg>
        </div>
      </button>

      {/* Chat Panel */}
      <div className={`
        fixed bottom-24 right-6 z-50
        w-[380px] max-h-[600px]
        bg-[#0a0f0a] border border-emerald-500/20
        rounded-2xl shadow-2xl shadow-black/50
        flex flex-col overflow-hidden
        transition-all duration-300 ease-out origin-bottom-right
        ${isOpen 
          ? 'opacity-100 scale-100 translate-y-0' 
          : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
        }
      `}>
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/50 to-emerald-800/30 px-5 py-4 border-b border-emerald-500/20">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>
              {/* Online indicator */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-[#0a0f0a]" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-base">APEX AI</h3>
              <p className="text-emerald-400/80 text-xs font-medium">
                {isLoading ? 'Thinking...' : 'Online • Trading Assistant'}
              </p>
            </div>
            
            {/* Close button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] scrollbar-thin scrollbar-thumb-emerald-500/20 scrollbar-track-transparent">
          {/* Welcome message */}
          {messages.length === 0 && !isLoading && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tl-md px-4 py-3">
                  <p className="text-gray-200 text-sm leading-relaxed">
                    Hey! 👋 I&apos;m <span className="text-emerald-400 font-medium">APEX AI</span>, your trading assistant. Ask me about your positions, strategies, or market conditions.
                  </p>
                </div>
                <p className="text-gray-500 text-[10px] mt-1.5 ml-1">Just now</p>
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex gap-3 animate-slideUp ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Avatar */}
              {msg.role === 'assistant' && (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
              )}
              
              <div className={`flex-1 ${msg.role === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className={`
                  px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-emerald-500 text-white rounded-tr-md shadow-lg shadow-emerald-500/20' 
                    : 'bg-emerald-500/10 border border-emerald-500/20 text-gray-200 rounded-tl-md'
                  }
                `}>
                  {msg.content}
                </div>
                <p className={`text-gray-500 text-[10px] mt-1.5 ${msg.role === 'user' ? 'mr-1' : 'ml-1'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex gap-3 animate-fadeIn">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex-shrink-0 flex items-center justify-center shadow-md">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex gap-1.5 items-center h-5">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="px-4 pb-3">
            <p className="text-gray-500 text-xs mb-2 font-medium">Quick questions:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q.text)}
                  disabled={isLoading}
                  className="
                    flex items-center gap-2 px-3 py-2
                    bg-white/5 hover:bg-emerald-500/20 
                    border border-white/10 hover:border-emerald-500/30
                    rounded-xl text-xs text-gray-300 hover:text-emerald-300
                    transition-all duration-200 text-left
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  <span className="text-base">{q.icon}</span>
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-emerald-500/20 bg-black/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about your trades..."
              disabled={isLoading}
              className="
                flex-1 bg-white/5 border border-white/10 
                rounded-xl px-4 py-3
                text-white text-sm placeholder-gray-500
                focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20
                transition-all duration-200
                disabled:opacity-50
              "
            />
            <button
              onClick={() => sendMessage()}
              disabled={isLoading || !input.trim()}
              className="
                w-12 h-12 rounded-xl
                bg-gradient-to-br from-emerald-400 to-emerald-600
                hover:from-emerald-300 hover:to-emerald-500
                disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed
                flex items-center justify-center
                shadow-lg shadow-emerald-500/20
                transition-all duration-200
                hover:scale-105 active:scale-95
              "
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Custom animations */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 2px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.4);
        }
      `}</style>
    </>
  )
}