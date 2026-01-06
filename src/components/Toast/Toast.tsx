import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import './Toast.css';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastMessage {
    id: string;
    type: ToastType;
    content: string;
}

let addToastFn: ((type: ToastType, content: string) => void) | null = null;

// Global toast API
export const toast = {
    success: (content: string) => addToastFn?.('success', content),
    error: (content: string) => addToastFn?.('error', content),
    warning: (content: string) => addToastFn?.('warning', content),
    info: (content: string) => addToastFn?.('info', content),
};

export function ToastContainer() {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((type: ToastType, content: string) => {
        const id = `toast-${Date.now()}`;
        setToasts((prev) => [...prev, { id, type, content }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    useEffect(() => {
        addToastFn = addToast;
        return () => {
            addToastFn = null;
        };
    }, [addToast]);

    const getIcon = (type: ToastType) => {
        switch (type) {
            case 'success':
                return <CheckCircle size={18} />;
            case 'error':
                return <AlertCircle size={18} />;
            case 'warning':
                return <AlertCircle size={18} />;
            case 'info':
                return <Info size={18} />;
        }
    };

    return (
        <div className="toast-container">
            {toasts.map((toast) => (
                <div key={toast.id} className={`toast toast--${toast.type}`}>
                    <span className="toast__icon">{getIcon(toast.type)}</span>
                    <span className="toast__content">{toast.content}</span>
                    <button
                        className="toast__close"
                        onClick={() => removeToast(toast.id)}
                    >
                        <X size={14} />
                    </button>
                </div>
            ))}
        </div>
    );
}
