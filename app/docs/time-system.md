# Time System Implementation

## Overview

The Time System provides a dynamic, quarterly-based time progression that directly impacts gameplay through events and economic cycles. Time moves at an accelerated pace with configurable speed controls.

## Architecture

### Core Components

1. **TimeStore (`/app/stores/timeStore.ts`)**
   - Zustand store managing game time state
   - Persistent time progression with save/load
   - Event system integration
   - Speed controls (pause, 1x, 2x, 5x, 10x)

2. **TimeDisplay (`/app/components/game/TimeDisplay.tsx`)**
   - Real-time clock display
   - Speed control buttons
   - Active events indicator
   - Quarter and date information

3. **EventCalendar (`/app/components/game/EventCalendar.tsx`)**
   - Quarterly event timeline
   - Active event effects display
   - Event history tracking
   - Visual event status indicators

4. **GameHUD (`/app/components/game/GameHUD.tsx`)**
   - Integrated time and financial display
   - Real-time status updates
   - Contextual information overlay

### Time Structure

```typescript
interface TimeState {
  currentYear: number;        // Game year (starts at 2024)
  currentQuarter: Season;     // Q1, Q2, Q3, Q4
  currentMonth: number;       // 1-12
  currentDay: number;         // 1-30 (simplified)
  currentHour: number;        // 0-23
  currentMinute: number;      // 0-59
  speed: TimeSpeed;           // 0, 1, 2, 5, 10
  isPaused: boolean;
  totalDaysPlayed: number;
}
```

## Event System

### Event Types

1. **Seasonal Events** - Predictable quarterly cycles
   - Q1: Tax Season Rush (+30% demand, +10% prices)
   - Q2: Summer Slowdown (-20% demand, -5% prices)
   - Q3: Back to Business (+20% demand, +5% prices)
   - Q4: Holiday Rush (+80% demand, +30% prices, +20% costs)

2. **Random Events** - Unpredictable occurrences
   - Severe Weather (shipping disruption)
   - Port Strikes (labor disputes)
   - Economic Booms (increased demand)

3. **Economic Events** - Market-wide conditions
   - Bull/Bear markets
   - Government policy changes
   - Global supply chain impacts

### Event Effects

```typescript
interface EventEffects {
  demandMultiplier?: number;  // Affects market demand
  priceMultiplier?: number;   // Affects pricing
  costMultiplier?: number;    // Affects operational costs
}
```

## Economic Integration

### Time-Economy Synchronization

The `useTimeSync` hook coordinates between time and economy stores:

```typescript
// Apply combined effects from all active events
const combinedEffects = activeEvents.reduce(
  (acc, event) => ({
    demandMultiplier: acc.demandMultiplier * event.effects.demandMultiplier,
    priceMultiplier: acc.priceMultiplier * event.effects.priceMultiplier,
    costMultiplier: acc.costMultiplier * event.effects.costMultiplier
  }),
  { demandMultiplier: 1, priceMultiplier: 1, costMultiplier: 1 }
);
```

### Revenue Impact

- **Seasonal Cycles**: Predictable 3-month patterns affect planning
- **Holiday Rush**: Q4 drives maximum revenue but increases costs
- **Random Events**: Add unpredictability requiring adaptation
- **Time Pressure**: Faster speeds increase both opportunities and risks

## Key Features

### 1. Accelerated Time Progression
- 1 real second = speed × 1 game minute
- Allows experiencing full business cycles quickly
- Speed controls enable strategic time management

### 2. Dynamic Event System
- Events activate based on quarters and probability
- Multiple events can stack effects
- Events have duration and clear end conditions

### 3. Business Hour Simulation
- Different regions have different operating hours
- Revenue generation varies by time of day
- Global operations require time zone consideration

### 4. Persistent State
- Time state persists across browser sessions
- Event history maintained for analysis
- Financial records tied to time progression

## Usage Examples

### Basic Time Control

```typescript
const { setSpeed, pause, resume, currentQuarter } = useTimeStore();

// Speed up during quiet periods
if (currentQuarter === 'Q2') {
  setSpeed(5); // Summer slowdown - fast forward
}

// Normal speed during busy periods
if (currentQuarter === 'Q4') {
  setSpeed(1); // Holiday rush - careful management
}
```

### Event Monitoring

```typescript
const { activeEvents } = useTimeStore();

// Check for high-impact events
const hasHolidayRush = activeEvents.some(e => e.id === 'q4-holiday-rush');
if (hasHolidayRush) {
  // Adjust strategy for increased demand and costs
}
```

### Time-Based Decision Making

```typescript
const { currentMonth, currentDay } = useTimeStore();

// End-of-quarter push
if (currentMonth % 3 === 0 && currentDay > 25) {
  // Focus on high-margin routes
}
```

## Performance Considerations

1. **Update Frequency**: Time updates every 100ms when active
2. **Event Processing**: Events checked on time advancement only
3. **State Persistence**: Debounced saves to prevent excessive writes
4. **Memory Usage**: Event history limited to last 50 entries

## Future Enhancements

1. **Weather System**: Seasonal weather affecting routes
2. **Market Hours**: Regional business hours affecting availability
3. **Time Zones**: Global operations with zone-specific timing
4. **Historical Analysis**: Detailed performance metrics over time
5. **Scheduled Events**: Player-created recurring events
6. **Emergency Events**: Critical events requiring immediate response

## Demo and Testing

Access the time system demo at `/time-demo` to see:
- Real-time clock progression
- Event activation and effects
- Economic impact visualization
- Speed control functionality
- Revenue generation cycles

The demo automatically generates route profits and shows how time events affect the economy in real-time.
