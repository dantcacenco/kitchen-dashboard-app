"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button, Input, ProgressBar } from "@/components/ui";
import { formatCurrency, formatDateRelative, parseToCents } from "@/lib/formatters";
import { Plus, Minus, TrendingUp, TrendingDown, History } from "lucide-react";

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: Id<"savingsGoals"> | null;
}

export function GoalModal({ isOpen, onClose, goalId }: GoalModalProps) {
  const [mode, setMode] = useState<"view" | "add" | "subtract">("view");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const goal = useQuery(api.savingsGoals.get, goalId ? { id: goalId } : "skip");
  const history = useQuery(
    api.savingsGoals.getHistory,
    goalId ? { goalId } : "skip"
  );
  const addFunds = useMutation(api.savingsGoals.addFunds);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalId || !amount) return;

    setLoading(true);
    try {
      const cents = parseToCents(amount);
      await addFunds({
        goalId,
        amount: mode === "subtract" ? -cents : cents,
        note: note.trim() || undefined,
      });
      setAmount("");
      setNote("");
      setMode("view");
    } catch (err) {
      console.error("Failed to update goal:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setMode("view");
    setAmount("");
    setNote("");
    onClose();
  };

  if (!goal) {
    return (
      <Modal isOpen={isOpen} onClose={resetAndClose} title="Loading..." size="md">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </Modal>
    );
  }

  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  const remaining = goal.targetAmount - goal.currentAmount;

  return (
    <Modal isOpen={isOpen} onClose={resetAndClose} title={goal.name} size="md">
      <div className="space-y-6">
        {/* Progress Section */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{goal.icon}</span>
            <div className="flex-1">
              <div className="flex justify-between items-baseline">
                <span className="text-2xl font-bold" style={{ color: goal.color }}>
                  {formatCurrency(goal.currentAmount)}
                </span>
                <span className="text-gray-500">
                  of {formatCurrency(goal.targetAmount)}
                </span>
              </div>
            </div>
          </div>
          <ProgressBar value={progress * 100} color={goal.color} size="lg" />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-gray-500">
              {remaining > 0
                ? `${formatCurrency(remaining)} to go`
                : "Goal reached!"}
            </span>
            <span className="font-medium" style={{ color: goal.color }}>
              {(progress * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Action Buttons or Form */}
        {mode === "view" ? (
          <div className="flex gap-3">
            <Button
              onClick={() => setMode("add")}
              className="flex-1"
              variant="primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Funds
            </Button>
            <Button
              onClick={() => setMode("subtract")}
              className="flex-1"
              variant="secondary"
            >
              <Minus className="w-4 h-4 mr-2" />
              Withdraw
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              {mode === "add" ? (
                <TrendingUp className="w-5 h-5 text-green-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <span className="font-medium">
                {mode === "add" ? "Add Funds" : "Withdraw Funds"}
              </span>
            </div>
            <Input
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              leftIcon={<span className="text-gray-500">$</span>}
              autoFocus
            />
            <Input
              type="text"
              placeholder="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMode("view");
                  setAmount("");
                  setNote("");
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="flex-1"
                variant={mode === "add" ? "primary" : "danger"}
              >
                {mode === "add" ? "Add" : "Withdraw"}
              </Button>
            </div>
          </form>
        )}

        {/* History Section */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-gray-500" />
            <h3 className="font-medium text-gray-900">History</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {history && history.length > 0 ? (
              history.map((entry) => (
                <div
                  key={entry._id}
                  className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {entry.amount >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <div>
                      <span
                        className={`font-medium ${
                          entry.amount >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {entry.amount >= 0 ? "+" : ""}
                        {formatCurrency(entry.amount)}
                      </span>
                      {entry.note && (
                        <p className="text-xs text-gray-500">{entry.note}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">
                    {formatDateRelative(entry.date)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No history yet
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
