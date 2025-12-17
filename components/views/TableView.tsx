"use client";

import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

interface TableViewProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  maxHeight?: string;
}

type SortDirection = "asc" | "desc" | null;

export function TableView<T extends Record<string, unknown>>({
  data,
  columns,
  keyExtractor,
  emptyMessage = "No data to display",
  onRowClick,
  maxHeight = "320px",
}: TableViewProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      if (aValue === bValue) return 0;
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = aValue < bValue ? -1 : 1;
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, sortKey, sortDirection]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-auto" style={{ maxHeight }}>
      <table className="w-full">
        <thead className="sticky top-0 bg-white">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className={`px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                  column.align === "center"
                    ? "text-center"
                    : column.align === "right"
                    ? "text-right"
                    : "text-left"
                } ${column.sortable ? "cursor-pointer select-none hover:bg-gray-50" : ""}`}
                style={{ width: column.width }}
                onClick={() => column.sortable && handleSort(String(column.key))}
              >
                <div className="flex items-center gap-1">
                  {column.header}
                  {column.sortable && (
                    <span className="flex flex-col">
                      <ChevronUp
                        className={`w-3 h-3 -mb-1 ${
                          sortKey === column.key && sortDirection === "asc"
                            ? "text-blue-500"
                            : "text-gray-300"
                        }`}
                      />
                      <ChevronDown
                        className={`w-3 h-3 ${
                          sortKey === column.key && sortDirection === "desc"
                            ? "text-blue-500"
                            : "text-gray-300"
                        }`}
                      />
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sortedData.map((item) => (
            <tr
              key={keyExtractor(item)}
              className={`${
                onRowClick
                  ? "cursor-pointer hover:bg-gray-50 transition-colors"
                  : ""
              }`}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={`${keyExtractor(item)}-${String(column.key)}`}
                  className={`px-3 py-3 text-sm ${
                    column.align === "center"
                      ? "text-center"
                      : column.align === "right"
                      ? "text-right"
                      : "text-left"
                  }`}
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
