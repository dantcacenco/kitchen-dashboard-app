"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Settings, Edit3, Check } from "lucide-react";
import { getGreeting } from "@/lib/formatters";
import { Button } from "@/components/ui";

interface HeaderProps {
  isEditing: boolean;
  onToggleEdit: () => void;
}

export function Header({ isEditing, onToggleEdit }: HeaderProps) {
  const [currentDate] = useState(new Date());
  const greeting = getGreeting();
  const formattedDate = format(currentDate, "EEEE, MMMM d, yyyy 'at' h:mm a");

  return (
    <header className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          {greeting}! <span className="text-2xl">👋</span>
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-500 text-sm">{formattedDate}</span>

        <Button
          variant={isEditing ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleEdit}
          className="gap-2"
        >
          {isEditing ? (
            <>
              <Check className="w-4 h-4" />
              Done
            </>
          ) : (
            <>
              <Edit3 className="w-4 h-4" />
              Edit Layout
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
