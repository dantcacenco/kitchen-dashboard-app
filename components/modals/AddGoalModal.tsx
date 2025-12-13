"use client";

import { Modal } from "@/components/ui";
import { GoalForm } from "@/components/forms/GoalForm";

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddGoalModal({ isOpen, onClose }: AddGoalModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Savings Goal" size="sm">
      <GoalForm onSuccess={onClose} onCancel={onClose} />
    </Modal>
  );
}
