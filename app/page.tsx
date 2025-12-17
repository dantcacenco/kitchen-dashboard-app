"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/layout/Dashboard";

export default function Home() {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <main className="min-h-screen bg-gray-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        <Header isEditing={isEditing} onToggleEdit={() => setIsEditing(!isEditing)} />
        <Dashboard isEditing={isEditing} />
      </div>
    </main>
  );
}
