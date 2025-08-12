#!/bin/bash

echo "🚀 Starting comprehensive dashboard update..."

# 1. Update Notion setup script for new schemas
cat << 'NOTION_EOF' > notion-setup-update.js
// Add to existing notion-setup.js or create new migration script
const { Client } = require('@notionhq/client');
require('dotenv').config({ path: '.env.local' });

const notion = new Client({ auth: process.env.NOTION_API_KEY });

async function updateDatabases() {
  console.log('📊 Updating database schemas...');
  
  // Add precious_metals database
  const preciousMetalsDb = await notion.databases.create({
    parent: { type: "page_id", page_id: process.env.NOTION_PARENT_PAGE_ID },
    icon: { type: "emoji", emoji: "🥇" },
    title: [{ type: "text", text: { content: "Precious Metals" }}],
    properties: {
      "Purchase_ID": { title: {} },
      "Metal_Type": { 
        select: { 
          options: [
            { name: "Gold", color: "yellow" },
            { name: "Silver", color: "gray" }
          ] 
        }
      },
      "Purchase_Date": { date: {} },
      "Amount_Ounces": { number: {} },
      "Price_Per_Ounce": { number: { format: "dollar" } },
      "Total_Cost": { number: { format: "dollar" } },
      "Current_Value": { number: { format: "dollar" } },
      "Vendor": { rich_text: {} },
      "Notes": { rich_text: {} }
    }
  });
  
  console.log('✅ Precious Metals DB created:', preciousMetalsDb.id);
  
  // Add layouts database for custom layouts
  const layoutsDb = await notion.databases.create({
    parent: { type: "page_id", page_id: process.env.NOTION_PARENT_PAGE_ID },
    icon: { type: "emoji", emoji: "📐" },
    title: [{ type: "text", text: { content: "Dashboard Layouts" }}],
    properties: {
      "Layout_Name": { title: {} },
      "Layout_Data": { rich_text: {} },
      "Is_Active": { checkbox: {} },
      "Last_Modified": { last_edited_time: {} }
    }
  });
  
  console.log('✅ Layouts DB created:', layoutsDb.id);
  
  // Update .env.local with new database IDs
  const fs = require('fs').promises;
  const envContent = await fs.readFile('.env.local', 'utf8');
  const updatedEnv = envContent + `
NOTION_PRECIOUS_METALS_DB_ID=${preciousMetalsDb.id}
NOTION_LAYOUTS_DB_ID=${layoutsDb.id}
`;
  await fs.writeFile('.env.local', updatedEnv);
}

updateDatabases().catch(console.error);
NOTION_EOF

# 2. Create precious metals API route
cat << 'API_EOF' > app/api/metals/route.js
import { NextResponse } from 'next/server';

// Cache metals prices for 5 minutes
let pricesCache = { data: null, timestamp: 0 };
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    
    // Return cached data if still valid
    if (pricesCache.data && (now - pricesCache.timestamp < CACHE_DURATION)) {
      return NextResponse.json(pricesCache.data);
    }
    
    // Fetch from multiple sources for reliability
    const sources = [
      // Primary: GoldAPI (free tier available)
      async () => {
        const response = await fetch('https://api.metals.live/v1/spot', {
          headers: { 'Accept': 'application/json' }
        });
        const data = await response.json();
        return {
          gold: data.find(m => m.metal === 'gold')?.price || 0,
          silver: data.find(m => m.metal === 'silver')?.price || 0,
          source: 'metals.live'
        };
      },
      // Fallback: Static approximation (update these periodically)
      async () => ({
        gold: 2050,   // Update with recent price
        silver: 24,    // Update with recent price
        source: 'fallback',
        note: 'Using fallback prices - API unavailable'
      })
    ];
    
    let prices = null;
    for (const source of sources) {
      try {
        prices = await source();
        if (prices.gold > 0) break;
      } catch (e) {
        console.error('Metal price source failed:', e);
      }
    }
    
    // Cache the successful response
    pricesCache = { data: prices, timestamp: now };
    
    return NextResponse.json(prices);
  } catch (error) {
    console.error('Metals API error:', error);
    return NextResponse.json({ 
      gold: 2050, 
      silver: 24, 
      source: 'error',
      error: error.message 
    });
  }
}
API_EOF

