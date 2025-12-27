import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Bot, Loader2, Send, AlertTriangle, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { MarkdownRenderer } from '../../components/MarkdownRenderer';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

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

  const buildContext = () => {
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

    return JSON.stringify({
      a3Case: sanitizedCase,
      linkedMetrics,
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
      const context = buildContext();
      const systemMessage: Message = {
        role: 'system',
        content: `You are an AI coach helping the owner of a single A3 case.

Here is the JSON context for this A3, including any linked metrics:
${context}

Use this information to:
- highlight top risks or uncertainties
- suggest which actions to prioritize and why
- recommend additional analysis, experiments, or follow-up

Be specific and practical, and keep answers focused on this A3 only.`,
      };

      const historyMessages = newMessages.filter(m => m.role !== 'system');
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
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="mt-3 text-base font-medium text-gray-700">
            Loading A3 data for coaching...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[480px] space-y-4">
      <div>
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Sparkles className="h-5 w-5 text-indigo-500 mr-2" />
          AI Coach
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Ask for guidance about risks, priorities, and next steps for this A3.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Coaching for:{' '}
          <span className="font-medium text-gray-700">{currentCase.title || 'Untitled A3'}</span>
        </p>
      </div>

      <div className="flex-1 flex flex-col rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
        <div className="flex-1 p-4 overflow-y-auto">
          {messages.length === 0 && !isLoading && (
            <div className="text-center text-gray-500 mt-6">
              <Bot className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">
                I know the problem statement, analysis, and plan for this A3.
              </p>
              <p className="text-xs mt-2">
                Try asking: &quot;What are the top risks or uncertainties here?&quot; or
                &quot;Which actions should we prioritize?&quot;
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-4 py-3 shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {msg.role === 'user' ? (
                  <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
                ) : (
                  <div className="text-sm">
                    <MarkdownRenderer content={msg.content} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start mb-4">
              <div className="bg-white border border-gray-200 rounded-lg px-4 py-3 shadow-sm rounded-bl-none flex items-center">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-600 mr-2" />
                <span className="text-sm text-gray-500">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-200 bg-white px-4 py-3">
          <div className="flex items-center space-x-3">
            <input
              type="text"
              className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
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
              className="inline-flex items-center p-2 border border-transparent rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {!currentCase.problemStatement && (
        <div className="mt-1 rounded-md bg-yellow-50 border border-yellow-200 px-3 py-2 text-xs text-yellow-800 flex items-start">
          <AlertTriangle className="h-4 w-4 mr-2 mt-0.5" />
          <p>
            Tip: The coach works best when the problem statement, analysis, and action plan are
            filled in.
          </p>
        </div>
      )}
    </div>
  );
};

export default AICoach;

