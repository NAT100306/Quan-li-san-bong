"use client"

import * as React from "react"

export interface ToastMessage {
  id: string;
  title?: string;
  description: string;
  type?: 'default' | 'success' | 'error' | 'warning';
}

const ToastContext = React.createContext<{
  toast: (msg: Omit<ToastMessage, 'id'>) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...msg, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full p-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-xl border text-white pointer-events-auto animate-in slide-in-from-bottom-5 duration-300 flex flex-col gap-0.5 ${
              t.type === 'success' 
                ? 'bg-emerald-600 border-emerald-500' 
                : t.type === 'error'
                ? 'bg-red-600 border-red-500'
                : t.type === 'warning'
                ? 'bg-amber-500 border-amber-400 text-zinc-950'
                : 'bg-zinc-800 border-zinc-700'
            }`}
          >
            {t.title && <h4 className="font-bold text-sm">{t.title}</h4>}
            <p className="text-xs font-medium">{t.description}</p>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    // Return a fallback so it won't crash during SSR
    return {
      toast: (msg: Omit<ToastMessage, 'id'>) => {
        console.log("Fallback Toast:", msg);
      }
    };
  }
  return context;
}
