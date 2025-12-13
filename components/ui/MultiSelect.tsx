"use client";

import { useState, useRef, useEffect } from "react";
import { X, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  onCreateNew?: (value: string) => void;
  placeholder?: string;
  allowCreate?: boolean;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  onCreateNew,
  placeholder = "Select or type...",
  allowCreate = true,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) &&
      !selected.includes(opt.value)
  );

  const showCreateOption =
    allowCreate &&
    search.trim() &&
    !options.some((opt) => opt.label.toLowerCase() === search.toLowerCase());

  const handleSelect = (value: string) => {
    onChange([...selected, value]);
    setSearch("");
    inputRef.current?.focus();
  };

  const handleRemove = (value: string) => {
    onChange(selected.filter((v) => v !== value));
  };

  const handleCreate = () => {
    if (onCreateNew && search.trim()) {
      onCreateNew(search.trim());
      setSearch("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && showCreateOption) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === "Backspace" && !search && selected.length > 0) {
      handleRemove(selected[selected.length - 1]);
    }
  };

  const selectedOptions = selected
    .map((v) => options.find((opt) => opt.value === v))
    .filter(Boolean) as MultiSelectOption[];

  return (
    <div ref={containerRef} className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      <div
        className={cn(
          "min-h-[42px] w-full rounded-lg border bg-white px-3 py-2",
          "focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500",
          isOpen ? "border-blue-500 ring-1 ring-blue-500" : "border-gray-300"
        )}
        onClick={() => {
          setIsOpen(true);
          inputRef.current?.focus();
        }}
      >
        <div className="flex flex-wrap gap-1.5">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sm"
              style={{
                backgroundColor: opt.color ? `${opt.color}20` : "#E5E7EB",
                color: opt.color || "#374151",
              }}
            >
              {opt.label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(opt.value);
                }}
                className="hover:bg-black/10 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder={selected.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[100px] outline-none text-sm bg-transparent"
          />
        </div>
      </div>

      {isOpen && (filteredOptions.length > 0 || showCreateOption) && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-lg">
          {filteredOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => handleSelect(opt.value)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left text-sm"
            >
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: opt.color || "#9CA3AF" }}
              />
              {opt.label}
            </button>
          ))}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-blue-50 text-left text-sm text-blue-600"
            >
              <Plus className="w-4 h-4" />
              Create "{search}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
