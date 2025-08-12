"use client"
import React from 'react';

interface InputProps {
    label?: string;
    type?: string;
    placeholder?: string;
    errorMessage?: string;
    error?: boolean;
    info?: string;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    value?: string;
    disabled?: boolean;
    inputClassName?: string;
    containerClassName?: string;
    autoFocus?: boolean;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    icon?: React.ReactElement;
}

const Input: React.FC<InputProps> = ({
    label,
    placeholder,
    type = "text",
    error = false,
    errorMessage,
    onChange,
    value = "",
    inputClassName = "",
    containerClassName = "",
    autoFocus = false,
    autoCapitalize = "none",
    disabled = false,
    icon,
    info,
    ...rest
}) => {
    return (
        <div className="w-full">
            {label && (
                <div className="w-full animate-fade-in">
                    <label className="block text-sm font-medium text-gray-400 text-left">
                        {label}
                    </label>
                </div>
            )}

            <div
                className={`
          w-full flex items-center justify-between
          bg-white border-2 border-gray-300 px-4 py-3 rounded-lg
          ${label ? 'mt-1' : ''}
          gap-3 min-h-[40px]
          ${error
                        ? 'border border-red-500'
                        : value
                            ? 'border border-gray-400'
                            : 'border-0'
                    }
          ${containerClassName}
        `}
            >
                {icon && <div className="flex-shrink-0">{icon}</div>}

                <input
                    {...rest}
                    type={type}
                    disabled={disabled}
                    autoCapitalize={autoCapitalize}
                    placeholder={placeholder}
                    value={value}
                    onChange={onChange}
                    autoFocus={autoFocus}
                    className={`
            flex-1 text-sm text-black font-normal text-left
            bg-transparent border-none outline-none
            placeholder-gray-400
            ${disabled ? 'opacity-50' : 'opacity-100'}
            ${inputClassName}
          `}
                />
            </div>
            {info && <div className="mt-2.5 animate-fade-in">
                <p className="text-xs font-normal text-gray-400 text-left truncate">
                    {info || "Info message"}
                </p>
            </div>}
            {error && (
                <div className="mt-2.5 animate-fade-in">
                    <p className="text-xs font-normal text-red-500 text-left truncate">
                        {errorMessage || "Error message"}
                    </p>
                </div>
            )}

            <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-in-out;
        }
      `}</style>
        </div>
    );
};

export default Input;