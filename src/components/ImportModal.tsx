import React, { useState, useRef } from 'react';
import { Upload, X, FileText, AlertCircle, Check } from 'lucide-react';
import { Metric } from '../context/AppContext';
import { generateShortId } from '../utils/idUtils';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (metrics: Metric[]) => void;
  existingMetrics: Metric[];
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport, existingMetrics }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        setError('Please upload a valid CSV file.');
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setSuccess(null);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) throw new Error('File is empty or missing headers');

    // Robust simple CSV parser
    const simpleParseLine = (line: string) => {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result.map(s => s.replace(/^"|"$/g, '').replace(/""/g, '"'));
    };

    const headers = simpleParseLine(lines[0]);
    const metricNameIndex = headers.findIndex(h => h.toLowerCase().includes('metric name'));
    const scopeIndex = headers.findIndex(h => h.toLowerCase().includes('scope'));
    const typeIndex = headers.findIndex(h => h.toLowerCase() === 'type');
    
    if (metricNameIndex === -1) {
        throw new Error('Missing required column: "Metric Name"');
    }
    
    if (scopeIndex === -1) {
        throw new Error('Missing required column: "Scope"');
    }

    // Identify month columns
    // Supports two formats:
    // 1. Wide: "2024/Jan Target", "2024/Jan Actual"
    // 2. Long: "2024/Jan" with a separate "Type" column specifying Target/Actual
    const monthMappings: { index: number; type: 'target' | 'actual' | 'dynamic'; key: string }[] = [];
    
    headers.forEach((h, index) => {
        const lower = h.toLowerCase();
        
        // Helper to parse "YYYY/MMM" to "YYYY-MM"
        const parseDateKey = (dateStr: string) => {
            const parts = dateStr.split('/');
            if (parts.length === 2) {
                const year = parts[0];
                const monthName = parts[1];
                const monthIndex = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
                    .indexOf(monthName.toLowerCase().substring(0, 3));
                
                if (monthIndex !== -1) {
                    return `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
                }
            }
            return null;
        };

        if (lower.endsWith(' target') || lower.endsWith(' actual')) {
            const isTarget = lower.endsWith(' target');
            const datePart = h.substring(0, h.lastIndexOf(' ')); // "2024/Jan"
            const key = parseDateKey(datePart);
            
            if (key) {
                monthMappings.push({
                    index,
                    type: isTarget ? 'target' : 'actual',
                    key
                });
            }
        } else {
            // Check if it's just a date column (for Long format)
            const key = parseDateKey(h);
            if (key) {
                 monthMappings.push({
                    index,
                    type: 'dynamic',
                    key
                });
            }
        }
    });

    const newMetrics = [...existingMetrics];
    
    // Process rows
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = simpleParseLine(lines[i]);
        
        const name = row[metricNameIndex];
        if (!name) continue;

        const scope = row[scopeIndex];
        
        // Determine row type if using Long format
        let rowType: 'target' | 'actual' | null = null;
        if (typeIndex !== -1 && row[typeIndex]) {
            const val = row[typeIndex].toLowerCase();
            if (val.includes('target')) rowType = 'target';
            else if (val.includes('actual')) rowType = 'actual';
        }

        // Find existing or create new
        let metric = newMetrics.find(m => m.name === name);
        if (!metric) {
            metric = {
                id: generateShortId(),
                name,
                scope,
                definition: '',
                owner: '',
                attribute: '',
                monthlyData: {}
            };
            newMetrics.push(metric);
        }

        // Update monthly data
        const monthlyData = metric.monthlyData || {};
        
        monthMappings.forEach(mapping => {
            if (row[mapping.index] !== undefined) {
                const val = row[mapping.index];
                let effectiveType = mapping.type;
                
                // If column is dynamic (just date), use the row's Type column
                if (effectiveType === 'dynamic') {
                    if (!rowType) return; // Cannot determine if target or actual
                    effectiveType = rowType;
                }

                if (!monthlyData[mapping.key]) {
                    monthlyData[mapping.key] = { target: '', actual: '' };
                }
                
                // Only update if value is present (don't overwrite with empty string if not intended?)
                // Actually CSV usually implies overwrite.
                monthlyData[mapping.key][effectiveType] = val;
            }
        });
        
        metric.monthlyData = monthlyData;
    }

    return newMetrics;
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const updatedMetrics = parseCSV(text);
        onImport(updatedMetrics);
        setSuccess('Successfully imported metrics!');
        setTimeout(() => {
            onClose();
            setSuccess(null);
            setFile(null);
        }, 1500);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={onClose}></div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="hidden sm:block absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              className="bg-white rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={onClose}
            >
              <span className="sr-only">Close</span>
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                Import Metrics Data
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 mb-4">
                  Upload a CSV file to update metrics. New metrics will be created if they don't exist.
                </p>
                
                <div className="bg-gray-50 p-3 rounded-md mb-4 text-left">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1.5 text-blue-500" />
                    Required Columns
                  </h4>
                  <ul className="text-xs text-gray-600 list-disc list-inside space-y-1">
                    <li><span className="font-mono font-medium">Bowler Name</span> (Required, 1st Column)</li>
                    <li><span className="font-mono font-medium">Metric Name</span> (Required)</li>
                    <li><span className="font-mono font-medium">Scope</span> (Optional)</li>
                    <li>
                      Date Columns format: <span className="font-mono">YYYY/MMM Target</span> and <span className="font-mono">YYYY/MMM Actual</span>
                      <br />
                      <span className="text-gray-400 italic">Example: "2024/Jan Target", "2024/Jan Actual"</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-4">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept=".csv"
                        onChange={handleFileChange}
                        className="hidden"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <FileText className="h-5 w-5 mr-2 text-gray-400" />
                        {file ? file.name : 'Select CSV File'}
                    </button>
                </div>

                {error && (
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {error}
                  </div>
                )}
                
                {success && (
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || !!success}
              className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm ${(!file || !!success) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Import
            </button>
            <button
              type="button"
              onClick={onClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
