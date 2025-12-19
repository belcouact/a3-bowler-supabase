import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { useToast } from '../context/ToastContext';
import { Bowler, A3Case } from '../types';

interface ConsolidateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsolidateModal: React.FC<ConsolidateModalProps> = ({ isOpen, onClose }) => {
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { addBowler, updateBowler, bowlers, addA3Case, updateA3Case, a3Cases } = useApp();
  const toast = useToast();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (user?.role !== 'admin') {
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
        
        let addedBowlersCount = 0;
        let updatedBowlersCount = 0;
        let addedA3Count = 0;
        let updatedA3Count = 0;

        newBowlers.forEach(newBowler => {
           const exists = bowlers.some(b => b.id === newBowler.id);
           if (!exists) {
               addBowler(newBowler);
               addedBowlersCount++;
           } else {
               updateBowler(newBowler);
               updatedBowlersCount++;
           }
        });

        newA3Cases.forEach(newA3 => {
            const exists = a3Cases.some(a => a.id === newA3.id);
            if (!exists) {
                addA3Case(newA3);
                addedA3Count++;
            } else {
                updateA3Case(newA3);
                updatedA3Count++;
            }
        });
        
        const totalAdded = addedBowlersCount + addedA3Count;
        const totalUpdated = updatedBowlersCount + updatedA3Count;
        
        if (totalAdded > 0 || totalUpdated > 0) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Consolidate Bowlers</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
              Tag (comma separated)
            </label>
            <input
              type="text"
              id="tags"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="e.g. Technical, Urgent, Q1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter tags to filter and consolidate bowlers and A3 cases from the database.
            </p>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Consolidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
