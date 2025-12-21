import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, Loader2, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { MarkdownRenderer } from './MarkdownRenderer';
import { generateAIContext } from '../services/aiService';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
  selectedModel: string;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export const AIChatModal: React.FC<AIChatModalProps> = ({ isOpen, onClose, initialPrompt, selectedModel }) => {
  const { bowlers, a3Cases } = useApp();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasProcessedPrompt = useRef(false);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        Answer the user's questions based on this data. Be concise and helpful.`
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
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div className="pointer-events-auto w-screen max-w-md">
            <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
              <div className="bg-blue-600 px-4 py-6 sm:px-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white flex items-center" id="modal-title">
                    <Sparkles className="w-5 h-5 mr-2" />
                    AI Assistant
                  </h2>
                  <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        className="rounded-md text-blue-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                        onClick={onClose}
                    >
                        <span className="sr-only">Close panel</span>
                        <X className="h-6 w-6" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-blue-200">
                  Ask questions about your metrics and A3 cases.
                </p>
              </div>

              <div className="flex-1 flex flex-col p-4 overflow-y-auto bg-gray-50">
                 {messages.length === 0 && (
                    <div className="text-center text-gray-500 mt-10">
                        <Bot className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Hello! I have access to your current Bowler and A3 data.</p>
                        <p className="text-sm mt-2">Try asking: "What is the trend for Safety metric?" or "Summarize my open A3 cases".</p>
                    </div>
                 )}
                 
                 {messages.map((msg, idx) => (
                    <div key={idx} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                            msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                        }`}>
                            {msg.role === 'user' ? (
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                                <MarkdownRenderer content={msg.content} />
                            )}
                        </div>
                    </div>
                 ))}
                 
                 {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm rounded-bl-none flex items-center">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-2" />
                            <span className="text-sm text-gray-500">Thinking...</span>
                        </div>
                    </div>
                 )}
                 <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 px-4 py-4 bg-white">
                <div className="flex items-center space-x-3">
                    <input
                        type="text"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                        placeholder="Type your message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
