import { useState, useEffect } from 'react';
import { X, Info, Lightbulb, Sparkles, FileText, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface MindmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

export const MindmapModal = ({ isOpen, onClose, mode }: MindmapModalProps) => {
  const {
    dashboardMarkdown,
    dashboardTitle,
    updateDashboardMarkdown,
    dashboardMindmaps,
    activeMindmapId,
    selectedModel,
    deleteMindmap
  } = useApp();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [text, setText] = useState('');
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>(mode === 'create' ? 'ai' : 'manual');
  const [aiIdea, setAiIdea] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit') {
        setTitle(dashboardTitle || '');
        setText(dashboardMarkdown || '');
        const active = dashboardMindmaps.find(m => m.id === activeMindmapId);
        setDescription(active?.description || '');
        setActiveTab('manual');
      } else {
        setTitle('');
        setDescription('');
        setText('');
        setAiIdea('');
        setActiveTab('ai');
      }
      setAiError(null);
      setIsGeneratingAI(false);
    }
  }, [isOpen, dashboardMarkdown, dashboardTitle, mode, dashboardMindmaps, activeMindmapId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDashboardMarkdown(text || '', title || undefined, {
      createNew: mode === 'create',
      description
    });
    onClose();
  };

  const handleDelete = () => {
    if (!activeMindmapId) return;
    if (!window.confirm('Are you sure you want to delete this mindmap?')) return;
    deleteMindmap(activeMindmapId);
    onClose();
  };

  const handleGenerateAIMap = async () => {
    const idea = aiIdea.trim();
    if (!idea) {
      setAiError('Please enter an idea or topic for the mindmap.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const messages = [
        {
          role: 'system',
          content:
            'You are an expert at structuring ideas as markdown mindmaps. Always respond with JSON only, no extra text.'
        },
        {
          role: 'user',
          content:
            `Create a markdown mindmap for this idea:\n\n` +
            `"${idea}"\n\n` +
            'Requirements:\n' +
            '- Use a clear main heading for the central topic.\n' +
            '- Use nested lists and headings to show hierarchy.\n' +
            '- You may use markdown formatting like **bold**, *italic*, inline code, etc., as appropriate.\n' +
            '- Output rich but concise structure suitable for markmap.\n\n' +
            'Return JSON ONLY with this shape:\n' +
            '{ "title": "short title", "description": "optional description", "markdown": "# main heading..."}'
        }
      ];

      const response = await fetch('https://multi-model-worker.study-llm.me/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: selectedModel,
          messages,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate mindmap');
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content || '';
      content = content.replace(/```json/gi, '').replace(/```/g, '').trim();

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        throw new Error('Invalid AI response format');
      }

      const markdown = typeof parsed.markdown === 'string' ? parsed.markdown : '';
      let newTitle = typeof parsed.title === 'string' ? parsed.title.trim() : '';
      const newDescription = typeof parsed.description === 'string' ? parsed.description.trim() : '';

      if (!newTitle && markdown) {
        const lines = markdown.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('#')) {
            newTitle = trimmed.replace(/^#+\s*/, '');
            break;
          }
        }
      }

      setTitle(newTitle || 'Mindmap');
      setDescription(newDescription);
      setText(markdown);
      setActiveTab('manual');
    } catch (error: any) {
      setAiError(error?.message || 'Failed to generate mindmap. Please try again.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto" aria-labelledby="mindmap-modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" />
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full animate-in fade-in zoom-in-95 duration-200 border border-white/20 ring-1 ring-black/5">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm border border-white/10 shadow-inner">
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight" id="mindmap-modal-title">
                    {mode === 'create' ? 'New Mindmap' : 'Edit Mindmap'}
                  </h3>
                  <p className="text-indigo-100 text-xs font-medium opacity-90 mt-0.5">
                    {mode === 'create' ? 'Brainstorm ideas with AI assistance' : 'Refine your mindmap structure'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="bg-white px-6 py-6">
            <div className="flex justify-center mb-6">
              <div className="inline-flex rounded-xl bg-slate-100 p-1.5 shadow-inner ring-1 ring-slate-200">
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  className={
                    activeTab === 'ai'
                      ? 'inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 transition-all'
                      : 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all'
                  }
                >
                  <Sparkles className={`w-4 h-4 mr-2 ${activeTab === 'ai' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  AI Assistant
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className={
                    activeTab === 'manual'
                      ? 'inline-flex items-center px-4 py-2 text-sm font-bold rounded-lg bg-white text-indigo-600 shadow-sm ring-1 ring-black/5 transition-all'
                      : 'inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-all'
                  }
                >
                  <FileText className={`w-4 h-4 mr-2 ${activeTab === 'manual' ? 'text-indigo-500' : 'text-slate-400'}`} />
                  Manual Editor
                </button>
              </div>
            </div>

            {activeTab === 'ai' ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4">
                  <label className="block text-xs font-bold tracking-wide text-indigo-900 uppercase mb-2">
                    What's on your mind?
                  </label>
                  <p className="text-sm text-slate-600 mb-3">
                    Describe your topic or problem. Our AI will structure it into a comprehensive mindmap for you.
                  </p>
                  <textarea
                    rows={6}
                    className="block w-full border-slate-200 rounded-xl shadow-sm py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                    value={aiIdea}
                    onChange={(e) => setAiIdea(e.target.value)}
                    placeholder="e.g. Strategies for improving on-time delivery performance in our factory..."
                  />
                </div>
                
                {aiError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-xs font-medium text-red-600 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {aiError}
                  </div>
                )}

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateAIMap}
                    disabled={isGeneratingAI || !aiIdea.trim()}
                    className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isGeneratingAI ? (
                      <>
                        <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                        Generating Ideas...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Generate Mindmap
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs font-bold tracking-wide text-slate-500 uppercase mb-1.5">Title</label>
                    <input
                      type="text"
                      className="block w-full border-slate-200 rounded-xl shadow-sm py-2.5 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Mindmap Title"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold tracking-wide text-slate-500 uppercase mb-1.5">Description</label>
                    <textarea
                      rows={2}
                      className="block w-full border-slate-200 rounded-xl shadow-sm py-2.5 px-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Brief description of this mindmap..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold tracking-wide text-slate-500 uppercase">Markdown Content</label>
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Markdown Supported</span>
                    </div>
                    <textarea
                      rows={12}
                      className="block w-full border-slate-200 rounded-xl shadow-sm py-3 px-4 font-mono text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="# Main topic&#10;- Key point&#10;  - Sub point"
                    />
                  </div>
                </div>
              </form>
            )}
          </div>

          <div className="bg-slate-50 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100">
            <div className="order-2 sm:order-1 w-full sm:w-auto">
              {mode === 'edit' && activeMindmapId && dashboardMindmaps.length > 0 && (
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex justify-center items-center rounded-xl border border-transparent px-4 py-2.5 text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 text-sm font-bold transition-colors"
                  onClick={handleDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Mindmap
                </button>
              )}
            </div>
            <div className="order-1 sm:order-2 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-slate-200 shadow-sm px-5 py-2.5 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Cancel
              </button>
              {(activeTab === 'manual' || (activeTab === 'ai' && !isGeneratingAI)) && (
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-indigo-500/20 px-6 py-2.5 bg-indigo-600 text-sm font-bold text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {mode === 'edit' ? 'Save Changes' : 'Create Mindmap'}
                  </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