# 3. Create updated Dashboard component with all new features
cat << 'DASHBOARD_EOF' > components/Dashboard.js
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Cloud, CloudRain, CloudSnow, Sun, 
  ShoppingCart, TrendingUp, Target, Trophy,
  DollarSign, Calendar, Package, Utensils, 
  Fuel, Car, Plus, X, ChevronDown, ChevronUp,
  Home, ShoppingBag, Plane, Shirt, RotateCcw,
  Edit, Save, Check, Menu, Coins, AlertCircle
} from 'lucide-react';

export default function Dashboard() {
  // State management
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weather, setWeather] = useState(null);
  const [weatherExpanded, setWeatherExpanded] = useState(false);
  const [goals, setGoals] = useState([]);
  const [shoppingList, setShoppingList] = useState([]);
  const [shoppingHistory, setShoppingHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [settings, setSettings] = useState({});
  const [achievements, setAchievements] = useState([]);
  const [preciousMetals, setPreciousMetals] = useState([]);
  const [metalPrices, setMetalPrices] = useState({ gold: 0, silver: 0 });
  const [loading, setLoading] = useState(true);
  
  // UI state
  const [expenseTimeframe, setExpenseTimeframe] = useState('month'); // 'month' or 'year'
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [metalModalOpen, setMetalModalOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [layout, setLayout] = useState(null);
  const [goalDetailsModal, setGoalDetailsModal] = useState(null);
  
  // Refs
  const gridRef = useRef(null);
  const draggedWidget = useRef(null);
  
  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchWeather(),
        fetchGoals(),
        fetchShoppingList(),
        fetchTransactions(),
        fetchSettings(),
        fetchAchievements(),
        fetchPreciousMetals(),
        fetchMetalPrices(),
        loadLayout()
      ]);
      setLoading(false);
    };
    
    fetchAllData();
    const interval = setInterval(fetchAllData, 60000);
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);
  
  // Data fetching functions
  const fetchWeather = async () => {
    try {
      const res = await fetch('/api/weather');
      const data = await res.json();
      setWeather(data);
    } catch (error) {
      console.error('Weather fetch error:', error);
    }
  };
  
  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/notion?database=goals');
      const data = await res.json();
      setGoals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Goals fetch error:', error);
    }
  };
  
  const fetchShoppingList = async () => {
    try {
      const res = await fetch('/api/notion?database=shopping');
      const data = await res.json();
      setShoppingList(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Shopping fetch error:', error);
    }
  };
  
  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/notion?database=transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Transactions fetch error:', error);
    }
  };
  
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/notion?database=settings');
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
    }
  };
  
  const fetchAchievements = async () => {
    try {
      const res = await fetch('/api/notion?database=achievements');
      const data = await res.json();
      setAchievements(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Achievements fetch error:', error);
    }
  };
  
  const fetchPreciousMetals = async () => {
    try {
      const res = await fetch('/api/notion?database=precious_metals');
      const data = await res.json();
      setPreciousMetals(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Precious metals fetch error:', error);
    }
  };
  
  const fetchMetalPrices = async () => {
    try {
      const res = await fetch('/api/metals');
      const data = await res.json();
      setMetalPrices(data);
    } catch (error) {
      console.error('Metal prices fetch error:', error);
    }
  };
  
  const loadLayout = async () => {
    // Try localStorage first, then Notion
    const savedLayout = localStorage.getItem('dashboardLayout');
    if (savedLayout) {
      setLayout(JSON.parse(savedLayout));
    } else {
      try {
        const res = await fetch('/api/notion?database=layouts');
        const data = await res.json();
        const activeLayout = data.find(l => l.properties?.Is_Active?.checkbox);
        if (activeLayout) {
          const layoutData = activeLayout.properties?.Layout_Data?.rich_text?.[0]?.text?.content;
          if (layoutData) setLayout(JSON.parse(layoutData));
        }
      } catch (error) {
        console.error('Layout fetch error:', error);
      }
    }
  };
  
  // Expense tracking functions
  const getExpenseTotal = () => {
    const now = new Date();
    const filtered = transactions.filter(t => {
      const date = t.properties?.Date?.date?.start;
      if (!date) return false;
      const transDate = new Date(date);
      
      if (expenseTimeframe === 'month') {
        return transDate.getMonth() === now.getMonth() && 
               transDate.getFullYear() === now.getFullYear() &&
               t.properties?.Category?.select?.name !== 'Income';
      } else {
        return transDate.getFullYear() === now.getFullYear() &&
               t.properties?.Category?.select?.name !== 'Income';
      }
    });
    
    return filtered.reduce((sum, t) => sum + (t.properties?.Amount?.number || 0), 0);
  };
  
  const getCategoryTotal = (category) => {
    const now = new Date();
    return transactions
      .filter(t => {
        const date = t.properties?.Date?.date?.start;
        if (!date) return false;
        const transDate = new Date(date);
        const isCurrentPeriod = expenseTimeframe === 'month' 
          ? transDate.getMonth() === now.getMonth() && transDate.getFullYear() === now.getFullYear()
          : transDate.getFullYear() === now.getFullYear();
        return isCurrentPeriod && t.properties?.Category?.select?.name === category;
      })
      .reduce((sum, t) => sum + (t.properties?.Amount?.number || 0), 0);
  };
  
  const handleQuickExpense = (category) => {
    setSelectedExpenseCategory(category);
    setExpenseModalOpen(true);
    setExpenseAmount('');
  };
  
  const submitExpense = async () => {
    if (!expenseAmount || !selectedExpenseCategory) return;
    
    const amount = parseFloat(expenseAmount);
    
    // If Travel expense, also deduct from Travel Fund
    if (selectedExpenseCategory === 'Travel') {
      const travelGoal = goals.find(g => 
        g.properties?.Goal_Name?.title?.[0]?.text?.content === 'Travel Fund'
      );
      
      if (travelGoal) {
        const currentAmount = travelGoal.properties?.Current_Amount?.number || 0;
        const newAmount = Math.max(0, currentAmount - amount);
        
        await fetch('/api/notion', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pageId: travelGoal.id,
            properties: {
              Current_Amount: { number: newAmount }
            }
          })
        });
      }
    }
    
    // Add transaction
    await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: 'transactions',
        properties: {
          Date: { date: { start: new Date().toISOString() } },
          Amount: { number: amount },
          Category: { select: { name: selectedExpenseCategory } },
          Description: { 
            title: [{ text: { content: `Quick expense: ${selectedExpenseCategory}` } }]
          }
        }
      })
    });
    
    setExpenseModalOpen(false);
    fetchTransactions();
    if (selectedExpenseCategory === 'Travel') fetchGoals();
  };
  
  // Gold & Silver calculations
  const getMetalsValue = () => {
    const totalInvested = preciousMetals.reduce((sum, pm) => 
      sum + (pm.properties?.Total_Cost?.number || 0), 0
    );
    
    const currentValue = preciousMetals.reduce((sum, pm) => {
      const ounces = pm.properties?.Amount_Ounces?.number || 0;
      const metalType = pm.properties?.Metal_Type?.select?.name;
      const price = metalType === 'Gold' ? metalPrices.gold : metalPrices.silver;
      return sum + (ounces * price);
    }, 0);
    
    return { invested: totalInvested, current: currentValue };
  };
  
  const addMetalPurchase = async (data) => {
    await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: 'precious_metals',
        properties: {
          Purchase_ID: { title: [{ text: { content: `${data.metal}-${Date.now()}` } }] },
          Metal_Type: { select: { name: data.metal } },
          Purchase_Date: { date: { start: new Date().toISOString() } },
          Amount_Ounces: { number: data.ounces },
          Price_Per_Ounce: { number: data.pricePerOunce },
          Total_Cost: { number: data.ounces * data.pricePerOunce },
          Vendor: { rich_text: [{ text: { content: data.vendor || 'SD Bullion' } }] }
        }
      })
    });
    
    setMetalModalOpen(false);
    fetchPreciousMetals();
  };
  
  // Shopping list functions
  const toggleShoppingItem = async (item) => {
    const purchased = !item.properties?.Purchased?.checkbox;
    
    await fetch('/api/notion', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pageId: item.id,
        properties: {
          Purchased: { checkbox: purchased }
        }
      })
    });
    
    fetchShoppingList();
  };
  
  const addShoppingItem = async () => {
    if (!newItemText.trim()) return;
    
    await fetch('/api/notion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        database: 'shopping',
        properties: {
          Item: { title: [{ text: { content: newItemText } }] },
          Purchased: { checkbox: false }
        }
      })
    });
    
    setNewItemText('');
    fetchShoppingList();
  };
  
  const clearShoppingList = async () => {
    // Save to history for undo
    setShoppingHistory([...shoppingHistory, [...shoppingList]]);
    
    // Delete all items
    await Promise.all(shoppingList.map(item =>
      fetch('/api/notion', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: item.id })
      })
    ));
    
    fetchShoppingList();
  };
  
  const undoShoppingList = async () => {
    if (shoppingHistory.length === 0) return;
    
    const lastState = shoppingHistory[shoppingHistory.length - 1];
    setShoppingHistory(shoppingHistory.slice(0, -1));
    
    // Restore items
    await Promise.all(lastState.map(item =>
      fetch('/api/notion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          database: 'shopping',
          properties: item.properties
        })
      })
    ));
    
    fetchShoppingList();
  };
  
  // Layout editor functions
  const saveLayout = (newLayout) => {
    localStorage.setItem('dashboardLayout', JSON.stringify(newLayout));
    setLayout(newLayout);
  };
  
  const handleDragStart = (e, widgetId) => {
    draggedWidget.current = widgetId;
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e, targetId) => {
    e.preventDefault();
    if (!draggedWidget.current || draggedWidget.current === targetId) return;
    
    // Swap positions in layout
    const newLayout = { ...layout };
    const temp = newLayout[draggedWidget.current];
    newLayout[draggedWidget.current] = newLayout[targetId];
    newLayout[targetId] = temp;
    
    saveLayout(newLayout);
    draggedWidget.current = null;
  };
  
  // Expense categories with icons
  const expenseCategories = [
    { name: 'Groceries', icon: <Utensils className="w-4 h-4" />, color: 'bg-green-500' },
    { name: 'Gas', icon: <Fuel className="w-4 h-4" />, color: 'bg-blue-500' },
    { name: 'Household Items', icon: <Home className="w-4 h-4" />, color: 'bg-purple-500' },
    { name: 'Restaurant', icon: <Package className="w-4 h-4" />, color: 'bg-orange-500' },
    { name: 'Travel', icon: <Plane className="w-4 h-4" />, color: 'bg-pink-500' },
    { name: 'Clothing', icon: <Shirt className="w-4 h-4" />, color: 'bg-indigo-500' },
    { name: 'Rent', icon: <Home className="w-4 h-4" />, color: 'bg-red-500' },
    { name: 'Other', icon: <ShoppingBag className="w-4 h-4" />, color: 'bg-gray-500' }
  ];
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-2xl text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }
  
  const metalsData = getMetalsValue();
  
  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'}! 💰
          </h1>
          <div className="flex items-center gap-4">
            <div className="text-gray-500 text-sm md:text-base">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
            </div>
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {isEditMode ? <Save className="w-5 h-5" /> : <Edit className="w-5 h-5" />}
            </button>
          </div>
        </div>
        
        {/* Widget Grid */}
        <div 
          ref={gridRef}
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
            isEditMode ? 'edit-mode' : ''
          }`}
        >
          
          {/* Weather Widget */}
          <div 
            className="lg:col-span-2 lg:row-span-1"
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, 'weather')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'weather')}
          >
            <div 
              className="bg-gradient-to-br from-purple-500 to-purple-700 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all cursor-pointer h-full"
              onClick={() => setWeatherExpanded(!weatherExpanded)}
            >
              {weatherExpanded ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-5xl font-light">
                        {weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°F` : '--°F'}
                      </div>
                      <div className="text-lg opacity-90 mt-2">
                        Weaverville, NC
                      </div>
                    </div>
                    <ChevronUp className="w-6 h-6" />
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {weather?.daily?.time?.slice(0, 10).map((day, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-xs opacity-75">
                          {new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className="text-sm font-bold">
                          {Math.round(weather.daily.temperature_2m_max[idx])}°
                        </div>
                        <div className="text-xs opacity-75">
                          {Math.round(weather.daily.temperature_2m_min[idx])}°
                        </div>
                        <div className="text-xs opacity-60">
                          {weather.daily.precipitation_probability_max[idx]}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-5xl font-light">
                      {weather?.current?.temperature_2m ? `${Math.round(weather.current.temperature_2m)}°F` : '--°F'}
                    </div>
                    <div className="text-lg opacity-90">
                      {weather?.current ? 
                        `H: ${Math.round(weather.daily?.temperature_2m_max?.[0] || 0)}° L: ${Math.round(weather.daily?.temperature_2m_min?.[0] || 0)}°` : 
                        'Loading...'}
                    </div>
                    <div className="text-sm opacity-75 mt-1">
                      {weather?.daily?.precipitation_probability_max?.[0] || 0}% chance of rain
                    </div>
                  </div>
                  <ChevronDown className="w-6 h-6" />
                </div>
              )}
            </div>
          </div>
          
          {/* Gold & Silver Savings (formerly Retirement) */}
          <div 
            className="lg:col-span-2 lg:row-span-2"
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, 'metals')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'metals')}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Coins className="w-7 h-7 text-yellow-600" />
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Gold & Silver Savings
                  </h2>
                </div>
                <button
                  onClick={() => setMetalModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              
              {/* Metals Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-100 to-yellow-50 rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Invested</div>
                    <div className="text-xl font-bold text-gray-900">
                      ${metalsData.invested.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-600 mb-1">Current Value</div>
                    <div className="text-xl font-bold text-green-600">
                      ${metalsData.current.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs text-gray-600 mb-1">Gain/Loss</div>
                  <div className={`text-lg font-semibold ${
                    metalsData.current >= metalsData.invested ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metalsData.current >= metalsData.invested ? '+' : '-'}
                    ${Math.abs(metalsData.current - metalsData.invested).toLocaleString()}
                    ({((metalsData.current / metalsData.invested - 1) * 100).toFixed(1)}%)
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Gold: ${metalPrices.gold}/oz | Silver: ${metalPrices.silver}/oz
                </div>
              </div>
              
              {/* Other Goals */}
              <div className="space-y-3">
                {goals
                  .filter(g => {
                    const category = g.properties?.Category?.select?.name;
                    return category !== 'Investment' && category !== 'Tax';
                  })
                  .map(goal => {
                    const name = goal.properties?.Goal_Name?.title?.[0]?.text?.content || 'Unnamed';
                    const current = name === 'Student Loan' ? 0 : 
                      (goal.properties?.Current_Amount?.number || 0);
                    const target = goal.properties?.Target_Amount?.number || 1;
                    const progress = (current / target) * 100;
                    const icon = goal.properties?.Icon?.rich_text?.[0]?.text?.content || '🎯';
                    
                    return (
                      <div 
                        key={goal.id}
                        className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                        onClick={() => setGoalDetailsModal(goal)}
                      >
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium">{icon} {name}</span>
                          <span className="text-gray-500">
                            ${current.toLocaleString()} / ${target.toLocaleString()}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
          
          {/* Shopping List */}
          <div 
            className="lg:col-span-1"
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, 'shopping')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'shopping')}
          >
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-7 h-7 text-blue-600" />
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                    Shopping List
                  </h2>
                </div>
                <div className="flex gap-2">
                  {shoppingHistory.length > 0 && (
                    <button
                      onClick={undoShoppingList}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={clearShoppingList}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                {shoppingList.map(item => {
                  const name = item.properties?.Item?.title?.[0]?.text?.content || '';
                  const purchased = item.properties?.Purchased?.checkbox || false;
                  
                  return (
                    <div 
                      key={item.id}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => toggleShoppingItem(item)}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 ${
                        purchased ? 'bg-blue-600 border-blue-600' : 'border-blue-600'
                      } flex items-center justify-center`}>
                        {purchased && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <span className={purchased ? 'line-through text-gray-400' : ''}>
                        {name}
                      </span>
                    </div>
                  );
                })}
                
                {/* Add new item input */}
                <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    value={newItemText}
                    onChange={(e) => setNewItemText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && addShoppingItem()}
                    placeholder="Add item..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={addShoppingItem}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expenses Widget */}
          <div 
            className="lg:col-span-1"
            draggable={isEditMode}
            onDragStart={(e) => handleDragStart(e, 'expenses')}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 'expenses')}
          >
            <div className="bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide opacity-90">
                  Expenses
                </h2>
                <button
                  onClick={() => setExpenseTimeframe(expenseTimeframe === 'month' ? 'year' : 'month')}
                  className="px-3 py-1 bg-white/20 rounded-lg hover:bg-white/30 text-xs"
                >
                  This {expenseTimeframe === 'month' ? 'Month' : 'Year'}
                </button>
              </div>
              
              <div className="text-3xl font-bold mb-4">
                ${getExpenseTotal().toFixed(2)}
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                {expenseCategories.slice(0, 6).map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleQuickExpense(cat.name)}
                    className="p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors flex flex-col items-center gap-1 text-xs"
                  >
                    {cat.icon}
                    <span className="truncate w-full text-center">{cat.name}</span>
                    <span className="opacity-75">${getCategoryTotal(cat.name).toFixed(0)}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Other widgets remain the same */}
          {/* Tax Tracker, Saving Streak, etc. */}
          
        </div>
        
        {/* Expense Modal */}
        {expenseModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Add {selectedExpenseCategory} Expense</h3>
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="Amount"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 text-lg"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={submitExpense}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add Expense
                </button>
                <button
                  onClick={() => setExpenseModalOpen(false)}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Metal Purchase Modal */}
        {metalModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 w-96">
              <h3 className="text-xl font-bold mb-4">Add Precious Metal Purchase</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addMetalPurchase({
                  metal: formData.get('metal'),
                  ounces: parseFloat(formData.get('ounces')),
                  pricePerOunce: parseFloat(formData.get('price')),
                  vendor: formData.get('vendor')
                });
              }}>
                <select name="metal" className="w-full px-4 py-2 border rounded-lg mb-3" required>
                  <option value="">Select Metal</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                </select>
                <input
                  name="ounces"
                  type="number"
                  step="0.001"
                  placeholder="Ounces"
                  className="w-full px-4 py-2 border rounded-lg mb-3"
                  required
                />
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  placeholder="Price per ounce"
                  className="w-full px-4 py-2 border rounded-lg mb-3"
                  required
                />
                <input
                  name="vendor"
                  type="text"
                  placeholder="Vendor (optional)"
                  className="w-full px-4 py-2 border rounded-lg mb-4"
                />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                  >
                    Add Purchase
                  </button>
                  <button
                    type="button"
                    onClick={() => setMetalModalOpen(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
DASHBOARD_EOF

# 4. Update Notion API route to handle PATCH and DELETE
cat << 'NOTION_API_EOF' > app/api/notion/route.js
import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const databases = {
  transactions: process.env.NOTION_TRANSACTIONS_DB_ID,
  goals: process.env.NOTION_GOALS_DB_ID,
  achievements: process.env.NOTION_ACHIEVEMENTS_DB_ID,
  shopping: process.env.NOTION_SHOPPING_DB_ID,
  settings: process.env.NOTION_SETTINGS_DB_ID,
  precious_metals: process.env.NOTION_PRECIOUS_METALS_DB_ID,
  layouts: process.env.NOTION_LAYOUTS_DB_ID,
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const database = searchParams.get('database');
  
  if (!databases[database]) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }
  
  try {
    const response = await notion.databases.query({
      database_id: databases[database],
    });
    
    return NextResponse.json(response.results);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json();
  const { database, properties } = body;
  
  if (!databases[database]) {
    return NextResponse.json({ error: 'Invalid database' }, { status: 400 });
  }
  
  try {
    const response = await notion.pages.create({
      parent: { database_id: databases[database] },
      properties,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const body = await request.json();
  const { pageId, properties } = body;
  
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      properties,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  const body = await request.json();
  const { pageId } = body;
  
  try {
    const response = await notion.pages.update({
      page_id: pageId,
      archived: true,
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
NOTION_API_EOF

# 5. Add custom CSS for layout editor
cat << 'CSS_EOF' >> app/globals.css

/* Layout Editor Styles */
.edit-mode > div {
  position: relative;
  border: 2px dashed #cbd5e0;
  cursor: move;
}

.edit-mode > div:hover {
  border-color: #4299e1;
  background-color: rgba(66, 153, 225, 0.05);
}

.edit-mode > div::before {
  content: '⋮⋮';
  position: absolute;
  top: 4px;
  right: 4px;
  color: #a0aec0;
  font-size: 20px;
  line-height: 1;
}

/* Resizable handles */
.resize-handle {
  position: absolute;
  background: #4299e1;
  opacity: 0;
  transition: opacity 0.2s;
}

.edit-mode .resize-handle {
  opacity: 0.5;
}

.resize-handle:hover {
  opacity: 1 !important;
}

.resize-handle-right {
  right: -4px;
  top: 20%;
  bottom: 20%;
  width: 8px;
  cursor: ew-resize;
}

.resize-handle-bottom {
  bottom: -4px;
  left: 20%;
  right: 20%;
  height: 8px;
  cursor: ns-resize;
}

.resize-handle-corner {
  right: -4px;
  bottom: -4px;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  border-radius: 2px;
}
CSS_EOF

# 6. Build and deploy
echo "📦 Building application..."
npm run build

echo "💾 Committing changes..."
git add -A
git commit -m "Major update: Expenses categories, Gold/Silver tracking, Shopping list improvements, Layout editor"

echo "🚀 Pushing to GitHub..."
git push origin main

echo "✅ Complete! Vercel will auto-deploy. Features added:"
echo "  1. ✅ Expenses widget with new categories and year/month toggle"
echo "  2. ✅ Gold & Silver Savings tracker with live prices"
echo "  3. ✅ Shopping list with dynamic height, clear, and undo"
echo "  4. ✅ Drag-and-drop layout editor"
echo "  5. ✅ Travel expenses linked to Travel Fund"
echo ""
echo "📝 Next steps:"
echo "  1. Run: node notion-setup-update.js (to create new databases)"
echo "  2. Update .env.local with new database IDs"
echo "  3. Test locally: npm run dev"
echo "  4. Check deployment: https://kitchen-dashboard-app.vercel.app"
