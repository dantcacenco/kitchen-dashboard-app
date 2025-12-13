"use client";

import { Modal } from "@/components/ui";
import { formatTemperature, formatDate } from "@/lib/formatters";
import { Weather } from "@/types";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  Droplets,
  Wind,
  Thermometer,
} from "lucide-react";

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
  weather: Weather | null;
}

const weatherIcons: Record<number, React.ReactNode> = {
  0: <Sun className="w-8 h-8 text-yellow-500" />,
  1: <Sun className="w-8 h-8 text-yellow-500" />,
  2: <Cloud className="w-8 h-8 text-gray-400" />,
  3: <Cloud className="w-8 h-8 text-gray-500" />,
  45: <CloudFog className="w-8 h-8 text-gray-400" />,
  48: <CloudFog className="w-8 h-8 text-gray-400" />,
  51: <CloudDrizzle className="w-8 h-8 text-blue-400" />,
  53: <CloudDrizzle className="w-8 h-8 text-blue-400" />,
  55: <CloudDrizzle className="w-8 h-8 text-blue-500" />,
  61: <CloudRain className="w-8 h-8 text-blue-500" />,
  63: <CloudRain className="w-8 h-8 text-blue-600" />,
  65: <CloudRain className="w-8 h-8 text-blue-700" />,
  71: <CloudSnow className="w-8 h-8 text-blue-200" />,
  73: <CloudSnow className="w-8 h-8 text-blue-300" />,
  75: <CloudSnow className="w-8 h-8 text-blue-400" />,
  95: <CloudLightning className="w-8 h-8 text-yellow-600" />,
  96: <CloudLightning className="w-8 h-8 text-yellow-600" />,
  99: <CloudLightning className="w-8 h-8 text-yellow-700" />,
};

function getWeatherIcon(code: number) {
  return weatherIcons[code] || <Cloud className="w-8 h-8 text-gray-400" />;
}

function getDayName(dateStr: string, index: number) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export function WeatherModal({ isOpen, onClose, weather }: WeatherModalProps) {
  if (!weather) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Weather" size="md">
        <div className="text-center py-8 text-gray-500">
          Weather data not available
        </div>
      </Modal>
    );
  }

  const { current, daily } = weather;
  const locationName = process.env.NEXT_PUBLIC_LOCATION_NAME || "Your Location";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="7-Day Forecast" size="md">
      <div className="space-y-6">
        {/* Current Weather */}
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-80 mb-1">{locationName}</div>
              <div className="text-5xl font-light mb-2">
                {formatTemperature(current.temp)}
              </div>
              <div className="text-lg opacity-90">{current.description}</div>
            </div>
            <div className="text-white/90">
              {getWeatherIcon(current.weather_code)}
            </div>
          </div>
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <Thermometer className="w-4 h-4" />
              <span>Feels like {formatTemperature(current.feels_like)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4" />
              <span>{current.humidity}% humidity</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="w-4 h-4" />
              <span>{Math.round(current.wind_speed)} mph</span>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div>
          <h3 className="font-medium text-gray-900 mb-3">7-Day Forecast</h3>
          <div className="space-y-2">
            {daily.map((day, index) => (
              <div
                key={day.date}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  index === 0 ? "bg-blue-50" : "bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-3 w-24">
                  <span className="font-medium text-gray-900">
                    {getDayName(day.date, index)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(day.weather_code)}
                </div>
                <div className="flex items-center gap-2 text-sm text-blue-600">
                  <Droplets className="w-4 h-4" />
                  <span>{day.precipitation_probability}%</span>
                </div>
                <div className="flex items-center gap-2 text-right">
                  <span className="font-medium text-gray-900">
                    {formatTemperature(day.temp_max)}
                  </span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-500">
                    {formatTemperature(day.temp_min)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
