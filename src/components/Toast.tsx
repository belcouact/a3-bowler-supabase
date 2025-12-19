import { CheckCircle, XCircle, X, Info } from 'lucide-react';
import clsx from 'clsx';
import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
};

export const Toast = ({ id, message, type, onClose, duration = 3000, action }: ToastProps) => {
  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <div className={clsx(
      "flex items-center p-4 mb-3 rounded-lg border shadow-sm transition-all duration-300 transform translate-x-0 max-w-md",
      styles[type]
    )}>
      <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
      <div className="flex flex-col flex-grow mr-4">
        <div className="text-sm font-medium">{message}</div>
        {action && (
          <button
            onClick={() => {
              action.onClick();
              onClose(id);
            }}
            className="mt-2 text-xs font-semibold uppercase tracking-wider border border-current rounded px-2 py-1 hover:bg-black/5 self-start"
          >
            {action.label}
          </button>
        )}
      </div>
      <button 
        onClick={() => onClose(id)}
        className="ml-auto text-current hover:opacity-70 self-start"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
