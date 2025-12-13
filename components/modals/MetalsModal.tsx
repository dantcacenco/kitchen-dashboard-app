"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Modal, Button, Input, Select } from "@/components/ui";
import {
  formatCurrency,
  formatOunces,
  formatDateRelative,
  formatDate,
  parseToCents,
} from "@/lib/formatters";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Coins,
  CircleDot,
  Trash2,
} from "lucide-react";

interface MetalsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MetalsModal({ isOpen, onClose }: MetalsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [metal, setMetal] = useState("gold");
  const [quantity, setQuantity] = useState("");
  const [pricePerOz, setPricePerOz] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const holdings = useQuery(api.metalHoldings.listActive);
  const stats = useQuery(api.metalHoldings.getPortfolioStats);
  const addHolding = useMutation(api.metalHoldings.add);
  const removeHolding = useMutation(api.metalHoldings.remove);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quantity || !pricePerOz) return;

    setLoading(true);
    try {
      await addHolding({
        metal,
        quantityOz: parseFloat(quantity),
        purchasePricePerOz: parseToCents(pricePerOz),
        purchaseDate: new Date(purchaseDate).getTime(),
        note: note.trim() || undefined,
      });
      setQuantity("");
      setPricePerOz("");
      setNote("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to add holding:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: Id<"metalHoldings">) => {
    if (!confirm("Delete this holding?")) return;
    await removeHolding({ id });
  };

  const isGain = (stats?.gainLoss ?? 0) >= 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gold & Silver" size="lg">
      <div className="space-y-6">
        {/* Portfolio Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
            <div className="flex items-center gap-2 text-yellow-700 mb-2">
              <CircleDot className="w-5 h-5" />
              <span className="font-medium">Gold</span>
            </div>
            <div className="text-2xl font-bold text-yellow-800">
              {formatOunces(stats?.goldOz ?? 0)}
            </div>
            <div className="text-sm text-yellow-600">
              @ {formatCurrency(stats?.goldPrice ?? 0)}/oz
            </div>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-gray-700 mb-2">
              <Coins className="w-5 h-5" />
              <span className="font-medium">Silver</span>
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {formatOunces(stats?.silverOz ?? 0)}
            </div>
            <div className="text-sm text-gray-600">
              @ {formatCurrency(stats?.silverPrice ?? 0)}/oz
            </div>
          </div>
        </div>

        {/* Value Summary */}
        <div className="bg-gray-50 rounded-xl p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-500 mb-1">Invested</div>
              <div className="text-lg font-semibold">
                {formatCurrency(stats?.totalInvested ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Current Value</div>
              <div className="text-lg font-semibold">
                {formatCurrency(stats?.totalCurrentValue ?? 0)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Gain/Loss</div>
              <div
                className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                  isGain ? "text-green-600" : "text-red-600"
                }`}
              >
                {isGain ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {formatCurrency(Math.abs(stats?.gainLoss ?? 0))}
                <span className="text-sm">
                  ({(stats?.gainLossPercent ?? 0).toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add Purchase Form */}
        {showAddForm ? (
          <form
            onSubmit={handleSubmit}
            className="bg-blue-50 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <Plus className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-900">Add Purchase</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Metal"
                options={[
                  { value: "gold", label: "Gold" },
                  { value: "silver", label: "Silver" },
                ]}
                value={metal}
                onChange={setMetal}
              />
              <Input
                label="Quantity (oz)"
                type="number"
                step="0.01"
                min="0"
                placeholder="1.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Price per oz"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={pricePerOz}
                onChange={(e) => setPricePerOz(e.target.value)}
                leftIcon={<span className="text-gray-500">$</span>}
              />
              <Input
                label="Purchase Date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
              />
            </div>
            <Input
              label="Note (optional)"
              type="text"
              placeholder="e.g., 1oz American Eagle"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowAddForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" loading={loading} className="flex-1">
                Add Purchase
              </Button>
            </div>
          </form>
        ) : (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase
          </Button>
        )}

        {/* Holdings List */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">Holdings</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {holdings && holdings.length > 0 ? (
              holdings.map((holding) => {
                const currentPrice =
                  holding.metal === "gold"
                    ? (stats?.goldPrice ?? 0)
                    : (stats?.silverPrice ?? 0);
                const currentValue = holding.quantityOz * currentPrice;
                const purchaseValue =
                  holding.quantityOz * holding.purchasePricePerOz;
                const gain = currentValue - purchaseValue;
                const gainPercent =
                  purchaseValue > 0 ? (gain / purchaseValue) * 100 : 0;

                return (
                  <div
                    key={holding._id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          holding.metal === "gold"
                            ? "bg-yellow-100"
                            : "bg-gray-200"
                        }`}
                      >
                        {holding.metal === "gold" ? (
                          <CircleDot className="w-5 h-5 text-yellow-600" />
                        ) : (
                          <Coins className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {formatOunces(holding.quantityOz)}{" "}
                          {holding.metal === "gold" ? "Gold" : "Silver"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Bought @ {formatCurrency(holding.purchasePricePerOz)}
                          /oz
                          {holding.note && ` - ${holding.note}`}
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatDate(holding.purchaseDate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(currentValue)}
                        </div>
                        <div
                          className={`text-xs ${
                            gain >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {gain >= 0 ? "+" : ""}
                          {formatCurrency(gain)} ({gainPercent.toFixed(1)}%)
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(holding._id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">
                No holdings yet. Add your first purchase above.
              </p>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
