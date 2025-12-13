"use client";

import { useEffect, useState } from "react";
import { Cloud, Droplets, Wind, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui";
import { formatTemperature } from "@/lib/formatters";
import { Weather } from "@/types";

interface WeatherWidgetProps {
  onClick?: (weather: Weather) => void;
}

export function WeatherWidget({ onClick }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const res = await fetch("/api/weather");
        if (!res.ok) throw new Error("Failed to fetch weather");
        const data = await res.json();
        setWeather(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load weather");
      } finally {
        setLoading(false);
      }
    }

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Card
        variant="gradient"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        className="h-full text-white"
      >
        <div className="animate-pulse">
          <div className="h-16 w-32 bg-white/20 rounded mb-2" />
          <div className="h-4 w-24 bg-white/20 rounded" />
        </div>
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card
        variant="gradient"
        gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        className="h-full text-white"
      >
        <div className="flex items-center gap-2">
          <Cloud className="w-6 h-6" />
          <span>Weather unavailable</span>
        </div>
      </Card>
    );
  }

  const { current, daily } = weather;
  const today = daily[0];

  const handleClick = () => {
    if (onClick && weather) {
      onClick(weather);
    }
  };

  return (
    <Card
      variant="gradient"
      gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      className="h-full text-white cursor-pointer hover:shadow-lg transition-shadow"
      onClick={handleClick}
    >
      <div className="widget-drag-handle h-full flex flex-col justify-between">
        {/* Current temp */}
        <div>
          <div className="text-5xl font-light mb-1">
            {formatTemperature(current.temp)}
          </div>
          <div className="text-white/80 text-sm">
            H: {formatTemperature(today.temp_max)} L:{" "}
            {formatTemperature(today.temp_min)}
          </div>
        </div>

        {/* Conditions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-white/80">
            <div className="flex items-center gap-1">
              <Droplets className="w-4 h-4" />
              <span>{today.precipitation_probability}% rain</span>
            </div>
            <div className="flex items-center gap-1">
              <Wind className="w-4 h-4" />
              <span>{Math.round(current.wind_speed)} mph</span>
            </div>
          </div>
          <ChevronDown className="w-5 h-5 text-white/60" />
        </div>
      </div>
    </Card>
  );
}
