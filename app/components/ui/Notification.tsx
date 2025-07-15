'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationProps {
  notification: NotificationItem;
  onClose: (id: string) => void;
}

const NotificationComponent: React.FC<NotificationProps> = ({ notification, onClose }) => {
  useEffect(() => {
    if (notification.duration !== 0) {
      const timer = setTimeout(() => {
        onClose(notification.id);
      }, notification.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  const getNotificationStyles = () => {
    switch (notification.type) {
      case 'success':
        return {
          background: 'var(--cargo-green)',
          icon: '✓',
        };
      case 'error':
        return {
          background: 'var(--alert-red)',
          icon: '✕',
        };
      case 'warning':
        return {
          background: 'var(--warning-yellow)',
          icon: '!',
        };
      case 'info':
      default:
        return {
          background: 'var(--dashboard-blue)',
          icon: 'i',
        };
    }
  };

  const styles = getNotificationStyles();

  return (
    <div
      className="game-panel flex items-start gap-3 p-4 mb-3 min-w-[300px] max-w-md animate-slide-in"
      style={{ borderColor: styles.background, borderWidth: '2px' }}
    >
      <div
        className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold"
        style={{ backgroundColor: styles.background }}
      >
        {styles.icon}
      </div>
      <div className="flex-1">
        <h4 className="font-semibold" style={{ color: styles.background }}>
          {notification.title}
        </h4>
        {notification.message && (
          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        )}
      </div>
      <button
        onClick={() => onClose(notification.id)}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
};

interface NotificationContainerProps {
  notifications: NotificationItem[];
  onClose: (id: string) => void;
}

export const NotificationContainer: React.FC<NotificationContainerProps> = ({
  notifications,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const container = (
    <div className="fixed top-4 right-4 z-50">
      {notifications.map((notification) => (
        <NotificationComponent
          key={notification.id}
          notification={notification}
          onClose={onClose}
        />
      ))}
    </div>
  );

  return createPortal(container, document.body);
};

// Notification hook for easy usage
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const addNotification = (notification: Omit<NotificationItem, 'id'>) => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { ...notification, id }]);
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return {
    notifications,
    addNotification,
    removeNotification,
  };
};

export default NotificationContainer;