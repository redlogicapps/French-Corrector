
import React from 'react';

interface AlertProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  className?: string;
}

const AlertIcon: React.FC<{ type: AlertProps['type'] }> = ({ type }) => {
  switch (type) {
    case 'error':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-red-400 mr-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
      );
    case 'success':
      return (
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-green-400 mr-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    // Add other icons if needed
    default:
      return null;
  }
};


export const Alert: React.FC<AlertProps> = ({ message, type, className = '' }) => {
  let alertClasses = '';
  let textClasses = '';

  switch (type) {
    case 'success':
      alertClasses = 'bg-green-800 border-green-600';
      textClasses = 'text-green-100';
      break;
    case 'error':
      alertClasses = 'bg-red-800 border-red-600';
      textClasses = 'text-red-100';
      break;
    case 'warning':
      alertClasses = 'bg-yellow-800 border-yellow-600';
      textClasses = 'text-yellow-100';
      break;
    case 'info':
    default:
      alertClasses = 'bg-sky-800 border-sky-600';
      textClasses = 'text-sky-100';
      break;
  }

  return (
    <div
      className={`flex items-center p-4 border rounded-lg shadow-md ${alertClasses} ${className}`}
      role="alert"
    >
      <AlertIcon type={type} />
      <span className={`text-sm ${textClasses}`}>{message}</span>
    </div>
  );
};
