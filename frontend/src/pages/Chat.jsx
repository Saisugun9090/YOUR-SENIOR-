import { useState, useRef, useEffect, useCallback } from 'react'
import { api } from '../api/client'
import ChatMessage from '../components/ChatMessage'

const SUGGESTIONS = [
  'What is our leave and time-off policy?',
  'How do I submit an expense report?',
  'Who should I contact for IT support?',
  'What are the steps for onboarding a new team member?',
]

function LoadingDots() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-navy-700 border border-navy-400 rounded-2xl rounded-tl-sm px-4 py-3.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 bg-gold-500 rounded-full animate-bounce" />
        </div>
      </div>
    </div>
  )
}

function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 select-none">
      {/* Logo */}
      <div className="w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/30
                      flex items-center justify-center mb-5">
        <span className="text-gold-500 text-2xl font-bold tracking-wide">YS</span>
      </div>

      <h1 className="text-2xl font-semibold text-slate-100 mb-2">Your Senior</h1>
      <p className="text-slate-500 text-sm text-center max-w-sm mb-10">
        Ask anything about your company's internal documents.
        Every answer cites its source — you'll always know where it came from.
      </p>

      {/* Suggestion cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-xl">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="text-left px-4 py-3 rounded-xl border border-navy-400 bg-navy-700
                       hover:border-gold-500/40 hover:bg-navy-600
                       text-slate-400 hover:text-slate-200
                       text-sm transition-colors duration-150"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Chat() {
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)

  const bottomRef   = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = useCallback(async (text) => {
    const question = (text ?? input).trim()
    if (!question || loading) return

    setInput('')
    setError(null)
    setLoading(true)

    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: question }])

    try {
      const res = await api.query(question)
      setMessages(prev => [
        ...prev,
        {
          id:               res.query_id,
          role:             'assistant',
          content:          res.answer,
          confidence_tier:  res.confidence_tier,
          confidence_score: res.confidence_score,
          sources:          res.sources ?? [],
        },
      ])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setTimeout(() => textareaRef.current?.focus(), 50)
    }
  }, [input, loading])

  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const handleSuggestion = (s) => {
    setInput(s)
    setTimeout(() => sendMessage(s), 0)
  }

  const canSend = input.trim().length > 0 && !loading

  return (
    <div className="flex flex-col h-screen bg-navy-900">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="shrink-0 px-6 py-4 border-b border-navy-400
                         flex items-center justify-between">
        <div>
          <h2 className="text-slate-100 font-semibold text-sm">Chat</h2>
          <p className="text-slate-600 text-xs mt-0.5">
            Answers grounded in your company documents
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-600 hover:text-slate-400
                       transition-colors px-3 py-1.5 rounded-lg hover:bg-navy-600"
          >
            New chat
          </button>
        )}
      </header>

      {/* ── Messages ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 && !loading ? (
          <WelcomeScreen onSuggestion={handleSuggestion} />
        ) : (
          <div className="px-6 py-6 space-y-5 max-w-3xl mx-auto w-full">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {loading && <LoadingDots />}
            {error && (
              <div className="flex justify-center animate-fade-in">
                <div className="px-4 py-2.5 rounded-xl bg-red-400/10 border border-red-400/25
                                text-red-400 text-xs">
                  {error}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Input bar ────────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-4 border-t border-navy-400 bg-navy-900">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-end gap-3 bg-navy-700 border border-navy-400
                          rounded-2xl px-4 py-3 focus-within:border-gold-500/50
                          transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Your Senior anything…"
              rows={1}
              className="flex-1 bg-transparent text-slate-200 text-sm placeholder-slate-600
                         resize-none outline-none leading-relaxed max-h-40 py-0.5"
              style={{ minHeight: '1.5rem' }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!canSend}
              className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center
                          transition-all duration-150
                          ${canSend
                            ? 'bg-gold-500 hover:bg-gold-400 text-navy-900'
                            : 'bg-navy-500 text-slate-600 cursor-not-allowed'
                          }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                      d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p className="text-slate-700 text-xs mt-1.5 text-center">
            ⌘ Return to send · Sources collapse by default
          </p>
        </div>
      </div>
    </div>
  )
}
