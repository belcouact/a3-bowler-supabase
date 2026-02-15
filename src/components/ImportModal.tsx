import React, { useState, useRef } from 'react';
import { Upload, X, AlertCircle, Check, Database, Info, ArrowRight } from 'lucide-react';
import { Metric, Bowler } from '../context/AppContext';
import { generateShortId } from '../utils/idUtils';
import { useToast } from '../context/ToastContext';
import clsx from 'clsx';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: Record<string, { bowler: Partial<Bowler>, metrics: Metric[] }>) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = (selectedFile: File) => {
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      setFile(null);
      return;
    }
    setFile(selectedFile);
    setError(null);
    setSuccess(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    if (lines.length < 2) throw new Error('File is empty or missing headers');

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
    const bowlerNameIndex = headers.findIndex(h => h.toLowerCase().includes('bowler name'));
    const descriptionIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
    const groupIndex = headers.findIndex(h => h.toLowerCase().includes('group'));
    const championIndex = headers.findIndex(h => h.toLowerCase().includes('champion'));
    const commitmentIndex = headers.findIndex(h => h.toLowerCase().includes('commitment'));
    const tagIndex = headers.findIndex(h => h.toLowerCase().includes('tag'));
    
    const metricNameIndex = headers.findIndex(h => h.toLowerCase().includes('metric name'));
    const metricDefinitionIndex = headers.findIndex(h => h.toLowerCase().includes('definition'));
    const metricOwnerIndex = headers.findIndex(h => h.toLowerCase().includes('owner'));
    const metricAttributeIndex = headers.findIndex(h => h.toLowerCase().includes('attribute'));
    const targetRuleIndex = headers.findIndex(h => h.toLowerCase().includes('target rule') || h.toLowerCase().includes('meeting rule'));
    
    const scopeIndex = headers.findIndex(h => h.toLowerCase().includes('scope'));
    const typeIndex = headers.findIndex(h => h.toLowerCase() === 'type');
    
    if (bowlerNameIndex === -1) {
        throw new Error('Missing required column: "Bowler Name"');
    }

    if (metricNameIndex === -1) {
        throw new Error('Missing required column: "Metric Name"');
    }
    
    if (scopeIndex === -1) {
        throw new Error('Missing required column: "Scope"');
    }

    const monthMappings: { index: number; type: 'target' | 'actual' | 'dynamic'; key: string }[] = [];
    
    headers.forEach((h, index) => {
        const lower = h.toLowerCase();
        
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
            const datePart = h.substring(0, h.lastIndexOf(' ')); 
            const key = parseDateKey(datePart);
            
            if (key) {
                monthMappings.push({
                    index,
                    type: isTarget ? 'target' : 'actual',
                    key
                });
            }
        } else {
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

    const result: Record<string, { bowler: Partial<Bowler>, metrics: Metric[] }> = {};
    let processedRows = 0;
    
    for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        const row = simpleParseLine(lines[i]);
        
        const bowlerName = row[bowlerNameIndex];
        if (!bowlerName) continue;

        const name = row[metricNameIndex];
        if (!name) continue;

        const scope = row[scopeIndex];
        
        const description = descriptionIndex !== -1 ? row[descriptionIndex] : undefined;
        const group = groupIndex !== -1 ? row[groupIndex] : undefined;
        const champion = championIndex !== -1 ? row[championIndex] : undefined;
        const commitment = commitmentIndex !== -1 ? row[commitmentIndex] : undefined;
        const tag = tagIndex !== -1 ? row[tagIndex] : undefined;

        const definition = metricDefinitionIndex !== -1 ? row[metricDefinitionIndex] : '';
        const owner = metricOwnerIndex !== -1 ? row[metricOwnerIndex] : '';
        const attribute = metricAttributeIndex !== -1 ? row[metricAttributeIndex] : '';
        const rawRule = targetRuleIndex !== -1 ? row[targetRuleIndex] : undefined;
        
        let targetMeetingRule: 'gte' | 'lte' | 'within_range' | undefined = undefined;
        if (rawRule) {
          const r = rawRule.toLowerCase().trim();
          if (r === 'gte' || r === 'lte' || r === 'within_range') {
            targetMeetingRule = r as any;
          }
        }

        let rowType: 'target' | 'actual' | null = null;
        if (typeIndex !== -1 && row[typeIndex]) {
            const val = row[typeIndex].toLowerCase();
            if (val.includes('target')) rowType = 'target';
            else if (val.includes('actual')) rowType = 'actual';
        }

        if (!result[bowlerName]) {
            result[bowlerName] = {
                bowler: {
                    name: bowlerName,
                    description,
                    group,
                    champion,
                    commitment,
                    tag
                },
                metrics: []
            };
        } else {
            const b = result[bowlerName].bowler;
            if (description) b.description = description;
            if (group) b.group = group;
            if (champion) b.champion = champion;
            if (commitment) b.commitment = commitment;
            if (tag) b.tag = tag;
        }
        
        const currentBowlerMetrics = result[bowlerName].metrics;

        let metric = currentBowlerMetrics.find(m => m.name === name);
        if (!metric) {
            metric = {
                id: generateShortId(),
                name,
                scope,
                definition,
                owner,
                attribute,
                targetMeetingRule,
                monthlyData: {}
            };
            currentBowlerMetrics.push(metric);
        } else {
            if (definition) metric.definition = definition;
            if (owner) metric.owner = owner;
            if (attribute) metric.attribute = attribute;
            if (targetMeetingRule) metric.targetMeetingRule = targetMeetingRule;
        }

        const monthlyData = metric.monthlyData || {};
        
        monthMappings.forEach(mapping => {
            if (row[mapping.index] !== undefined) {
                const val = row[mapping.index];
                let effectiveType = mapping.type;
                
                if (effectiveType === 'dynamic') {
                    if (!rowType) return; 
                    effectiveType = rowType;
                }

                if (!monthlyData[mapping.key]) {
                    monthlyData[mapping.key] = { target: '', actual: '' };
                }
                
                monthlyData[mapping.key][effectiveType] = val;
            }
        });
        
        metric.monthlyData = monthlyData;
        processedRows++;
    }

    return { data: result, rowCount: processedRows, colCount: headers.length };
  };

  const handleUpload = () => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { data, rowCount, colCount } = parseCSV(text);
        onImport(data);
        const successMsg = `Successfully imported ${rowCount} rows across ${colCount} columns.`;
        setSuccess(successMsg);
        toast.success(successMsg);
        setTimeout(() => {
            onClose();
            setSuccess(null);
            setFile(null);
        }, 1500);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to parse CSV';
        setError(errorMsg);
        toast.error(`Import Failed: ${errorMsg}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6">
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" 
        onClick={onClose} 
      />
      
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in scale-in-95 duration-500">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <div className="p-2.5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl shadow-sm border border-indigo-100/50">
              <Database className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 leading-none">
                Import Metrics Data
              </h3>
              <p className="mt-1.5 text-xs font-medium text-slate-500 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-500" />
                Bulk synchronize performance dashboards
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-100 active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Instructions */}
          <div className="space-y-3">
            <div className="flex items-start gap-4 rounded-xl border border-blue-100 bg-blue-50/40 px-4 py-4">
              <div className="p-2 bg-white rounded-lg shadow-sm border border-blue-50">
                <Info className="h-5 w-5 text-blue-500" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900">Format Guide</p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Upload a CSV file containing <span className="font-bold">Bowler Name</span>, <span className="font-bold">Metric Name</span>, and <span className="font-bold">Type</span>. The system will auto-map dates in YYYY/MMM format.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {['Bowler Name', 'Metric Name', 'Scope', 'Type'].map((col) => (
                <div key={col} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tight">{col}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={clsx(
              "relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer group",
              isDragging 
                ? "bg-indigo-50 border-indigo-400 shadow-inner" 
                : file 
                  ? "bg-emerald-50 border-emerald-300 shadow-sm" 
                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300 hover:shadow-md"
            )}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            
            <div className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 shadow-sm",
              file 
                ? "bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 ring-4 ring-emerald-50" 
                : "bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 ring-4 ring-indigo-50"
            )}>
              {file ? <Check className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-700">
                {file ? file.name : 'Drop your CSV file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {file ? `${(file.size / 1024).toFixed(1)} KB` : 'or click to browse from files'}
              </p>
            </div>

            {file && !success && !error && (
              <div className="mt-4 px-3 py-1 bg-white border border-emerald-200 rounded-full text-[10px] font-bold text-emerald-600 animate-bounce shadow-sm">
                File ready for import
              </div>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 animate-in fade-in slide-in-from-top-2">
              <Check className="w-4 h-4 flex-shrink-0" />
              <p className="text-xs font-bold">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-2.5 text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-all border border-slate-200 hover:border-slate-300 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || !!success}
            className={clsx(
              "flex-[2] px-6 py-2.5 text-sm font-bold rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-100",
              (!file || !!success)
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            )}
          >
            Start Processing
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
