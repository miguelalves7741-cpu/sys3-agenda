import React, { useEffect } from 'react';
import { Bell, CheckCircle, Info, XCircle, X } from 'lucide-react';

export default function NotificationToast({ notification, onClose }) {
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Some após 5 segundos
      return () => clearTimeout(timer);
    }
  }, [notification, onClose]);

  if (!notification) return null;

  const styles = {
    success: "bg-green-100 border-green-500 text-green-800",
    info: "bg-blue-100 border-blue-500 text-blue-800",
    error: "bg-red-100 border-red-500 text-red-800"
  };

  const icons = {
    success: <CheckCircle size={20} />,
    info: <Info size={20} />,
    error: <XCircle size={20} />
  };

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-start gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg animate-slide-in max-w-sm ${styles[notification.type] || styles.info}`}>
      <div className="mt-0.5">{icons[notification.type] || <Bell />}</div>
      <div className="flex-1">
        <h4 className="font-bold text-sm uppercase">{notification.title}</h4>
        <p className="text-xs mt-1 leading-snug">{notification.message}</p>
        <p className="text-[10px] mt-1 opacity-70 font-bold text-right">Autor: {notification.user}</p>
      </div>
      <button onClick={onClose} className="opacity-50 hover:opacity-100"><X size={16}/></button>
    </div>
  );
}