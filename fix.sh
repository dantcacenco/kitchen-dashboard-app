#!/bin/bash

# update-dashboard.sh
# Complete dashboard update with all requested features

echo "🚀 Updating Kitchen Dashboard with all requested features..."
echo "=================================================="

# Navigate to project directory
cd kitchen-dashboard-app

# Step 1: Update Dashboard.js component
echo -e "\n📝 Updating Dashboard component..."
cat > components/Dashboard.js << 'EOF'
'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Cloud, CloudRain, Sun, CloudSnow, CloudDrizzle,
  ShoppingCart, TrendingUp, Receipt, Target,
  DollarSign, Plus, X, Check, ChevronDown, ChevronUp,
  Utensils, Fuel, Wrench, Home, Heart, Briefcase,
  ShoppingBag, Car, Zap, Pill, Coffee, MoreHorizontal
} from 'lucide-react';

export default function Dashboard() {
  const [weather, setWeather] = useState(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [goals, setGoals] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [editingGoal, setEditingGoal] = useState(null);
  const [addingInvestment, setAddingInvestment] = useState(false);
  const [investmentActivity, setInvestmentActivity] = useState('');
  const [investmentAmount, setInvestmentAmount] = useState('');

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch all data on mount
  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchAllData = async () => {
    try {
      await Promise.all([
        fetchWeather(),
        fetchGoals(),
        fetchShoppingList(),
        fetchTransactions(),
        fetchSettings()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/notion?database=goals');
      if (!res.ok) throw new Error('Goals fetch failed');
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Goals fetch error:', error);
      setGoals([]);
    }
  };

  const fetchShoppingList = async () => {
    try {
      const res = await fetch('/api/notion?database=shopping');
      if (!res.ok) throw new Error('Shopping list fetch failed');
      const data = await res.json();
      setShoppingList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Shopping list fetch error:', error);
      setShoppingList([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/notion?database=transactions');
      if (!res.ok) throw new Error('Transactions fetch failed');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Transactions fetch error:', error);
      setTransactions([]);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notion?database=settings');
      if (!res.ok) throw new Error('Settings fetch failed');
      const data = await res.json();
      const settingsMap = {};
      if (Array.isArray(data)) {
        data.forEach(item => {
          const name = item.properties?.Setting_Name?.title?.[0]?.text?.content;
          const value = item.properties?.Value?.rich_text?.[0]?.text?.content;
          if (name) settingsMap[name] = value;
        });
      }
      setSettings(settingsMap);
    } catch (error) {
      console.error('Settings fetch error:', error);
      setSettings({});
    }
  };

  // Calculate this month's spending
  const getMonthlySpending = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = t.properties?.Date?.date?.start;
        if (!date) return false;
        const transDate = new Date(date);
        return transDate.getMonth() === currentMonth && 
               transDate.getFullYear() === currentYear &&
               t.properties?.Category?.select?.name !== 'Income';
      })
      .reduce((sum, t) => sum + (t.properties?.Amount?.number || 0), 0);
  };

  // Calculate YTD income for tax tracking
  const getYTDIncome = () => {
    const currentYear = new Date().getFullYear();
    
    return transactions
      .filter(t => {
        const date = t.properties?.Date?.date?.start;
        if (!date) return false;
        const transDate = new Date(date);
        return transDate.getFullYear() === currentYear &&
               t.properties?.Category?.select?.name === 'Income';
      })
      .reduce((sum, t) => sum + (t.properties?.Amount?.number || 0), 0);
  };

  // Calculate retirement projections
  const calculateRetirementProjection = () => {
    const currentInvestment = goals.find(g => 
      g.properties?.Category?.select?.name === 'Investment'
    )?.properties?.Current_Amount?.number || 0;
    
    const yearsToRetirement = 2055 - new Date().getFullYear();
    const futureValue = currentInvestment * Math.pow(1.08, yearsToRetirement);
    
    return Math.round(futureValue);
  };

  // Get weather icon
  const getWeatherIcon = (code) => {
    if (!code) return <Cloud className="w-12 h-12" />;
    if (code <= 3) return <Sun className="w-12 h-12" />;
    if (code <= 48) return <Cloud className="w-12 h-12" />;
    if (code <= 65) return <CloudDrizzle className="w-12 h-12" />;
    if (code <= 77) return <CloudSnow className="w-12 h-12" />;
    return <CloudRain className="w-12 h-12" />;
  };

  // Format date and time
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      second: '2-digit',
      hour12: true 
    });
  };

  // Handle expense submission
  const handleExpenseSubmit = async () => {
    if (!expenseAmount || !selectedCategory) return;
    
    try {
      const res = await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: 'transactions',
          data: {
            Date: new Date().toISOString(),
            Amount: parseFloat(expenseAmount),
            Category: selectedCategory,
            Description: `Quick expense - ${selectedCategory}`
          }
        })
      });
      
      if (res.ok) {
        await fetchTransactions();
        setExpenseModalOpen(false);
        setExpenseAmount('');
        setSelectedCategory('');
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  // Handle shopping list item toggle
  const toggleShoppingItem = async (item) => {
    try {
      const res = await fetch('/api/notion', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId: item.id,
          data: {
            Purchased: !item.properties?.Purchased?.checkbox
          }
        })
      });
      
      if (res.ok) {
        await fetchShoppingList();
      }
    } catch (error) {
      console.error('Error toggling item:', error);
    }
  };

  // Add new shopping item
  const handleAddShoppingItem = async (e) => {
    if (e.key === 'Enter' && newShoppingItem.trim()) {
      try {
        const res = await fetch('/api/notion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            database: 'shopping',
            data: {
              Item: newShoppingItem.trim(),
              Purchased: false,
              Date_Added: new Date().toISOString()
            }
          })
        });
        
        if (res.ok) {
          setNewShoppingItem('');
          await fetchShoppingList();
        }
      } catch (error) {
        console.error('Error adding item:', error);
      }
    }
  };

  // Handle investment addition
  const handleAddInvestment = async () => {
    if (!investmentAmount || !investmentActivity) return;
    
    try {
      // First, update the investment goal
      const investmentGoal = goals.find(g => 
        g.properties?.Category?.select?.name === 'Investment'
      );
      
      if (investmentGoal) {
        const currentAmount = investmentGoal.properties?.Current_Amount?.number || 0;
        const newAmount = currentAmount + parseFloat(investmentAmount);
        
        await fetch('/api/notion', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: investmentGoal.id,
            data: {
              Current_Amount: newAmount
            }
          })
        });
      }
      
      // Also record as a transaction
      await fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: 'transactions',
          data: {
            Date: new Date().toISOString(),
            Amount: parseFloat(investmentAmount),
            Category: 'Investment',
            Description: `Saved by: ${investmentActivity}`
          }
        })
      });
      
      await fetchGoals();
      await fetchTransactions();
      setAddingInvestment(false);
      setInvestmentActivity('');
      setInvestmentAmount('');
    } catch (error) {
      console.error('Error adding investment:', error);
    }
  };

  // Expense categories with better icons
  const expenseCategories = [
    { name: 'Food', icon: Utensils },
    { name: 'Gas', icon: Fuel },
    { name: 'Tools/Materials', icon: Wrench },
    { name: 'Housing', icon: Home },
    { name: 'Healthcare', icon: Heart },
    { name: 'Professional', icon: Briefcase },
    { name: 'Shopping', icon: ShoppingBag },
    { name: 'Transportation', icon: Car },
    { name: 'Utilities', icon: Zap },
    { name: 'Pharmacy', icon: Pill },
    { name: 'Coffee', icon: Coffee },
    { name: 'Other', icon: MoreHorizontal }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}! 💰
          </h1>
          <div className="text-gray-500 text-sm md:text-base">
            {formatDate(currentTime)} • {formatTime(currentTime)}
          </div>
        </div>

        {/* Widget Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
          
          {/* Weather Widget - Expandable */}
          <div className={`lg:col-span-2 ${weatherExpanded ? 'lg:row-span-2' : ''} bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer`}
               onClick={() => setWeatherExpanded(!weatherExpanded)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-4xl font-light mb-1">
                  {weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°F` : '--°F'}
                </div>
                <div className="text-lg opacity-90 mb-2">
                  {weather?.current?.weathercode ? 'Mostly Sunny' : 'Loading...'}
                </div>
                {weather?.daily && (
                  <div className="flex items-center gap-4 text-sm opacity-80">
                    <span>H: {Math.round(weather.daily.temperature_2m_max[0])}°</span>
                    <span>L: {Math.round(weather.daily.temperature_2m_min[0])}°</span>
                    <span>💧 {weather.daily.precipitation_probability_max[0]}%</span>
                  </div>
                )}
                <div className="text-xs opacity-60 mt-2">Weaverville, NC</div>
              </div>
              <div className="flex flex-col items-center">
                {getWeatherIcon(weather?.current?.weathercode)}
                {weatherExpanded ? <ChevronUp className="w-5 h-5 mt-2" /> : <ChevronDown className="w-5 h-5 mt-2" />}
              </div>
            </div>
            
            {/* Expanded forecast */}
            {weatherExpanded && weather?.daily && (
              <div className="mt-6 pt-6 border-t border-white/20">
                <h3 className="text-sm font-semibold mb-4 opacity-90">10-Day Forecast</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {weather.daily.time.slice(0, 10).map((date, index) => {
                    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
                    const high = Math.round(weather.daily.temperature_2m_max[index]);
                    const low = Math.round(weather.daily.temperature_2m_min[index]);
                    const precip = weather.daily.precipitation_probability_max[index];
                    
                    return (
                      <div key={date} className="flex items-center justify-between text-sm">
                        <span className="w-12">{dayName}</span>
                        <div className="flex items-center gap-2 flex-1 mx-4">
                          <span className="text-xs opacity-70">{low}°</span>
                          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="h-full bg-white/80 rounded-full"
                                 style={{
                                   marginLeft: `${((low - 20) / 80) * 100}%`,
                                   width: `${((high - low) / 80) * 100}%`
                                 }} />
                          </div>
                          <span className="text-xs">{high}°</span>
                        </div>
                        <span className="text-xs opacity-70">{precip}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Financial Snapshot - Enhanced */}
          <div className="lg:col-span-2 lg:row-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <DollarSign className="w-7 h-7 text-green-600" />
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Retirement Investment</h2>
              </div>
              <button onClick={() => setAddingInvestment(true)}
                      className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Current investment */}
              <div>
                <div className="text-4xl font-bold text-gray-900">
                  ${(goals.find(g => g.properties?.Category?.select?.name === 'Investment')?.properties?.Current_Amount?.number || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Projected 2055: ${calculateRetirementProjection().toLocaleString()}
                </div>
              </div>
              
              {/* Investment growth chart placeholder */}
              <div className="h-24 bg-gradient-to-t from-green-50 to-transparent rounded-lg relative mt-4">
                <svg className="absolute inset-0 w-full h-full">
                  <path
                    d="M 0 80 Q 50 70 100 60 T 200 50 300 30 400 20"
                    stroke="#10B981"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>
              
              {/* Other goals */}
              <div className="space-y-3 pt-4 border-t">
                {goals
                  .filter(g => g.properties?.Category?.select?.name !== 'Investment')
                  .map(goal => {
                    const name = goal.properties?.Goal_Name?.title?.[0]?.text?.content || 'Unnamed Goal';
                    const current = goal.properties?.Current_Amount?.number || 0;
                    const target = goal.properties?.Target_Amount?.number || 1;
                    const progress = target > 0 ? (current / target) * 100 : 0;
                    const icon = goal.properties?.Icon?.rich_text?.[0]?.text?.content || '🎯';
                    
                    return (
                      <div key={goal.id} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{icon} {name}</span>
                          <span className="text-gray-500">
                            ${current.toLocaleString()} / ${target.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
                               style={{ width: `${Math.min(progress, 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Shopping List - iOS Notes Style */}
          <div className="lg:row-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-7 h-7 text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Shopping List</h2>
            </div>
            <div className="space-y-2 max-h-[320px] overflow-y-auto">
              {shoppingList.map((item) => {
                const name = item.properties?.Item?.title?.[0]?.text?.content || 'Unnamed Item';
                const purchased = item.properties?.Purchased?.checkbox || false;
                
                return (
                  <div key={item.id} 
                       className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                       onClick={() => toggleShoppingItem(item)}>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      purchased ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                    }`}>
                      {purchased && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`flex-1 transition-all ${
                      purchased ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}>{name}</span>
                  </div>
                );
              })}
              <input
                type="text"
                value={newShoppingItem}
                onChange={(e) => setNewShoppingItem(e.target.value)}
                onKeyDown={handleAddShoppingItem}
                placeholder="Add item..."
                className="w-full p-2 text-sm border-none outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
              />
            </div>
          </div>

          {/* Quick Expense - Grid Layout */}
          <div className="lg:col-span-2 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-7 h-7" />
                  <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">Quick Expense</h2>
                </div>
                <div className="text-3xl font-bold mt-2">
                  ${getMonthlySpending().toFixed(2)}
                </div>
                <div className="text-sm opacity-80">This month&apos;s spending</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {expenseCategories.slice(0, 6).map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  onClick={() => {
                    setSelectedCategory(name);
                    setExpenseModalOpen(true);
                  }}
                  className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex flex-col items-center gap-1 text-xs"
                >
                  <Icon className="w-4 h-4" />
                  <span>{name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tax Tracker - Simplified */}
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-7 h-7" />
              <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">Tax Tracker</h2>
            </div>
            <div className="text-3xl font-bold">
              ${Math.round(getYTDIncome() * 0.15).toLocaleString()}
            </div>
          </div>

        </div>
      </div>

      {/* Expense Modal */}
      {expenseModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add {selectedCategory} Expense</h3>
              <button onClick={() => setExpenseModalOpen(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="number"
              value={expenseAmount}
              onChange={(e) => setExpenseAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExpenseSubmit()}
              placeholder="Amount"
              className="w-full p-3 text-lg border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={handleExpenseSubmit}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Expense
            </button>
          </div>
        </div>
      )}

      {/* Investment Modal */}
      {addingInvestment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Add Investment</h3>
              <button onClick={() => setAddingInvestment(false)}>
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <input
              type="text"
              value={investmentActivity}
              onChange={(e) => setInvestmentActivity(e.target.value)}
              placeholder="Activity (e.g., Stayed in, Skipped coffee)"
              className="w-full p-3 border rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              autoFocus
            />
            <input
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddInvestment()}
              placeholder="Amount saved"
              className="w-full p-3 text-lg border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAddInvestment}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Add to Retirement
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
EOF
echo "✅ Updated Dashboard component"

# Step 2: Update Weather API route
echo -e "\n📝 Updating Weather API route..."
cat > app/api/weather/route.js << 'EOF'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Weaverville, NC coordinates
    const lat = 35.6973;
    const lon = -82.5607;
    
    // Open-Meteo API (no key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FNew_York&forecast_days=10`;
    
    const response = await fetch(url, {
      next: { revalidate: 600 } // Cache for 10 minutes
    });
    
    if (!response.ok) {
      throw new Error('Weather API failed');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
EOF
echo "✅ Updated Weather API route"

# Step 3: Update Notion API route
echo -e "\n📝 Updating Notion API route..."
cat > app/api/notion/route.js << 'EOF'
import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs
const databases = {
  transactions: process.env.NOTION_TRANSACTIONS_DB_ID,
  goals: process.env.NOTION_GOALS_DB_ID,
  achievements: process.env.NOTION_ACHIEVEMENTS_DB_ID,
  shopping: process.env.NOTION_SHOPPING_DB_ID,
  settings: process.env.NOTION_SETTINGS_DB_ID,
};

// GET - Fetch data from Notion
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const database = searchParams.get('database');
    
    if (!database || !databases[database]) {
      return NextResponse.json(
        { error: 'Invalid database parameter' },
        { status: 400 }
      );
    }
    
    const response = await notion.databases.query({
      database_id: databases[database],
      sorts: database === 'shopping' 
        ? [{ property: 'Date_Added', direction: 'ascending' }]
        : database === 'transactions'
        ? [{ property: 'Date', direction: 'descending' }]
        : [],
    });
    
    return NextResponse.json(response.results || []);
  } catch (error) {
    console.error('Notion GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Notion' },
      { status: 500 }
    );
  }
}

// POST - Create new entries
export async function POST(request) {
  try {
    const body = await request.json();
    const { database, data } = body;
    
    if (!database || !databases[database]) {
      return NextResponse.json(
        { error: 'Invalid database parameter' },
        { status: 400 }
      );
    }
    
    let properties = {};
    
    // Build properties based on database type
    switch (database) {
      case 'transactions':
        properties = {
          Date: { date: { start: data.Date } },
          Amount: { number: data.Amount },
          Category: { select: { name: data.Category } },
          Description: { 
            rich_text: [{ text: { content: data.Description || '' } }] 
          },
          Tax_Deductible: { checkbox: data.Tax_Deductible || false }
        };
        break;
        
      case 'shopping':
        properties = {
          Item: { 
            title: [{ text: { content: data.Item } }] 
          },
          Purchased: { checkbox: data.Purchased || false },
          Category: data.Category ? { select: { name: data.Category } } : undefined,
          Priority: { select: { name: 'Normal' } }
        };
        break;
        
      case 'goals':
        properties = {
          Goal_Name: { 
            title: [{ text: { content: data.Goal_Name } }] 
          },
          Target_Amount: { number: data.Target_Amount },
          Current_Amount: { number: data.Current_Amount || 0 },
          Category: { select: { name: data.Category } },
          Priority: { select: { name: data.Priority || 'Medium' } },
          Monthly_Contribution: { number: data.Monthly_Contribution || 0 },
          Icon: { 
            rich_text: [{ text: { content: data.Icon || '🎯' } }] 
          },
          Color: { 
            rich_text: [{ text: { content: data.Color || '#007AFF' } }] 
          }
        };
        break;
        
      default:
        return NextResponse.json(
          { error: 'Database not configured for POST' },
          { status: 400 }
        );
    }
    
    // Remove undefined properties
    Object.keys(properties).forEach(key => 
      properties[key] === undefined && delete properties[key]
    );
    
    const response = await notion.pages.create({
      parent: { database_id: databases[database] },
      properties
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create in Notion', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH - Update existing entries
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { pageId, data } = body;
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID required for updates' },
        { status: 400 }
      );
    }
    
    let properties = {};
    
    // Build update properties dynamically
    if (data.Purchased !== undefined) {
      properties.Purchased = { checkbox: data.Purchased };
    }
    if (data.Current_Amount !== undefined) {
      properties.Current_Amount = { number: data.Current_Amount };
    }
    if (data.Target_Amount !== undefined) {
      properties.Target_Amount = { number: data.Target_Amount };
    }
    if (data.Monthly_Contribution !== undefined) {
      properties.Monthly_Contribution = { number: data.Monthly_Contribution };
    }
    
    const response = await notion.pages.update({
      page_id: pageId,
      properties
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update in Notion', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Archive entries
export async function DELETE(request) {
  try {
    const body = await request.json();
    const { pageId } = body;
    
    if (!pageId) {
      return NextResponse.json(
        { error: 'Page ID required for deletion' },
        { status: 400 }
      );
    }
    
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete from Notion' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
EOF
echo "✅ Updated Notion API route"

# Step 4: Test the build
echo -e "\n🧪 Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "\n✅ Build successful!"
    
    # Step 5: Git commit and push
    echo -e "\n📤 Committing and pushing to GitHub..."
    git add .
    git commit -m "Major dashboard update: Enhanced weather widget, iOS-style shopping list, monthly spending tracker, retirement investment focus, real-time clock, removed saving streak, simplified tax tracker"
    git push origin main
    
    echo -e "\n🎉 Update complete! Dashboard has been updated with all requested features and pushed to GitHub."
    echo "Vercel will automatically deploy the changes."
else
    echo -e "\n❌ Build failed. Please check the errors above."
    exit 1
fi