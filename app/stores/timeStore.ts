import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Season = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type TimeSpeed = 0 | 1 | 2 | 5 | 10;
export type EventType = 'seasonal' | 'holiday' | 'economic' | 'random';

export interface TimeEvent {
  id: string;
  type: EventType;
  name: string;
  description: string;
  startQuarter: Season;
  duration: number; // in days
  effects: {
    demandMultiplier?: number;
    priceMultiplier?: number;
    costMultiplier?: number;
  };
  active: boolean;
}

export interface TimeState {
  // Current time
  currentYear: number;
  currentQuarter: Season;
  currentMonth: number; // 1-12
  currentDay: number; // 1-30
  currentHour: number; // 0-23
  currentMinute: number; // 0-59
  
  // Game speed
  speed: TimeSpeed;
  isPaused: boolean;
  
  // Time tracking
  totalDaysPlayed: number;
  lastUpdateTime: number;
  
  // Events
  activeEvents: TimeEvent[];
  eventHistory: Array<{ event: TimeEvent; startTime: string; endTime: string }>;
  
  // Actions
  setSpeed: (speed: TimeSpeed) => void;
  pause: () => void;
  resume: () => void;
  advanceTime: (minutes: number) => void;
  addEvent: (event: TimeEvent) => void;
  removeEvent: (eventId: string) => void;
  updateTime: () => void;
  reset: () => void;
}

// Predefined events
export const SEASONAL_EVENTS: TimeEvent[] = [
  {
    id: 'q1-tax-season',
    type: 'seasonal',
    name: 'Tax Season Rush',
    description: 'Increased demand for business supplies and shipping',
    startQuarter: 'Q1',
    duration: 30,
    effects: {
      demandMultiplier: 1.3,
      priceMultiplier: 1.1
    },
    active: false
  },
  {
    id: 'q2-summer-slowdown',
    type: 'seasonal',
    name: 'Summer Slowdown',
    description: 'Reduced business activity during vacation season',
    startQuarter: 'Q2',
    duration: 45,
    effects: {
      demandMultiplier: 0.8,
      priceMultiplier: 0.95
    },
    active: false
  },
  {
    id: 'q3-back-to-business',
    type: 'seasonal',
    name: 'Back to Business',
    description: 'Increased activity as businesses ramp up',
    startQuarter: 'Q3',
    duration: 30,
    effects: {
      demandMultiplier: 1.2,
      priceMultiplier: 1.05
    },
    active: false
  },
  {
    id: 'q4-holiday-rush',
    type: 'seasonal',
    name: 'Holiday Rush',
    description: 'Peak shipping season with extreme demand',
    startQuarter: 'Q4',
    duration: 45,
    effects: {
      demandMultiplier: 1.8,
      priceMultiplier: 1.3,
      costMultiplier: 1.2
    },
    active: false
  }
];

export const RANDOM_EVENTS: TimeEvent[] = [
  {
    id: 'weather-disruption',
    type: 'random',
    name: 'Severe Weather',
    description: 'Major storm disrupts shipping routes',
    startQuarter: 'Q1',
    duration: 3,
    effects: {
      demandMultiplier: 0.7,
      costMultiplier: 1.5
    },
    active: false
  },
  {
    id: 'port-strike',
    type: 'random',
    name: 'Port Strike',
    description: 'Labor disputes slow down shipping',
    startQuarter: 'Q1',
    duration: 7,
    effects: {
      demandMultiplier: 0.9,
      costMultiplier: 1.3
    },
    active: false
  },
  {
    id: 'economic-boom',
    type: 'economic',
    name: 'Economic Boom',
    description: 'Strong economy drives increased shipping demand',
    startQuarter: 'Q1',
    duration: 90,
    effects: {
      demandMultiplier: 1.4,
      priceMultiplier: 1.2
    },
    active: false
  }
];

// Helper functions
function getQuarterFromMonth(month: number): Season {
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
}

function getDaysInMonth(month: number): number {
  return 30; // Simplified for game purposes
}

function isBusinessHour(hour: number, region: string = 'US'): boolean {
  // Different regions have different business hours
  const businessHours = {
    US: { start: 9, end: 17 },
    EU: { start: 8, end: 18 },
    ASIA: { start: 9, end: 18 }
  };
  
  const hours = businessHours[region as keyof typeof businessHours] || businessHours.US;
  return hour >= hours.start && hour < hours.end;
}

