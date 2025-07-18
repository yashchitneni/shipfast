'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'info', 
  duration = 5000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
      default:
        return 'ℹ';
    }
  };

  if (!isMounted) return null;

  return createPortal(
    <div
      className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      } ${getStyles()}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">{getIcon()}</span>
        <p className="flex-1">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          className="text-white hover:text-gray-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>,
    document.body
  );
};

interface ToastContainerState {
  toasts: Array<{
    id: string;
    message: string;
    type: ToastProps['type'];
    duration?: number;
  }>;
}

class ToastManager {
  private static instance: ToastManager;
  private listeners: Set<(state: ToastContainerState) => void> = new Set();
  private state: ToastContainerState = { toasts: [] };

  static getInstance() {
    if (!ToastManager.instance) {
      ToastManager.instance = new ToastManager();
    }
    return ToastManager.instance;
  }

  subscribe(listener: (state: ToastContainerState) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.state));
  }

  show(message: string, type: ToastProps['type'] = 'info', duration?: number) {
    const id = Date.now().toString();
    this.state.toasts.push({ id, message, type, duration });
    this.notify();
  }

  remove(id: string) {
    this.state.toasts = this.state.toasts.filter(toast => toast.id !== id);
    this.notify();
  }
}

export const toast = {
  success: (message: string, duration?: number) => 
    ToastManager.getInstance().show(message, 'success', duration),
  error: (message: string, duration?: number) => 
    ToastManager.getInstance().show(message, 'error', duration),
  warning: (message: string, duration?: number) => 
    ToastManager.getInstance().show(message, 'warning', duration),
  info: (message: string, duration?: number) => 
    ToastManager.getInstance().show(message, 'info', duration),
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastContainerState['toasts']>([]);

  useEffect(() => {
    const manager = ToastManager.getInstance();
    const unsubscribe = manager.subscribe(state => {
      setToasts(state.toasts);
    });
    return unsubscribe;
  }, []);

  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ bottom: `${(index + 1) * 80}px` }}
          className="fixed right-4 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => ToastManager.getInstance().remove(toast.id)}
          />
        </div>
      ))}
    </>
  );
};