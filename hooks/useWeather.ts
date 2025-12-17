"use client";

import { useState, useEffect, useCallback } from "react";
import { Weather } from "@/types";

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

interface WeatherCache {
  data: Weather | null;
  timestamp: number;
}

let weatherCache: WeatherCache = {
  data: null,
  timestamp: 0,
};

export function useWeather() {
  const [weather, setWeather] = useState<Weather | null>(weatherCache.data);
  const [loading, setLoading] = useState(!weatherCache.data);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(async (force = false) => {
    const now = Date.now();

    // Return cached data if still valid
    if (!force && weatherCache.data && now - weatherCache.timestamp < CACHE_DURATION) {
      setWeather(weatherCache.data);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const lat = process.env.NEXT_PUBLIC_WEATHER_LAT || "35.5407";
      const lon = process.env.NEXT_PUBLIC_WEATHER_LON || "-82.6909";

      const response = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const data: Weather = await response.json();

      // Update cache
      weatherCache = {
        data,
        timestamp: now,
      };

      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setWeather(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeather();

    // Refresh every 30 minutes
    const interval = setInterval(() => {
      fetchWeather(true);
    }, CACHE_DURATION);

    return () => clearInterval(interval);
  }, [fetchWeather]);

  return {
    weather,
    loading,
    error,
    refresh: () => fetchWeather(true),
  };
}
