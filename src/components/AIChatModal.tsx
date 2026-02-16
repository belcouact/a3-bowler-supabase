import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles, FileText, TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateAIContext } from '../services/aiService';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, initialPrompt }) => {
  const { bowlers, a3Cases, selectedModel } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedPrompt = useRef(false);
  
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 300 && newWidth < 800) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);


  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const context = generateAIContext(bowlers, a3Cases);
      const systemMessage: Message = {
        role: 'system',
        content: `You are an AI assistant for the Metric Bowler & A3 Problem Solving application. 
        Here is the current data in the application: ${context}.
        Answer the user's questions based on this data. Be concise and helpful.
        When a question involves a specific metric, look for any A3 cases whose linkedMetricIds include that metric's id.
        If there are completed A3 cases linked to the metric, briefly comment on whether performance appears to have improved since those A3s were closed and suggest the next step (for example: sustain, follow-up A3, or additional countermeasures).`
      };

      const historyMessages = messages.filter(m => m.role !== 'system');
      const apiMessages = [systemMessage, ...historyMessages, userMessage];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: false
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantContent = data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || "Sorry, I couldn't generate a response.";

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);

    } catch (error) {
      console.error('AI Chat Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, there was an error communicating with the AI. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => sendMessage(input);

  useEffect(() => {
    if (isOpen && initialPrompt && !hasProcessedPrompt.current) {
        sendMessage(initialPrompt);
        hasProcessedPrompt.current = true;
    }
    if (!isOpen) {
        hasProcessedPrompt.current = false;
        setMessages([]); 
    }
  }, [isOpen, initialPrompt]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="fixed inset-y-0 right-0 flex max-w-full pointer-events-none">
          <div 
            ref={sidebarRef}
            style={{ width: `${width}px` }}
            className="pointer-events-auto relative h-full bg-white shadow-2xl flex flex-col transform transition-transform ease-in-out duration-300"
          >
            {/* Resize Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-brand-500/50 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsResizing(true);
                }}
            >
              <div className="h-8 w-0.5 bg-slate-300 rounded-full group-hover:bg-brand-500 transition-colors" />
            </div>

            <div className="flex h-full flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-brand-50 rounded-lg border border-brand-100">
                      <Bot className="w-4 h-4 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-800" id="modal-title">
                        AI Coach
                      </h2>
                      <div className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <p className="text-[10px] text-slate-500 font-medium">Online</p>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close panel</span>
                    <X className="h-4 w-4" />
                  </button>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-slate-50 scroll-smooth custom-scrollbar">
                 {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6 text-slate-500">
                        <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-3">
                          <Sparkles className="w-5 h-5 text-brand-500" />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 mb-1">How can I help?</h3>
                        <p className="text-xs text-slate-500 max-w-[240px] mx-auto mb-6 leading-relaxed">
                          I can analyze your metrics, suggest countermeasures, or draft A3 content.
                        </p>
                        
                        <div className="flex flex-col gap-2 w-full max-w-xs">
                          <button 
                            onClick={() => sendMessage("What are my top failing metrics?")}
                            className="text-xs text-left px-3 py-2 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg border border-slate-200 hover:border-brand-200 transition-all shadow-sm flex items-center justify-between group"
                          >
                            <span>Top failing metrics?</span>
                            <TrendingUp className="w-3 h-3 text-slate-300 group-hover:text-brand-400 transition-colors" />
                          </button>
                          <button 
                            onClick={() => sendMessage("Summarize my open A3 cases")}
                            className="text-xs text-left px-3 py-2 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-lg border border-slate-200 hover:border-brand-200 transition-all shadow-sm flex items-center justify-between group"
                          >
                            <span>Summarize open A3 cases</span>
                            <FileText className="w-3 h-3 text-slate-300 group-hover:text-brand-400 transition-colors" />
                          </button>
                        </div>
                    </div>
                 )}
                 
                 <div className="space-y-4">
                 {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-2`}>
                          {msg.role !== 'user' && (
                            <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-1">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                          )}

                          <div className={`rounded-2xl px-4 py-2.5 shadow-sm text-sm leading-relaxed ${
                              msg.role === 'user' 
                              ? 'bg-brand-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-700 border border-slate-200 rounded-tl-none'
                          }`}>
                              {msg.role === 'user' ? (
                                  <div className="whitespace-pre-wrap">{msg.content}</div>
                              ) : (
                                  <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:text-slate-800 prose-headings:font-bold prose-strong:text-slate-800 prose-ul:my-2 prose-li:my-0.5">
                                    <MarkdownRenderer content={msg.content} />
                                  </div>
                              )}
                          </div>
                        </div>
                    </div>
                 ))}
                 
                 {isLoading && (
                    <div className="flex justify-start w-full animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex max-w-[85%] flex-row gap-2">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center flex-shrink-0 mt-1">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-2.5 shadow-sm flex items-center gap-2">
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" />
                              <span className="text-xs font-medium text-slate-500">Thinking...</span>
                          </div>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} className="h-2" />
                 </div>
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-slate-100">
                <div className="relative flex items-end gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-50 transition-all">
                    <textarea
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm resize-none py-2 px-2 max-h-32 min-h-[40px]"
                        placeholder="Type a message..."
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="mb-0.5 mr-0.5 p-1.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm active:scale-95 flex items-center justify-center shrink-0"
                    >
                        <Send className="h-3.5 w-3.5" />
                    </button>
                </div>
                <p className="text-[9px] text-center text-slate-400 mt-2 font-medium">
                  AI can make mistakes. Verify important information.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
