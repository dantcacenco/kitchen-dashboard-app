"use client";

import { HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  max?: number;
  size?: "sm" | "md" | "lg";
  color?: string;
  showLabel?: boolean;
  labelPosition?: "inside" | "outside";
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    {
      className,
      value,
      max = 100,
      size = "md",
      color = "#3B82F6",
      showLabel = false,
      labelPosition = "outside",
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizes = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showLabel && labelPosition === "outside" && (
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          className={cn(
            "w-full bg-gray-200 rounded-full overflow-hidden",
            sizes[size]
          )}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300 ease-out",
              size === "lg" && showLabel && labelPosition === "inside"
                ? "flex items-center justify-end pr-2"
                : ""
            )}
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
            }}
          >
            {size === "lg" && showLabel && labelPosition === "inside" && (
              <span className="text-xs font-medium text-white">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";
