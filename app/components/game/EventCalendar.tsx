'use client';

import React from 'react';
import { useTimeStore, SEASONAL_EVENTS, Season } from '@/stores/timeStore';
import { Calendar, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

const EventCalendar: React.FC = () => {
  const { currentQuarter, activeEvents, eventHistory } = useTimeStore();

  const getQuarterColor = (quarter: Season) => {
    switch (quarter) {
      case 'Q1': return 'bg-blue-500';
      case 'Q2': return 'bg-yellow-500';
      case 'Q3': return 'bg-orange-500';
      case 'Q4': return 'bg-red-500';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'seasonal':
        return <Calendar className="w-4 h-4" />;
      case 'economic':
        return <TrendingUp className="w-4 h-4" />;
      case 'random':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Calendar className="w-4 h-4" />;
    }
  };

  const getEffectColor = (multiplier?: number) => {
    if (!multiplier) return 'text-gray-400';
    if (multiplier > 1) return 'text-green-400';
    if (multiplier < 1) return 'text-red-400';
    return 'text-gray-400';
  };

  const formatEffect = (label: string, multiplier?: number) => {
    if (!multiplier || multiplier === 1) return null;
    const percentage = Math.round((multiplier - 1) * 100);
    const sign = percentage > 0 ? '+' : '';
    return (
      <span className={`${getEffectColor(multiplier)}`}>
        {label}: {sign}{percentage}%
      </span>
    );
  };

  const quarters: Season[] = ['Q1', 'Q2', 'Q3', 'Q4'];

  return (
    <div className="bg-black/80 backdrop-blur-sm text-white p-6 rounded-lg shadow-xl border border-green-500/30">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <Calendar className="w-6 h-6 text-green-400" />
        Event Calendar
      </h2>

      {/* Quarterly Timeline */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-400 mb-3">Seasonal Events</h3>
        <div className="grid grid-cols-4 gap-2">
          {quarters.map((quarter) => {
            const quarterEvents = SEASONAL_EVENTS.filter(e => e.startQuarter === quarter);
            const isCurrentQuarter = quarter === currentQuarter;
            
            return (
              <div
                key={quarter}
                className={`
                  relative p-3 rounded-lg border-2 transition-all
                  ${
                    isCurrentQuarter
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-gray-700 bg-gray-800/50'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold">{quarter}</span>
                  <div className={`w-2 h-2 rounded-full ${getQuarterColor(quarter)}`} />
                </div>
                
                <div className="space-y-1">
                  {quarterEvents.map((event) => {
                    const isActive = activeEvents.some(e => e.id === event.id);
                    return (
                      <div
                        key={event.id}
                        className={`
                          text-xs p-2 rounded transition-all
                          ${
                            isActive
                              ? 'bg-green-500/20 border border-green-500/50'
                              : 'bg-gray-700/50'
                          }
                        `}
                      >
                        <div className="font-semibold flex items-center gap-1">
                          {getEventIcon(event.type)}
                          {event.name}
                        </div>
                        <div className="text-gray-400 mt-1">
                          {event.duration} days
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Events Details */}
      {activeEvents.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Active Effects</h3>
          <div className="space-y-2">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getEventIcon(event.type)}
                    <span className="font-semibold">{event.name}</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {event.duration} days remaining
                  </span>
                </div>
                <div className="text-sm text-gray-300">{event.description}</div>
                <div className="flex gap-3 mt-2 text-xs">
                  {formatEffect('Demand', event.effects.demandMultiplier)}
                  {formatEffect('Prices', event.effects.priceMultiplier)}
                  {formatEffect('Costs', event.effects.costMultiplier)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Event History */}
      {eventHistory.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-400 mb-3">Recent History</h3>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {eventHistory.slice(-5).reverse().map((record, index) => (
              <div
                key={index}
                className="text-xs bg-gray-800/50 p-2 rounded flex items-center justify-between"
              >
                <span className="flex items-center gap-1">
                  {getEventIcon(record.event.type)}
                  {record.event.name}
                </span>
                <span className="text-gray-500">
                  {record.startTime} → {record.endTime}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default EventCalendar;