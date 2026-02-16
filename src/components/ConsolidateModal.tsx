import React, { useState } from 'react';
import { X, Loader2, Layers, Merge, Database, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import { dataService } from '../services/dataService';
import { Bowler, A3Case } from '../types';

interface ConsolidateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolidateModal: React.FC<ConsolidateModalProps> = ({ isOpen, onClose }) => {
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { bowlers, a3Cases, reorderBowlers, reorderA3Cases } = useApp();
  const toast = useToast();

  if (!isOpen) return null;

  // Helper function to merge lists while preserving order from source (newItems)
  // and keeping the position of updated items relative to the list
  const smartMerge = <T extends { id: string }>(currentItems: T[], newItems: T[]): T[] => {
    const newItemIds = new Set(newItems.map(i => i.id));
    const indices = currentItems
      .map((item, index) => newItemIds.has(item.id) ? index : -1)
      .filter(index => index !== -1);
    
    const remainingItems = currentItems.filter(item => !newItemIds.has(item.id));
    
    if (indices.length === 0) {
      // If no items exist, append new items to the end
      return [...remainingItems, ...newItems];
    }
    
    // Find the first position where an updated item was located
    const firstIndex = Math.min(...indices);
    
    // Calculate where this position maps to in the remainingItems array
    // by counting how many kept items were before this index
    const itemsBeforeCount = currentItems.slice(0, firstIndex).filter(item => !newItemIds.has(item.id)).length;
    
    const final = [...remainingItems];
    final.splice(itemsBeforeCount, 0, ...newItems);
    return final;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedRole = (user?.role || '').trim().toLowerCase();
    const isAdminOrSuperAdmin =
      normalizedRole === 'admin' || normalizedRole === 'super admin';

    if (!isAdminOrSuperAdmin) {
      toast.error('Only administrators can perform this action.');
      return;
    }

    if (!tagInput.trim()) {
      toast.error('Please enter at least one tag.');
      return;
    }

    const tags = tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);

    if (tags.length === 0) {
      toast.error('Please enter valid tags.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await dataService.consolidateBowlers(tags);
      if (response.success) {
        const newBowlers = (response.bowlers || []) as Bowler[];
        const newA3Cases = (response.a3Cases || []) as A3Case[];
        
        // Calculate stats for toast
        const existingBowlerIds = new Set(bowlers.map(b => b.id));
        const existingA3Ids = new Set(a3Cases.map(a => a.id));
        
        const addedBowlersCount = newBowlers.filter(b => !existingBowlerIds.has(b.id)).length;
        const updatedBowlersCount = newBowlers.filter(b => existingBowlerIds.has(b.id)).length;
        const addedA3Count = newA3Cases.filter(a => !existingA3Ids.has(a.id)).length;
        const updatedA3Count = newA3Cases.filter(a => existingA3Ids.has(a.id)).length;

        const totalAdded = addedBowlersCount + addedA3Count;
        const totalUpdated = updatedBowlersCount + updatedA3Count;
        
        if (totalAdded > 0 || totalUpdated > 0) {
            // Apply smart merge
            if (newBowlers.length > 0) {
                const mergedBowlers = smartMerge(bowlers, newBowlers);
                reorderBowlers(mergedBowlers);
            }
            
            if (newA3Cases.length > 0) {
                const mergedA3 = smartMerge(a3Cases, newA3Cases);
                reorderA3Cases(mergedA3);
            }

            const parts = [];
            if (addedBowlersCount > 0) parts.push(`${addedBowlersCount} bowlers added`);
            if (updatedBowlersCount > 0) parts.push(`${updatedBowlersCount} bowlers updated`);
            if (addedA3Count > 0) parts.push(`${addedA3Count} A3s added`);
            if (updatedA3Count > 0) parts.push(`${updatedA3Count} A3s updated`);
            
            toast.success(`Successfully consolidated: ${parts.join(', ')}.`);
        } else {
            toast.info('No new or updated items found with these tags.');
        }
        onClose();
        setTagInput('');
      } else {
        toast.error('Failed to consolidate items.');
      }
    } catch (error) {
      console.error('Consolidate error:', error);
      toast.error('An error occurred during consolidation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in scale-in-95 duration-500">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-sm border border-cyan-100/50">
              <Merge className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-none">
                Consolidate Workspace
              </h3>
              <p className="mt-1.5 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyan-500" />
                Merge and synchronize data sources
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Info Box */}
                <div className="flex items-start gap-3 rounded-xl border border-cyan-100 bg-cyan-50/40 px-4 py-3">
                    <div className="p-1 bg-white rounded-lg shadow-sm border border-cyan-50 mt-0.5">
                        <Layers className="h-3.5 w-3.5 text-cyan-600" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-bold text-cyan-900">Smart Consolidation</p>
                        <p className="text-[10px] text-cyan-700 leading-relaxed">
                            This process will fetch Bowlers and A3 Cases matching your tags and merge them into your current workspace, preserving your local modifications where possible.
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <label htmlFor="tags" className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Filter Tags
                    </label>
                    <div className="relative">
                        <input
                            type="text"
                            id="tags"
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            placeholder="e.g. Technical, Urgent, Q1"
                            className="w-full bg-white border border-slate-200 rounded-xl shadow-sm py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all text-sm font-medium placeholder:text-slate-300"
                            autoFocus
                        />
                        <div className="absolute right-3 top-2.5 text-slate-300">
                            <Sparkles className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium ml-1">
                        Use comma-separated tags to filter the dataset.
                    </p>
                </div>
            </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
                Cancel
            </button>
            <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-6 py-2.5 bg-cyan-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-200 hover:bg-cyan-700 hover:shadow-cyan-300 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:pointer-events-none"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Consolidating...</span>
                    </>
                ) : (
                    <>
                        <Merge className="w-4 h-4" />
                        <span>Consolidate</span>
                    </>
                )}
            </button>
        </div>
      </div>
    </div>
  );
};
