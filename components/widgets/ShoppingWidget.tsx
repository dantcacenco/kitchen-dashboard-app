"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, Plus, X, Check, Send } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

interface PendingItem {
  tempId: string;
  item: string;
  category: string;
  priority: string;
  completed: boolean;
  createdAt: number;
}

export function ShoppingWidget() {
  const [newItem, setNewItem] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Optimistic state
  const [pendingItems, setPendingItems] = useState<PendingItem[]>([]);
  const [pendingToggles, setPendingToggles] = useState<Map<string, boolean>>(new Map());
  const [pendingDeletes, setPendingDeletes] = useState<Set<string>>(new Set());

  // Convex queries and mutations
  const items = useQuery(api.shoppingList.list);
  const addItem = useMutation(api.shoppingList.add);
  const toggleItem = useMutation(api.shoppingList.toggle);
  const removeItem = useMutation(api.shoppingList.remove);
  const clearAll = useMutation(api.shoppingList.clearAll);

  const handleAddItem = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticItem: PendingItem = {
      tempId,
      item: newItem.trim(),
      category: "groceries",
      priority: "normal",
      completed: false,
      createdAt: Date.now(),
    };

    // Add to pending immediately
    setPendingItems(prev => [...prev, optimisticItem]);
    setNewItem("");

    try {
      await addItem({
        item: optimisticItem.item,
        category: "groceries",
        priority: "normal",
      });
    } finally {
      // Remove from pending (server data will take over)
      setPendingItems(prev => prev.filter(p => p.tempId !== tempId));
    }
  }, [newItem, addItem]);

  const handleToggle = useCallback(async (id: Id<"shoppingList">, completed: boolean) => {
    const idStr = id.toString();

    // Optimistically update
    setPendingToggles(prev => new Map(prev).set(idStr, !completed));

    try {
      await toggleItem({ id, completed: !completed });
    } finally {
      // Clear pending toggle (server data will take over)
      setPendingToggles(prev => {
        const next = new Map(prev);
        next.delete(idStr);
        return next;
      });
    }
  }, [toggleItem]);

  const handleRemove = useCallback(async (id: Id<"shoppingList">) => {
    const idStr = id.toString();

    // Optimistically hide
    setPendingDeletes(prev => new Set(prev).add(idStr));

    try {
      await removeItem({ id });
    } catch {
      // On error, restore the item
      setPendingDeletes(prev => {
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
    }
    // On success, pending delete will be cleared naturally when server data updates
  }, [removeItem]);

  const handleSendNotification = useCallback(async () => {
    if (isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/notify-shopping', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send notification');
      }

      // Could show a toast here, but for now just log
      console.log('Notification sent successfully');
    } catch (error) {
      console.error('Error sending notification:', error);
    } finally {
      setIsSending(false);
    }
  }, [isSending]);

  const handleClearAll = useCallback(async () => {
    if (!confirm('Are you sure you want to clear the entire list?')) return;

    // Get all current item IDs
    const allIds = (items || []).map(item => item._id.toString());

    // Optimistically hide all items
    setPendingDeletes(prev => {
      const next = new Set(prev);
      allIds.forEach(id => next.add(id));
      return next;
    });

    try {
      await clearAll();
    } catch (error) {
      console.error('Error clearing list:', error);
      // On error, restore all items
      setPendingDeletes(prev => {
        const next = new Set(prev);
        allIds.forEach(id => next.delete(id));
        return next;
      });
    }
  }, [clearAll, items]);

  // Merge server items with optimistic state
  const displayItems = useMemo(() => {
    const serverItems = (items || [])
      .filter(item => !pendingDeletes.has(item._id.toString()))
      .map(item => {
        const idStr = item._id.toString();
        const pendingToggle = pendingToggles.get(idStr);
        return {
          ...item,
          completed: pendingToggle !== undefined ? pendingToggle : item.completed,
        };
      });

    // Add pending items that haven't been synced yet
    const pendingAsItems = pendingItems.map(p => ({
      _id: p.tempId as unknown as Id<"shoppingList">,
      item: p.item,
      category: p.category,
      priority: p.priority,
      completed: p.completed,
      createdAt: p.createdAt,
      isPending: true,
    }));

    return [...serverItems, ...pendingAsItems];
  }, [items, pendingItems, pendingToggles, pendingDeletes]);

  // Sort: uncompleted first, then by creation date
  const sortedItems = useMemo(() => {
    return [...displayItems].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return b.createdAt - a.createdAt;
    });
  }, [displayItems]);

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="widget-drag-handle flex items-center gap-2 mb-3">
        <ShoppingCart className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Shopping List</h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={handleSendNotification}
            disabled={isSending}
            className={cn(
              "p-1 rounded transition-colors",
              isSending
                ? "bg-blue-100 text-blue-400 cursor-not-allowed"
                : "hover:bg-blue-100 text-blue-500 hover:text-blue-600"
            )}
            title="Send notification"
          >
            <Send className={cn("w-4 h-4", isSending && "animate-pulse")} />
          </button>
          <button
            onClick={handleClearAll}
            className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Clear entire list"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Add item form */}
      <form onSubmit={handleAddItem} className="mb-3">
        <Input
          placeholder="Add item..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          leftIcon={<Plus className="w-4 h-4" />}
        />
      </form>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto space-y-1">
        {sortedItems.map((item) => {
          const isPending = "isPending" in item && item.isPending;
          return (
            <div
              key={item._id.toString()}
              className={cn(
                "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group transition-opacity",
                item.completed && "opacity-50",
                isPending && "opacity-70"
              )}
            >
              <button
                onClick={() => !isPending && handleToggle(item._id as Id<"shoppingList">, item.completed)}
                disabled={isPending}
                className={cn(
                  "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                  item.completed
                    ? "bg-green-500 border-green-500"
                    : "border-gray-300 hover:border-green-400 active:border-green-400",
                  isPending && "cursor-not-allowed"
                )}
              >
                {item.completed && <Check className="w-3 h-3 text-white" />}
              </button>
              <span
                onClick={() => !isPending && handleToggle(item._id as Id<"shoppingList">, item.completed)}
                className={cn(
                  "flex-1 text-sm cursor-pointer select-none",
                  item.completed && "line-through text-gray-400"
                )}
              >
                {item.item}
              </span>
              {!isPending && (
                <button
                  onClick={() => handleRemove(item._id as Id<"shoppingList">)}
                  className="p-1 hover:bg-red-100 active:bg-red-100 rounded transition-colors flex-shrink-0 md:opacity-0 md:group-hover:opacity-100"
                >
                  <X className="w-4 h-4 text-red-500" />
                </button>
              )}
            </div>
          );
        })}

        {sortedItems.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">
            No items yet. Add something!
          </p>
        )}
      </div>
    </Card>
  );
}
