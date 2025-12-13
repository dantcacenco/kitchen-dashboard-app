"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Input, Select } from "@/components/ui";
import { MultiSelect } from "@/components/ui/MultiSelect";
import { DEFAULT_INCOME_SOURCES } from "@/lib/constants";
import { parseToCents } from "@/lib/formatters";
import { Id } from "@/convex/_generated/dataModel";

interface IncomeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function IncomeForm({ onSuccess, onCancel }: IncomeFormProps) {
  const [amount, setAmount] = useState("");
  const [sources, setSources] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const users = useQuery(api.users.list);
  const incomeSources = useQuery(api.incomeSources.list);
  const addIncome = useMutation(api.income.add);
  const addIncomeSource = useMutation(api.incomeSources.add);

  // Combine default sources with custom ones from DB
  const allSources = [
    ...DEFAULT_INCOME_SOURCES.map((s) => ({
      value: s.name.toLowerCase(),
      label: s.name,
      color: s.color,
    })),
    ...(incomeSources || []).map((s) => ({
      value: s.name.toLowerCase(),
      label: s.name,
      color: s.color,
    })),
  ].filter(
    (s, i, arr) => arr.findIndex((x) => x.value === s.value) === i // dedupe
  );

  const userOptions = (users || []).map((u) => ({
    value: u._id,
    label: u.name,
  }));

  const handleCreateSource = async (name: string) => {
    const colors = ["#4CAF50", "#E91E63", "#2196F3", "#9C27B0", "#FF9800"];
    const color = colors[Math.floor(Math.random() * colors.length)];
    await addIncomeSource({ name, color });
    setSources([...sources, name.toLowerCase()]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (sources.length === 0) {
      setError("Please select at least one source");
      return;
    }

    if (!userId) {
      setError("Please select who earned this income");
      return;
    }

    setLoading(true);
    try {
      await addIncome({
        amount: parseToCents(amount),
        source: sources.join(", "),
        description: description.trim() || undefined,
        date: new Date(date).getTime(),
        userId: userId as Id<"users">,
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add income");
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
        label="Amount"
        type="number"
        step="0.01"
        min="0"
        placeholder="0.00"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        leftIcon={<span className="text-gray-500">$</span>}
        required
      />

      <Select
        label="Who earned this?"
        options={userOptions}
        value={userId}
        onChange={setUserId}
        placeholder="Select person..."
      />

      <div className="relative">
        <MultiSelect
          label="Source(s)"
          options={allSources}
          selected={sources}
          onChange={setSources}
          onCreateNew={handleCreateSource}
          placeholder="Type to search or create..."
        />
      </div>

      <Input
        label="Description (optional)"
        type="text"
        placeholder="Any notes about this income?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <Input
        label="Date"
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        required
      />

      <div className="flex gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading} className="flex-1">
          Add Income
        </Button>
      </div>
    </form>
  );
}
