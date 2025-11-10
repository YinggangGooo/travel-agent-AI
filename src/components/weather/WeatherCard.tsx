import React from 'react';
import { motion } from 'framer-motion';
import { Cloud, Droplets, Wind, Thermometer, Sun, Eye } from 'lucide-react';
import { WeatherData } from '../../contexts/ChatContext';

interface WeatherCardProps {
  weather: WeatherData;
  compact?: boolean;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather, compact = false }) => {
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-4 rounded-xl"
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-neutral-900 dark:text-white">
            {weather.location}
          </h4>
          <span className="text-2xl">{weather.icon}</span>
        </div>
        <div className="text-3xl font-bold text-neutral-900 dark:text-white mb-1">
          {weather.temperature}°C
        </div>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {weather.condition}
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-6 rounded-2xl"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
          {weather.location}
        </h3>
        <div className="text-right">
          <div className="text-4xl font-bold text-neutral-900 dark:text-white">
            {weather.temperature}°C
          </div>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {weather.condition}
          </p>
        </div>
      </div>

      {/* Weather Icon */}
      <div className="flex items-center justify-center mb-6">
        <span className="text-6xl">{weather.icon}</span>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-3">
          <Droplets className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">湿度</p>
            <p className="font-semibold text-neutral-900 dark:text-white">{weather.humidity}%</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Wind className="w-5 h-5 text-gray-500" />
          <div>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">风速</p>
            <p className="font-semibold text-neutral-900 dark:text-white">{weather.windSpeed} km/h</p>
          </div>
        </div>
      </div>

      {/* Forecast */}
      {weather.forecast && (
        <div className="mt-6 pt-4 border-t border-white/20">
          <h4 className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
            7天预报
          </h4>
          <div className="grid grid-cols-7 gap-2">
            {weather.forecast.map((day, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                  {day.day}
                </p>
                <div className="text-lg mb-1">{day.icon}</div>
                <p className="text-xs font-medium text-neutral-900 dark:text-white">
                  {day.high}°
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {day.low}°
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default WeatherCard;
