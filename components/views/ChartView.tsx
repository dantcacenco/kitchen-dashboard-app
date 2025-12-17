"use client";

import { ReactNode } from "react";

interface ChartViewProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function ChartView({ children, title, subtitle }: ChartViewProps) {
  return (
    <div className="space-y-4">
      {(title || subtitle) && (
        <div className="text-center">
          {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="bg-gray-50 rounded-xl p-4">{children}</div>
    </div>
  );
}
