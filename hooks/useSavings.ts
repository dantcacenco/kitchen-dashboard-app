"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { SavingsGoal, SavingsHistoryEntry, Priority } from "@/types";

export function useSavings() {
  const goals = useQuery(api.savingsGoals.list);
  const addGoal = useMutation(api.savingsGoals.add);
  const updateGoal = useMutation(api.savingsGoals.update);
  const removeGoal = useMutation(api.savingsGoals.remove);
  const addFunds = useMutation(api.savingsGoals.addFunds);

  // Sort goals by priority
  const sortedGoals = useMemo(() => {
    if (!goals) return [];
    const priorityOrder: Record<Priority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    return [...goals].sort(
      (a, b) => priorityOrder[a.priority as Priority] - priorityOrder[b.priority as Priority]
    );
  }, [goals]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!goals) return { current: 0, target: 0, percent: 0 };
    const current = goals.reduce((sum, g) => sum + g.currentAmount, 0);
    const target = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    return {
      current,
      target,
      percent: target > 0 ? (current / target) * 100 : 0,
    };
  }, [goals]);

  const add = async (data: {
    name: string;
    targetAmount: number;
    currentAmount: number;
    icon: string;
    color: string;
    priority: string;
  }) => {
    return addGoal(data);
  };

  const update = async (
    id: Id<"savingsGoals">,
    data: {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      icon?: string;
      color?: string;
      priority?: string;
    }
  ) => {
    return updateGoal({ id, ...data });
  };

  const remove = async (id: Id<"savingsGoals">) => {
    return removeGoal({ id });
  };

  const contribute = async (
    goalId: Id<"savingsGoals">,
    amount: number,
    note?: string
  ) => {
    return addFunds({ goalId, amount, note });
  };

  return {
    goals: sortedGoals,
    loading: goals === undefined,
    totals,
    add,
    update,
    remove,
    contribute,
  };
}

export function useSavingsGoal(goalId: Id<"savingsGoals"> | null) {
  const goal = useQuery(api.savingsGoals.get, goalId ? { id: goalId } : "skip");
  const history = useQuery(
    api.savingsGoals.getHistory,
    goalId ? { goalId } : "skip"
  );
  const addFunds = useMutation(api.savingsGoals.addFunds);
  const updateGoal = useMutation(api.savingsGoals.update);

  const progress = useMemo(() => {
    if (!goal) return 0;
    return goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;
  }, [goal]);

  const remaining = useMemo(() => {
    if (!goal) return 0;
    return Math.max(0, goal.targetAmount - goal.currentAmount);
  }, [goal]);

  const contribute = async (amount: number, note?: string) => {
    if (!goalId) return;
    return addFunds({ goalId, amount, note });
  };

  const update = async (data: {
    name?: string;
    targetAmount?: number;
    currentAmount?: number;
    icon?: string;
    color?: string;
    priority?: string;
  }) => {
    if (!goalId) return;
    return updateGoal({ id: goalId, ...data });
  };

  return {
    goal,
    history: history || [],
    loading: goal === undefined,
    progress,
    remaining,
    contribute,
    update,
  };
}
