import { X } from 'lucide-react';

interface DataChartingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataChartingModal = ({ isOpen, onClose }: DataChartingModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={() => {
          onClose();
        }}
      />
      <div className="relative z-[95] flex h-full w-full flex-col bg-white shadow-2xl border border-gray-200 rounded-none overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <h2 className="text-sm font-semibold text-gray-900">数据分析</h2>
              <p className="text-xs text-gray-500">
                全屏数据图表分析工作区（基于 chart.html）。
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
            }}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          <iframe
            src="/chart.html"
            title="数据分析"
            className="h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
};
