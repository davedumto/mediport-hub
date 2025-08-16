"use client";
import React from "react";

interface ButtonProps {
  onClick?: () => void;
  btnTitle?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  className?: string;
  textColor?: string;
  textClassName?: string;
  iconPosition?: "left" | "right";
  type?: "button" | "submit" | "reset";
}

const Button: React.FC<ButtonProps> = ({
  onClick,
  btnTitle,
  loading = false,
  disabled = false,
  icon,
  className = "",
  textColor = "white",
  textClassName = "",
  iconPosition = "left",
  type = "button",
  ...rest
}) => {
  const handleClick = () => {
    if (!disabled && !loading && onClick) {
      onClick();
    }
  };

  return (
    <button
      {...rest}
      type={type}
      onClick={type === "submit" ? undefined : handleClick}
      disabled={disabled || loading}
      className={`
        py-3.5 px-5 rounded-lg
        flex items-center justify-center
        bg-blue-600 hover:bg-blue-700 
        transition-colors duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${
          disabled || loading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer"
        }
        ${className}
      `}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-4 w-4"
            style={{ color: textColor }}
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
      ) : (
        <div
          className={`
            flex items-center justify-center
            ${iconPosition === "right" ? "flex-row-reverse" : "flex-row"}
            ${btnTitle && icon ? "gap-3" : ""}
          `}
        >
          {icon && (
            <div className="flex items-center justify-center">{icon}</div>
          )}
          {btnTitle && (
            <span
              style={{ color: textColor }}
              className={`
                text-sm font-normal
                ${textClassName}
              `}
            >
              {btnTitle}
            </span>
          )}
        </div>
      )}
    </button>
  );
};

export default Button;
