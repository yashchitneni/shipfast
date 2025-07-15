// Game configuration constants

export const GAME_CONFIG = {
  // Initial player values
  STARTING_CASH: 50000,
  STARTING_REPUTATION: 50,
  STARTING_LEVEL: 1,
  
  // Ship configurations
  SHIPS: {
    cargo: {
      name: 'Cargo Ship',
      basePrice: 25000,
      speed: 20,
      capacity: 1000,
      maintenanceCost: 1000,
      fuelEfficiency: 0.8,
    },
    tanker: {
      name: 'Oil Tanker',
      basePrice: 40000,
      speed: 15,
      capacity: 2000,
      maintenanceCost: 1500,
      fuelEfficiency: 0.6,
    },
    container: {
      name: 'Container Ship',
      basePrice: 60000,
      speed: 25,
      capacity: 1500,
      maintenanceCost: 2000,
      fuelEfficiency: 0.7,
    },
  },
  
  // Market configurations
  GOODS: [
    { id: 'electronics', name: 'Electronics', basePrice: 1200, volatility: 0.15 },
    { id: 'oil', name: 'Oil', basePrice: 85, volatility: 0.20 },
    { id: 'containers', name: 'Containers', basePrice: 450, volatility: 0.10 },
    { id: 'food', name: 'Food', basePrice: 320, volatility: 0.12 },
    { id: 'textiles', name: 'Textiles', basePrice: 280, volatility: 0.08 },
    { id: 'machinery', name: 'Machinery', basePrice: 850, volatility: 0.11 },
    { id: 'chemicals', name: 'Chemicals', basePrice: 620, volatility: 0.18 },
    { id: 'vehicles', name: 'Vehicles', basePrice: 2500, volatility: 0.13 },
  ],
  
  // Port configurations
  PORTS: [
    {
      id: 'los-angeles',
      name: 'Los Angeles',
      position: { x: 200, y: 200 },
      type: 'both',
      size: 'large',
      goods: ['electronics', 'vehicles', 'machinery'],
    },
    {
      id: 'shanghai',
      name: 'Shanghai',
      position: { x: 800, y: 150 },
      type: 'both',
      size: 'large',
      goods: ['electronics', 'textiles', 'machinery'],
    },
    {
      id: 'singapore',
      name: 'Singapore',
      position: { x: 600, y: 400 },
      type: 'both',
      size: 'medium',
      goods: ['oil', 'chemicals', 'containers'],
    },
    {
      id: 'mumbai',
      name: 'Mumbai',
      position: { x: 400, y: 350 },
      type: 'export',
      size: 'medium',
      goods: ['textiles', 'food', 'chemicals'],
    },
    {
      id: 'dubai',
      name: 'Dubai',
      position: { x: 450, y: 250 },
      type: 'both',
      size: 'medium',
      goods: ['oil', 'electronics', 'vehicles'],
    },
    {
      id: 'rotterdam',
      name: 'Rotterdam',
      position: { x: 300, y: 100 },
      type: 'import',
      size: 'large',
      goods: ['containers', 'machinery', 'chemicals'],
    },
  ],
  
  // Disaster configurations
  DISASTERS: {
    storm: {
      name: 'Storm',
      probability: 0.05,
      duration: { min: 30, max: 120 }, // minutes
      severity: { min: 3, max: 8 },
      speedReduction: 0.5,
    },
    piracy: {
      name: 'Piracy',
      probability: 0.03,
      duration: { min: 10, max: 30 },
      severity: { min: 2, max: 6 },
      cargoLossChance: 0.3,
    },
    mechanical: {
      name: 'Mechanical Failure',
      probability: 0.02,
      duration: { min: 60, max: 240 },
      severity: { min: 1, max: 5 },
      repairCostMultiplier: 2,
    },
    market_crash: {
      name: 'Market Crash',
      probability: 0.01,
      duration: { min: 120, max: 480 },
      severity: { min: 5, max: 10 },
      priceReduction: 0.3,
    },
  },
  
  // Game mechanics
  MECHANICS: {
    // Time settings (game minutes per real second at 1x speed)
    TIME_SCALE: 60,
    
    // Contract settings
    CONTRACT_SPAWN_RATE: 0.1, // Probability per game hour
    CONTRACT_DEADLINE_MULTIPLIER: 2, // Deadline = distance * multiplier
    CONTRACT_PENALTY_RATE: 0.2, // 20% of contract value
    
    // Reputation settings
    REPUTATION_MAX: 100,
    REPUTATION_MIN: 0,
    REPUTATION_PRICE_MODIFIER: 0.002, // 0.2% better prices per reputation point
    
    // Level progression
    EXPERIENCE_MULTIPLIER: 100,
    LEVEL_CAP: 50,
    
    // Economy settings
    INFLATION_RATE: 0.001, // 0.1% per game day
    FUEL_PRICE_BASE: 3,
    PORT_FEE_BASE: 500,
  },
  
  // UI settings
  UI: {
    TOOLTIP_DELAY: 500,
    ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 5000,
    AUTO_SAVE_INTERVAL: 60000, // 1 minute
  },
  
  // Audio settings
  AUDIO: {
    MASTER_VOLUME: 0.7,
    MUSIC_VOLUME: 0.5,
    EFFECTS_VOLUME: 0.8,
    AMBIENT_VOLUME: 0.6,
  },
};