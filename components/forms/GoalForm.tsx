"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Input, Select } from "@/components/ui";
import { parseToCents } from "@/lib/formatters";

interface GoalFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const PRIORITY_OPTIONS = [
  { value: "critical", label: "Critical" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

const COLOR_OPTIONS = [
  { value: "#22C55E", label: "Green" },
  { value: "#3B82F6", label: "Blue" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#06B6D4", label: "Cyan" },
  { value: "#F97316", label: "Orange" },
];

const ICON_OPTIONS = [
  { value: "🏠", label: "House" },
  { value: "🚗", label: "Car" },
  { value: "🎓", label: "Education" },
  { value: "✈️", label: "Travel" },
  { value: "💰", label: "Money" },
  { value: "🎯", label: "Target" },
  { value: "🏥", label: "Healthcare" },
  { value: "📱", label: "Tech" },
  { value: "💍", label: "Wedding" },
  { value: "👶", label: "Baby" },
  { value: "🎉", label: "Event" },
  { value: "🛡️", label: "Emergency" },
];

export function GoalForm({ onSuccess, onCancel }: GoalFormProps) {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [color, setColor] = useState("#22C55E");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addGoal = useMutation(api.savingsGoals.add);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter a goal name");
      return;
    }

    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError("Please enter a valid target amount");
      return;
    }

    const currentAmountValue = currentAmount ? parseFloat(currentAmount) : 0;
    if (currentAmountValue < 0) {
      setError("Current amount cannot be negative");
      return;
    }

    setLoading(true);
    try {
      await addGoal({
        name: name.trim(),
        targetAmount: parseToCents(targetAmount),
        currentAmount: parseToCents(currentAmountValue.toString()),
        icon,
        color,
        priority,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      <Input
        label="Goal Name"
        type="text"
        placeholder="e.g., Emergency Fund, Vacation"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Target Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="10000.00"
          value={targetAmount}
          onChange={(e) => setTargetAmount(e.target.value)}
          leftIcon={<span className="text-gray-500">$</span>}
          required
        />

        <Input
          label="Starting Amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={currentAmount}
          onChange={(e) => setCurrentAmount(e.target.value)}
          leftIcon={<span className="text-gray-500">$</span>}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Select
          label="Icon"
          options={ICON_OPTIONS}
          value={icon}
          onChange={setIcon}
        />

        <Select
          label="Color"
          options={COLOR_OPTIONS}
          value={color}
          onChange={setColor}
        />
      </div>

      <Select
        label="Priority"
        options={PRIORITY_OPTIONS}
        value={priority}
        onChange={setPriority}
      />

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          Add Goal
        </Button>
      </div>
    </form>
  );
}
