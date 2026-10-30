import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bot, 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  RotateCcw, 
  ChevronDown, 
  TrendingUp, 
  Package, 
  Store, 
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import assistantService from '../../services/assistant.service';

export default function AgriFairAssistant() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'bot',
      text: `Namaste${user?.name ? ` **${user.name}** ji` : ''}! 🙏 Mai **AgriFair AI Sahayak** hoon.\n\nMai aapko AgriFair ke baare me sab kuch bata sakta hoon:\n• 🌾 **Real Mandi Rates:** Lucknow, Gorakhpur, Delhi, Pune, Patna ityadi ka mandi bhav\n• 🚜 **Farmer Guide:** Fasal kaise list karein aur modal price kaise dekhein\n• 📦 **Order Tracking:** Real-time database timeline stages\n• 👥 **Roles:** Farmer, Wholesaler, Retailer aur Institutional Buyer\n\nAap mujhse Hindi, Hinglish ya English me kuch bhi pooch sakte hain!`,
      suggestions: [
        'Lucknow mandi rate kya hai?',
        'Gorakhpur mandi rate kya hai?',
        'Farmer fasal kaise beche?',
        'Order kaise track karein?'
      ],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [unreadBadge, setUnreadBadge] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = async (textToSend) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const userMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const userContext = user
        ? { name: user.name, role: user.role, email: user.email }
        : null;

      const data = await assistantService.sendMessage(text, userContext);

      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: data?.reply || 'Kshama karein, mai is samay javab nahi de pa raha hoon. Kripya thodi der baad prayas karein.',
        suggestions: data?.suggestions || [
          'Lucknow mandi rate kya hai?',
          'Fasal kaise bechein?',
          'Order kaise track karein?'
        ],
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMessage]);
      if (!isOpen) {
        setUnreadBadge(true);
      }

      // Voice read-out for bot response
      if (data?.reply) {
        const cleanReply = data.reply
          .replace(/\*\*/g, '')
          .replace(/\[(.*?)\]\(.*?\)/g, '$1')
          .split('\n')[0]
          .slice(0, 180);
        window.dispatchEvent(
          new CustomEvent('agrifair:voice_speak', {
            detail: {
              hindiText: cleanReply,
              romanText: cleanReply,
              key: `bot-reply-${Date.now()}`
            }
          })
        );
      }
    } catch (err) {
      const errorMessage = {
        id: `bot-err-${Date.now()}`,
        sender: 'bot',
        text: `Server se connect karne me dikkat aayi: ${err.message || 'Network error'}. Kripya dobara try karein.`,
        suggestions: ['Lucknow mandi rate kya hai?', 'AgriFair kya hai?'],
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'bot',
        text: `Namaste! Chat reset ho gayi hai. Mai **AgriFair AI Sahayak** hoon. Aap Mandi Bhav, Fasal listing, ya Order status ke baare me pooch sakte hain.`,
        suggestions: [
          'Lucknow mandi rate kya hai?',
          'Gorakhpur mandi rate kya hai?',
          'Farmer fasal kaise beche?',
          'Order kaise track karein?'
        ],
        timestamp: new Date()
      }
    ]);
  };

  // Helper to format bot markdown text with bold and links
  const renderFormattedText = (text) => {
    // Process markdown links [text](url) and **bold**
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      // Split line by bold patterns
      const parts = line.split(/(\*\*.*?\*\*|\[.*?\]\(.*?\))/g);

      return (
        <span key={lineIdx} className="block min-h-[1.25rem]">
          {parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={pIdx} className="font-semibold text-slate-900">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
              return (
                <em key={pIdx} className="italic text-slate-600">
                  {part.slice(1, -1)}
                </em>
              );
            }
            const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
            if (linkMatch) {
              const [, label, href] = linkMatch;
              const isInternal = href.startsWith('/');
              return (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => {
                    if (isInternal) {
                      navigate(href);
                    } else {
                      window.open(href, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-900 font-medium underline underline-offset-2 mx-1"
                >
                  {label}
                  <ExternalLink className="w-3 h-3 inline" />
                </button>
              );
            }
            return part;
          })}
        </span>
      );
    });
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <div className="relative group">
            {/* Tooltip badge */}
            <div className="absolute right-0 bottom-full mb-3 hidden group-hover:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap animate-fade-in pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>AgriFair AI Sahayak • Ask anything</span>
              <div className="absolute top-full right-5 border-4 border-transparent border-t-slate-900" />
            </div>

            {/* Pulse rings */}
            <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping opacity-75 duration-1000" />
            
            <button
              id="agrifair-assistant-toggle"
              type="button"
              onClick={() => {
                setIsOpen(true);
                setUnreadBadge(false);
              }}
              aria-label="Open AgriFair AI Assistant"
              className="relative flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-full shadow-xl shadow-emerald-900/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-emerald-400/40"
            >
              <div className="relative">
                <Bot className="w-6 h-6 text-white" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 border-2 border-emerald-800 rounded-full" />
              </div>
              <span className="font-semibold text-sm hidden sm:inline tracking-wide">
                AgriFair Sahayak
              </span>

              {unreadBadge && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 text-[10px] text-white font-bold items-center justify-center">
                    1
                  </span>
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Chat Window Dialog */}
      {isOpen && (
        <div 
          role="dialog"
          aria-label="AgriFair AI Assistant Chat Window"
          className="fixed bottom-6 right-6 z-50 w-[94vw] sm:w-[440px] h-[580px] max-h-[85vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-800 text-white px-4 py-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Bot className="w-5 h-5 text-emerald-200" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-emerald-900 rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-sm tracking-wide">AgriFair Sahayak</h3>
                  <span className="px-1.5 py-0.2 text-[10px] bg-emerald-500/30 text-emerald-200 rounded font-mono border border-emerald-400/30">
                    Live APMC
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/90">
                  Government & Regional Mandi Connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetChat}
                title="Reset Chat"
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Minimize"
                className="p-1.5 text-emerald-100 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Category Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex items-center gap-2 overflow-x-auto text-[11px] no-scrollbar">
            <button
              type="button"
              onClick={() => handleSend('Lucknow mandi rate kya hai?')}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 shadow-xs whitespace-nowrap font-medium transition-colors"
            >
              <TrendingUp className="w-3 h-3 text-emerald-600" />
              <span>Mandi Rates</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('Farmer apni fasal kaise bechein?')}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 shadow-xs whitespace-nowrap font-medium transition-colors"
            >
              <Store className="w-3 h-3 text-emerald-600" />
              <span>Sell Produce</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('AgriFair me order kaise track karein?')}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 shadow-xs whitespace-nowrap font-medium transition-colors"
            >
              <Package className="w-3 h-3 text-emerald-600" />
              <span>Track Order</span>
            </button>
            <button
              type="button"
              onClick={() => handleSend('AgriFair me kaun-kaun se role hain?')}
              className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-full border border-slate-200 shadow-xs whitespace-nowrap font-medium transition-colors"
            >
              <HelpCircle className="w-3 h-3 text-emerald-600" />
              <span>Platform Guide</span>
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-slate-50/50 to-white">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-xs ${
                      isUser
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-tr-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs'
                    }`}
                  >
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-1">
                        {renderFormattedText(msg.text)}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>

                  {/* Suggestion Chips */}
                  {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[95%]">
                      {msg.suggestions.map((suggestion, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleSend(suggestion)}
                          className="text-[11px] px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200 transition-colors text-left"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 text-xs px-2 py-1 bg-white border border-slate-200 rounded-xl w-fit shadow-xs">
                <Bot className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>AgriFair Sahayak live data check kar raha hai...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Box Footer */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                id="agrifair-assistant-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Poochiye (e.g. Lucknow rate, fasal kaise beche)..."
                disabled={isLoading}
                className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                id="agrifair-assistant-submit"
                disabled={isLoading || !inputValue.trim()}
                className="p-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-xs transition-colors"
                title="Send Message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-slate-400">
              <span>⚡ Real APMC & MongoDB Connected</span>
              <span>Hindi / Hinglish / English</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
