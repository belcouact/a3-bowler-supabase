import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles, Database, Zap, FileText, TrendingUp } from 'lucide-react';
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
  
  // Resizable Sidebar State
  const [width, setWidth] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Resize Logic
  const startResizing = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  useEffect(() => {
    const stopResizing = () => setIsResizing(false);
    const resize = (e: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - e.clientX;
        if (newWidth > 400 && newWidth < window.innerWidth - 50) {
          setWidth(newWidth);
        }
      }
    };

    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
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
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div 
            ref={sidebarRef}
            className="pointer-events-auto relative h-full transform transition-none ease-in-out bg-white shadow-2xl flex flex-col"
            style={{ width: `${width}px` }}
          >
            {/* Resize Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1.5 cursor-ew-resize hover:bg-brand-400/50 transition-colors z-50 flex items-center justify-center group"
                onMouseDown={startResizing}
            >
                <div className="h-8 w-1 bg-slate-300 rounded-full group-hover:bg-brand-400 transition-colors" />
            </div>

            <div className="flex h-full flex-col overflow-hidden bg-white">
              {/* Header */}
              <div className="bg-gradient-to-r from-brand-600 to-accent-600 px-6 py-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm border border-white/10">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight" id="modal-title">
                        AI Coach
                      </h2>
                      <p className="text-xs text-brand-50 font-medium opacity-90">
                        Analyzing your Bowler metrics & A3 cases
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close panel</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 flex flex-col p-6 overflow-y-auto bg-slate-50 scroll-smooth custom-scrollbar">
                 {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-forwards max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-white rounded-2xl shadow-lg shadow-brand-100 flex items-center justify-center mb-6 ring-1 ring-slate-100">
                          <Bot className="w-8 h-8 text-brand-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-6">AI Coach Assistant</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8 text-left">
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                                    <Database className="w-4 h-4 text-blue-500"/> What it knows
                                </h4>
                                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                                    <li>Your Bowler metrics and performance trends</li>
                                    <li>Details of your A3 problem-solving cases</li>
                                    <li>Linked relationships between metrics and cases</li>
                                </ul>
                            </div>
                            
                            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2 text-sm">
                                    <Zap className="w-4 h-4 text-amber-500"/> What it can do
                                </h4>
                                <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed">
                                    <li>Analyze performance trends and outliers</li>
                                    <li>Summarize A3 cases and their status</li>
                                    <li>Suggest countermeasures for failing metrics</li>
                                    <li>Draft A3 content based on metric data</li>
                                </ul>
                            </div>
                        </div>

                        <p className="text-sm text-slate-400 font-medium mb-3">Try asking...</p>
                        
                        <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                          <button 
                            onClick={() => sendMessage("What are my top failing metrics?")}
                            className="text-xs text-left px-4 py-3 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm group flex items-center justify-between"
                          >
                            <span>What are my top failing metrics?</span>
                            <TrendingUp className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                          <button 
                            onClick={() => sendMessage("Summarize my open A3 cases")}
                            className="text-xs text-left px-4 py-3 bg-white hover:bg-brand-50 hover:text-brand-700 text-slate-600 rounded-xl border border-slate-200 hover:border-brand-200 transition-all shadow-sm group flex items-center justify-between"
                          >
                            <span>Summarize my open A3 cases</span>
                            <FileText className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        </div>
                    </div>
                 )}
                 
                 <div className="space-y-6">
                 {messages.map((msg, idx) => (
                    <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`flex max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            msg.role === 'user' 
                              ? 'bg-brand-100 text-brand-600' 
                              : 'bg-accent-100 text-accent-600'
                          }`}>
                            {msg.role === 'user' ? <div className="text-xs font-bold">You</div> : <Bot className="w-4 h-4" />}
                          </div>

                          <div className={`rounded-2xl px-5 py-4 shadow-sm text-sm leading-relaxed ${
                              msg.role === 'user' 
                              ? 'bg-brand-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-slate-100'
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
                        <div className="flex max-w-[85%] flex-row gap-3">
                          <div className="w-8 h-8 rounded-full bg-accent-100 text-accent-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-4 h-4" />
                          </div>
                          <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-none px-5 py-4 shadow-sm flex items-center gap-3">
                              <Loader2 className="w-4 h-4 animate-spin text-accent-500" />
                              <span className="text-sm font-medium text-slate-500">Analyzing data...</span>
                          </div>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} className="h-4" />
                 </div>
              </div>

              {/* Input Area */}
              <div className="p-4 bg-white border-t border-slate-100">
                <div className="relative flex items-end gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 focus-within:border-brand-300 focus-within:ring-4 focus-within:ring-brand-50 transition-all">
                    <textarea
                        className="flex-1 bg-transparent border-0 focus:ring-0 text-slate-800 placeholder:text-slate-400 text-sm resize-none py-2.5 px-3 max-h-32 min-h-[44px]"
                        placeholder="Ask a question about your metrics..."
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
                        className="mb-1 mr-1 p-2 rounded-xl bg-brand-600 text-white hover:bg-brand-700 disabled:bg-slate-200 disabled:text-slate-400 transition-all shadow-sm active:scale-95 flex items-center justify-center"
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-3 font-medium">
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
