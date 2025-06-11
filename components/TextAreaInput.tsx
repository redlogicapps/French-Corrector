
import React from 'react';

interface TextAreaInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  className?: string;
}

export const TextAreaInput: React.FC<TextAreaInputProps> = ({
  value,
  onChange,
  placeholder = "Enter text...",
  rows = 5,
  disabled = false,
  className = '',
}) => {
  return (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      className={`w-full p-3 border border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-700 text-slate-200 placeholder-slate-400 transition duration-150 ease-in-out ${className} ${disabled ? 'bg-slate-800 cursor-not-allowed' : ''}`}
    />
  );
};
