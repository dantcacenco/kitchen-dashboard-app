"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ShoppingCart, Plus, X, Check } from "lucide-react";
import { Card, Input } from "@/components/ui";
import { cn } from "@/lib/utils";
import { Id } from "@/convex/_generated/dataModel";

export function ShoppingWidget() {
  const [newItem, setNewItem] = useState("");

  // Convex queries and mutations
  const items = useQuery(api.shoppingList.list);
  const addItem = useMutation(api.shoppingList.add);
  const toggleItem = useMutation(api.shoppingList.toggle);
  const removeItem = useMutation(api.shoppingList.remove);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    await addItem({
      item: newItem.trim(),
      category: "groceries",
      priority: "normal",
    });
    setNewItem("");
  };

  const handleToggle = async (id: Id<"shoppingList">, completed: boolean) => {
    await toggleItem({ id, completed: !completed });
  };

  const handleRemove = async (id: Id<"shoppingList">) => {
    await removeItem({ id });
  };

  // Sort: uncompleted first, then by creation date
  const sortedItems = items?.slice().sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="widget-drag-handle flex items-center gap-2 mb-3">
        <ShoppingCart className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Shopping List</h3>
        <button className="ml-auto p-1 hover:bg-gray-100 rounded">
          <X className="w-4 h-4 text-gray-400" />
        </button>
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
        {sortedItems?.map((item) => (
          <div
            key={item._id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group",
              item.completed && "opacity-50"
            )}
          >
            <button
              onClick={() => handleToggle(item._id, item.completed)}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                item.completed
                  ? "bg-green-500 border-green-500"
                  : "border-gray-300 hover:border-green-400"
              )}
            >
              {item.completed && <Check className="w-3 h-3 text-white" />}
            </button>
            <span
              className={cn(
                "flex-1 text-sm",
                item.completed && "line-through text-gray-400"
              )}
            >
              {item.item}
            </span>
            <button
              onClick={() => handleRemove(item._id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ))}

        {(!items || items.length === 0) && (
          <p className="text-sm text-gray-400 text-center py-4">
            No items yet. Add something!
          </p>
        )}
      </div>
    </Card>
  );
}
