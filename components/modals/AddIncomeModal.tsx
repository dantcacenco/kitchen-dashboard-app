"use client";

import { Modal } from "@/components/ui";
import { IncomeForm } from "@/components/forms/IncomeForm";

interface AddIncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddIncomeModal({ isOpen, onClose }: AddIncomeModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Income" size="sm">
      <IncomeForm onSuccess={onClose} onCancel={onClose} />
    </Modal>
  );
}
