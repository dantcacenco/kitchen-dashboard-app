"use client";

import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ShoppingItem, ShoppingCategory, ShoppingPriority } from "@/types";

export function useShopping() {
  const items = useQuery(api.shoppingList.list);
  const addItem = useMutation(api.shoppingList.add);
  const toggleItem = useMutation(api.shoppingList.toggle);
  const removeItem = useMutation(api.shoppingList.remove);
  const clearCompletedItems = useMutation(api.shoppingList.clearCompleted);

  // Track pending optimistic updates
  const [pendingToggles, setPendingToggles] = useState<Set<string>>(new Set());

  // Sort items: uncompleted first, then by priority, then by creation date
  const sortedItems = useMemo(() => {
    if (!items) return [];
    const priorityOrder: Record<ShoppingPriority, number> = {
      urgent: 0,
      normal: 1,
      low: 2,
    };
    return [...items].sort((a, b) => {
      // Completed items go to the bottom
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      // Sort by priority
      const priorityDiff =
        priorityOrder[a.priority as ShoppingPriority] -
        priorityOrder[b.priority as ShoppingPriority];
      if (priorityDiff !== 0) return priorityDiff;
      // Sort by creation date (newest first)
      return b.createdAt - a.createdAt;
    });
  }, [items]);

  // Count incomplete items
  const incompleteCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => !i.completed).length;
  }, [items]);

  // Count completed items
  const completedCount = useMemo(() => {
    if (!items) return 0;
    return items.filter((i) => i.completed).length;
  }, [items]);

  const add = async (data: {
    item: string;
    quantity?: string;
    category: string;
    priority: string;
  }) => {
    return addItem(data);
  };

  const toggle = useCallback(
    async (id: Id<"shoppingList">, completed: boolean) => {
      // Optimistic update tracking
      setPendingToggles((prev) => new Set(prev).add(id));
      try {
        await toggleItem({ id, completed });
      } finally {
        setPendingToggles((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    },
    [toggleItem]
  );

  const remove = async (id: Id<"shoppingList">) => {
    return removeItem({ id });
  };

  const clearCompleted = async () => {
    return clearCompletedItems();
  };

  const isPending = (id: Id<"shoppingList">) => pendingToggles.has(id);

  return {
    items: sortedItems,
    loading: items === undefined,
    incompleteCount,
    completedCount,
    add,
    toggle,
    remove,
    clearCompleted,
    isPending,
  };
}
