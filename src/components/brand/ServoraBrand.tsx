"use client";

import React from "react";

interface ServoraBrandProps {
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "dark" | "light" | "teal";
  showTagline?: boolean;
  className?: string;
}

export default function ServoraBrand({
  size = "md",
  variant = "dark",
  showTagline = true,
  className = "",
}: ServoraBrandProps) {
  const iconSizes = {
    sm: "w-7 h-7",
    md: "w-9 h-9",
    lg: "w-12 h-12",
    xl: "w-16 h-16",
  };

  const textSizes = {
    sm: "text-base tracking-wider",
    md: "text-xl tracking-wider",
    lg: "text-2xl tracking-widest",
    xl: "text-3xl tracking-widest",
  };

  const isLight = variant === "light";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Servora Stylized 'S' Cloche & IoT Network Icon */}
      <div className={`${iconSizes[size]} shrink-0 relative flex items-center justify-center`}>
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-xs" fill="none">
          {/* Cloche Dome */}
          <path
            d="M 45 155 A 42 42 0 0 1 118 155 Z"
            fill={isLight ? "#14B8A6" : "#0D9488"}
            stroke={isLight ? "#14B8A6" : "#0D9488"}
            strokeWidth="4"
            strokeLinejoin="round"
          />
          {/* Cloche Handle */}
          <circle cx="81.5" cy="111" r="5" fill={isLight ? "#14B8A6" : "#0D9488"} />
          <path
            d="M 81.5 111 L 81.5 116"
            stroke={isLight ? "#14B8A6" : "#0D9488"}
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Serving Platter Base */}
          <rect
            x="36"
            y="157"
            width="168"
            height="9"
            rx="4.5"
            fill={isLight ? "#FFFFFF" : "#0B1E36"}
          />

          {/* S Backbone */}
          <path
            d="M 148 76 C 148 62 136 50 120 50 C 98 50 82 64 82 86 C 82 114 158 116 158 150 C 158 178 134 194 104 194 C 84 194 68 184 62 170"
            stroke={isLight ? "#FFFFFF" : "#0B1E36"}
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
          />

          {/* Connected Network Nodes */}
          <circle cx="120" cy="88" r="9" fill={isLight ? "#14B8A6" : "#0D9488"} />
          <line
            x1="120"
            y1="88"
            x2="162"
            y2="64"
            stroke={isLight ? "#14B8A6" : "#0D9488"}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="162" cy="64" r="8" fill={isLight ? "#14B8A6" : "#0D9488"} />
          <line
            x1="162"
            y1="64"
            x2="192"
            y2="76"
            stroke={isLight ? "#14B8A6" : "#0D9488"}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="192" cy="76" r="7.5" fill={isLight ? "#14B8A6" : "#0D9488"} />
          <line
            x1="162"
            y1="64"
            x2="178"
            y2="104"
            stroke={isLight ? "#14B8A6" : "#0D9488"}
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="178" cy="104" r="7" fill={isLight ? "#14B8A6" : "#0D9488"} />
        </svg>
      </div>

      {/* Wordmark & Tagline */}
      <div className="flex flex-col leading-none">
        <span
          className={`font-black ${textSizes[size]} ${
            isLight ? "text-white" : "text-[#0B1E36]"
          }`}
        >
          SERVORA
        </span>
        {showTagline && (
          <span
            className={`text-[9px] font-semibold mt-0.5 tracking-tight ${
              isLight ? "text-teal-200" : "text-[#0D9488]"
            }`}
          >
            Smart Dining • Seamless Service
          </span>
        )}
      </div>
    </div>
  );
}
