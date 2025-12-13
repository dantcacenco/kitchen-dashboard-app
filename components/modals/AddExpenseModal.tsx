"use client";

import { Modal } from "@/components/ui";
import { ExpenseForm } from "@/components/forms/ExpenseForm";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

export function AddExpenseModal({
  isOpen,
  onClose,
  initialCategory,
}: AddExpenseModalProps) {
  const categoryLabel = initialCategory
    ? EXPENSE_CATEGORIES[initialCategory as keyof typeof EXPENSE_CATEGORIES]?.label
    : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={categoryLabel ? `Add ${categoryLabel} Expense` : "Add Expense"}
      size="sm"
    >
      <ExpenseForm
        initialCategory={initialCategory}
        onSuccess={onClose}
        onCancel={onClose}
      />
    </Modal>
  );
}
