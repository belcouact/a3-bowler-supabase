import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Send, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const aiCoachMemory: Record<string, Message[]> = {};

const AICoach = () => {
  const { id } = useParams();
  const { a3Cases, bowlers, selectedModel } = useApp();
  const currentCase = a3Cases.find(c => c.id === id);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!currentCase) return;
    const key = currentCase.id;
    const stored = aiCoachMemory[key];
    if (stored && stored.length > 0) {
      setMessages(stored);
      return;
    }
    const titleText = currentCase.title || 'this A3';
    const intro: Message = {
      role: 'assistant',
      content:
        `I am your AI coach focusing specifically on this A3: **${titleText}**.\n\n` +
        `I already know the problem statement, analysis, and plan that you have entered.\n` +
        `Ask me anything to help you think through root causes, risks, action plans, or follow-up.\n\n` +
        `Examples:\n` +
        `- "What are the top risks or uncertainties in this A3?"\n` +
        `- "How can we strengthen the action plan using industry best practices?"\n` +
        `- "What should we watch in the data to confirm this A3 is working?"`,
    };
    setMessages([intro]);
  }, [currentCase]);

  useEffect(() => {
    if (!currentCase) return;
    aiCoachMemory[currentCase.id] = messages;
  }, [currentCase, messages]);

  const buildContext = (history: Message[]) => {
    if (!currentCase) return '';

    const linkedIds = currentCase.linkedMetricIds || [];
    const linkedMetrics: {
      bowlerName: string;
      bowlerGroup: string;
      metric: {
        id: string;
        name: string;
        definition: string;
        owner: string;
        scope: string;
        attribute: string;
        targetMeetingRule?: 'gte' | 'lte' | 'within_range';
        monthlyData?: Record<string, { target: string; actual: string; targetNote?: string; actualNote?: string }>;
      };
    }[] = [];

    bowlers.forEach(b => {
      const metrics = b.metrics || [];
      metrics.forEach(m => {
        if (linkedIds.includes(m.id)) {
          linkedMetrics.push({
            bowlerName: b.name,
            bowlerGroup: b.group || 'Ungrouped',
            metric: {
              id: m.id,
              name: m.name,
              definition: m.definition,
              owner: m.owner,
              scope: m.scope,
              attribute: m.attribute,
              targetMeetingRule: m.targetMeetingRule,
              monthlyData: m.monthlyData,
            },
          });
        }
      });
    });

    const sanitizedCase: any = { ...currentCase };
    delete sanitizedCase.mindMapNodes;
    delete sanitizedCase.dataAnalysisImages;
    delete sanitizedCase.resultImages;
    delete sanitizedCase.dataAnalysisCanvasHeight;
    delete sanitizedCase.resultCanvasHeight;

    const conversation = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .map(m => ({
        role: m.role,
        content: m.content,
      }));

    return JSON.stringify({
      a3Case: sanitizedCase,
      linkedMetrics,
      conversation,
    });
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading || !currentCase) return;

    const userMessage: Message = { role: 'user', content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const historyMessages = newMessages.filter(m => m.role !== 'system');
      const context = buildContext(historyMessages);
      const systemMessage: Message = {
        role: 'system',
        content: `You are an AI coach helping the owner of a single A3 case.

Here is the JSON context for this A3, including any linked metrics:
${context}

Your job is to answer any questions the user has about this A3 and its related metrics.
Examples include: clarifying the problem, commenting on data and analysis, suggesting root-cause checks, highlighting risks or uncertainties, advising on action plan design and prioritization, or discussing follow-up and sustainment.

Keep your answers specific, practical, and focused on this A3 only.`,
      };

      const apiMessages = [systemMessage, ...historyMessages];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: apiMessages,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const assistantContent =
        data.choices?.[0]?.message?.content ||
        data.choices?.[0]?.delta?.content ||
        "Sorry, I couldn't generate a response.";

      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, there was an error communicating with the AI coach. Please try again later.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
    }
  };

  if (!currentCase) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600" />
          <p className="mt-4 text-slate-500 font-medium animate-pulse">Loading coaching session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[500px] space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex-1 flex flex-col rounded-2xl border border-slate-200 bg-slate-50/30 overflow-hidden shadow-sm">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-brand-600 text-white rounded-br-none shadow-brand-200/50'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.content}</div>
                ) : (
                  <div className="text-sm leading-relaxed prose prose-slate prose-sm max-w-none">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start animate-pulse">
              <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3.5 shadow-sm rounded-bl-none flex items-center gap-3">
                <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                <span className="text-sm text-slate-500 font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              className="flex-1 bg-slate-50 rounded-xl border-slate-200 text-sm py-2.5 px-4 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all placeholder-slate-400"
              placeholder="Ask the coach about this A3..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-brand-600 text-white hover:bg-brand-700 transition-all shadow-md hover:shadow-lg disabled:bg-slate-300 disabled:shadow-none shrink-0"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {!currentCase.problemStatement && (
        <div className="rounded-xl bg-accent-50 border border-accent-100 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
          <p className="text-sm text-accent-900 font-medium">
            Tip: The coach works best when the problem statement, analysis, and action plan are filled in.
          </p>
        </div>
      )}
    </div>
  );
};

export default AICoach;