export const useTimeStore = create<TimeState>(
  persist(
    (set, get) => ({
      // Initial state
      currentYear: 2024,
      currentQuarter: 'Q1',
      currentMonth: 1,
      currentDay: 1,
      currentHour: 9,
      currentMinute: 0,
      
      speed: 1,
      isPaused: false,
      
      totalDaysPlayed: 0,
      lastUpdateTime: Date.now(),
      
      activeEvents: [],
      eventHistory: [],
      
      // Actions
      setSpeed: (speed) => set({ speed, isPaused: speed === 0 }),
      
      pause: () => set({ isPaused: true, speed: 0 }),
      
      resume: () => set({ isPaused: false, speed: 1 }),
      
      advanceTime: (minutes) => {
        const state = get();
        let { currentMinute, currentHour, currentDay, currentMonth, currentYear } = state;
        
        // Add minutes
        currentMinute += minutes;
        
        // Handle overflow
        while (currentMinute >= 60) {
          currentMinute -= 60;
          currentHour += 1;
        }
        
        while (currentHour >= 24) {
          currentHour -= 24;
          currentDay += 1;
        }
        
        while (currentDay > getDaysInMonth(currentMonth)) {
          currentDay -= getDaysInMonth(currentMonth);
          currentMonth += 1;
        }
        
        while (currentMonth > 12) {
          currentMonth -= 12;
          currentYear += 1;
        }
        
        const newQuarter = getQuarterFromMonth(currentMonth);
        const totalDays = state.totalDaysPlayed + (minutes / (60 * 24));
        
        set({
          currentMinute,
          currentHour,
          currentDay,
          currentMonth,
          currentYear,
          currentQuarter: newQuarter,
          totalDaysPlayed: totalDays
        });
        
        // Check for seasonal events
        const currentEvents = get().activeEvents;
        const potentialEvents = [...SEASONAL_EVENTS, ...RANDOM_EVENTS];
        
        potentialEvents.forEach(event => {
          const isActive = currentEvents.some(e => e.id === event.id);
          
          // Activate seasonal events
          if (!isActive && event.type === 'seasonal' && event.startQuarter === newQuarter) {
            get().addEvent({ ...event, active: true });
          }
          
          // Random chance for random events (1% chance per day)
          if (!isActive && event.type === 'random' && Math.random() < 0.01) {
            get().addEvent({ ...event, active: true });
          }
        });
        
        // Remove expired events
        currentEvents.forEach(event => {
          const eventStartDay = state.totalDaysPlayed - event.duration;
          if (state.totalDaysPlayed - eventStartDay >= event.duration) {
            get().removeEvent(event.id);
          }
        });
      },
      
      addEvent: (event) => {
        const state = get();
        const newEvent = { ...event, active: true };
        
        set({
          activeEvents: [...state.activeEvents, newEvent]
        });
      },
      
      removeEvent: (eventId) => {
        const state = get();
        const event = state.activeEvents.find(e => e.id === eventId);
        
        if (event) {
          set({
            activeEvents: state.activeEvents.filter(e => e.id !== eventId),
            eventHistory: [...state.eventHistory, {
              event,
              startTime: `Year ${state.currentYear}, ${state.currentQuarter}`,
              endTime: `Year ${state.currentYear}, ${state.currentQuarter}`
            }]
          });
        }
      },
      
      updateTime: () => {
        const state = get();
        if (state.isPaused || state.speed === 0) return;
        
        const now = Date.now();
        const deltaTime = now - state.lastUpdateTime;
        
        // Convert real time to game time based on speed
        // 1 real second = speed * 1 game minute
        const gameMinutes = Math.floor((deltaTime / 1000) * state.speed);
        
        if (gameMinutes > 0) {
          state.advanceTime(gameMinutes);
          set({ lastUpdateTime: now });
        }
      },
      
      reset: () => set({
        currentYear: 2024,
        currentQuarter: 'Q1',
        currentMonth: 1,
        currentDay: 1,
        currentHour: 9,
        currentMinute: 0,
        speed: 1,
        isPaused: false,
        totalDaysPlayed: 0,
        lastUpdateTime: Date.now(),
        activeEvents: [],
        eventHistory: []
      })
    }),
    {
      name: 'time-store',
      partialize: (state) => ({
        currentYear: state.currentYear,
        currentQuarter: state.currentQuarter,
        currentMonth: state.currentMonth,
        currentDay: state.currentDay,
        currentHour: state.currentHour,
        currentMinute: state.currentMinute,
        totalDaysPlayed: state.totalDaysPlayed,
        activeEvents: state.activeEvents,
        eventHistory: state.eventHistory
      })
    }
  )
);