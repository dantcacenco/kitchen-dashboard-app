"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button, Input, Select } from "@/components/ui";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { parseToCents } from "@/lib/formatters";

interface ExpenseFormProps {
  initialCategory?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({
  initialCategory,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(initialCategory || "groceries");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addTransaction = useMutation(api.transactions.add);

  const categoryOptions = Object.entries(EXPENSE_CATEGORIES).map(
    ([value, { label }]) => ({
      value,
      label,
    })
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description");
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        amount: parseToCents(amount),
        category,
        description: description.trim(),
        date: new Date(date).getTime(),
      });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add expense");
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
        label="Category"
        options={categoryOptions}
        value={category}
        onChange={setCategory}
      />

      <Input
        label="Description"
        type="text"
        placeholder="What was this expense for?"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
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
          Add Expense
        </Button>
      </div>
    </form>
  );
}
