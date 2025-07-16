'use client';

import React, { useEffect } from 'react';
import { useTimeStore, TimeSpeed } from '@/app/stores/timeStore';
import { Clock, Calendar, Pause, Play, FastForward, Zap } from 'lucide-react';

const TimeDisplay: React.FC = () => {
  const {
    currentYear,
    currentQuarter,
    currentMonth,
    currentDay,
    currentHour,
    currentMinute,
    speed,
    isPaused,
    activeEvents,
    setSpeed,
    pause,
    resume,
    updateTime
  } = useTimeStore();

  // Update time every 100ms when not paused
  useEffect(() => {
    if (!isPaused) {
      const interval = setInterval(() => {
        updateTime();
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPaused, updateTime]);

  const formatTime = () => {
    const hour = currentHour.toString().padStart(2, '0');
    const minute = currentMinute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  };

  const formatDate = () => {
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    return `${monthNames[currentMonth - 1]} ${currentDay}, ${currentYear}`;
  };

  const getSpeedIcon = (targetSpeed: TimeSpeed) => {
    switch (targetSpeed) {
      case 0:
        return <Pause className="w-4 h-4" />;
      case 1:
        return <Play className="w-4 h-4" />;
      case 2:
        return <FastForward className="w-4 h-4" />;
      case 5:
      case 10:
        return <Zap className="w-4 h-4" />;
      default:
        return <Play className="w-4 h-4" />;
    }
  };

  const speedButtons: TimeSpeed[] = [0, 1, 2, 5, 10];

  return (
    <div className="bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg shadow-xl border border-green-500/30">
      {/* Main Time Display */}
      <div className="space-y-3">
        {/* Date and Quarter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-400" />
            <span className="text-lg font-semibold">{formatDate()}</span>
          </div>
          <div className="bg-green-500/20 px-3 py-1 rounded-full">
            <span className="text-green-400 font-bold">{currentQuarter}</span>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-green-400" />
          <span className="text-2xl font-mono font-bold">{formatTime()}</span>
        </div>

        {/* Speed Controls */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Speed:</span>
          <div className="flex gap-1">
            {speedButtons.map((targetSpeed) => (
              <button
                key={targetSpeed}
                onClick={() => targetSpeed === 0 ? pause() : setSpeed(targetSpeed)}
                className={`
                  px-3 py-1 rounded flex items-center gap-1 transition-all
                  ${
                    speed === targetSpeed
                      ? 'bg-green-500 text-black'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }
                `}
              >
                {getSpeedIcon(targetSpeed)}
                <span className="text-xs font-bold">
                  {targetSpeed === 0 ? '' : `${targetSpeed}x`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Active Events */}
        {activeEvents.length > 0 && (
          <div className="mt-3 pt-3 border-t border-green-500/30">
            <h3 className="text-sm font-semibold text-green-400 mb-2">Active Events</h3>
            <div className="space-y-1">
              {activeEvents.map((event) => (
                <div
                  key={event.id}
                  className="bg-green-500/10 px-2 py-1 rounded text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{event.name}</span>
                    <span className="text-green-400">
                      {event.effects.demandMultiplier && `${Math.round((event.effects.demandMultiplier - 1) * 100)}%`}
                    </span>
                  </div>
                  <div className="text-gray-400 text-xs">{event.description}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimeDisplay;