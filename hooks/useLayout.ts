"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LayoutItem } from "@/types";
import { DEFAULT_LAYOUT } from "@/lib/constants";
import { debounce } from "@/lib/utils";

export function useLayout() {
  const savedLayout = useQuery(api.dashboardLayout.get);
  const saveLayoutMutation = useMutation(api.dashboardLayout.save);

  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load saved layout
  useEffect(() => {
    if (savedLayout?.layouts) {
      try {
        const parsed = JSON.parse(savedLayout.layouts);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setLayout(parsed);
        }
      } catch (e) {
        console.error("Failed to parse saved layout:", e);
      }
    }
  }, [savedLayout]);

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (newLayout: LayoutItem[]) => {
      try {
        await saveLayoutMutation({ layouts: JSON.stringify(newLayout) });
        setHasChanges(false);
      } catch (e) {
        console.error("Failed to save layout:", e);
      }
    }, 1000),
    [saveLayoutMutation]
  );

  const updateLayout = useCallback(
    (newLayout: LayoutItem[]) => {
      setLayout(newLayout);
      setHasChanges(true);
      debouncedSave(newLayout);
    },
    [debouncedSave]
  );

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
    setHasChanges(true);
    debouncedSave(DEFAULT_LAYOUT);
  }, [debouncedSave]);

  const toggleEditing = useCallback(() => {
    setIsEditing((prev) => !prev);
  }, []);

  return {
    layout,
    loading: savedLayout === undefined,
    isEditing,
    hasChanges,
    updateLayout,
    resetLayout,
    toggleEditing,
  };
}
