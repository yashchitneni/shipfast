# Flexport: The Video Game

> Build and manage a global logistics empire in this web-based tycoon game

## Overview

Flexport is a strategic logistics management game where players build shipping routes, manage assets, and optimize their global supply chain operations. Inspired by classic tycoon games, it features real-time market dynamics, competitive multiplayer economies, and an AI companion system.

### Key Features

- **Isometric World Map**: Navigate ports and build routes across a dynamic global map
- **Asset Management**: Build and upgrade ships, planes, warehouses, and infrastructure
- **Dynamic Economy**: React to fluctuating market prices and global events
- **AI Companion**: Train your logistics AI to provide insights and optimizations
- **Multiplayer Economy**: Compete indirectly through auctions and shared markets
- **Real-time Events**: Navigate disasters, market crashes, and opportunities

## Technology Stack

### Frontend
- **Next.js 14+**: React framework with App Router
- **Phaser.js 3**: Game engine for isometric map and animations
- **React**: UI components and dashboards
- **Zustand**: State management
- **Tailwind CSS**: Styling framework
- **TypeScript**: Type safety throughout

### Backend
- **Supabase**: Backend-as-a-Service
  - PostgreSQL database
  - Real-time subscriptions
  - Edge Functions for game logic
  - Authentication system

### Development Tools
- **Claude Flow**: AI-powered development coordination
- **ESLint**: Code quality
- **Prettier**: Code formatting
- **Jest**: Testing framework

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Git

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd shipfast
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure Supabase:
   - Create a new Supabase project
   - Add your Supabase URL and anon key to `.env.local`
   - Run database migrations (see Database Setup below)

5. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play the game.

## Project Structure

```
shipfast/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Main game page
│   └── globals.css          # Global styles
├── components/              # React UI components
│   ├── game/               # Game-specific components
│   ├── ui/                 # Reusable UI components
│   └── layouts/            # Layout components
├── lib/                    # Core libraries
│   ├── phaser/            # Phaser scenes and systems
│   ├── store/             # Zustand state management
│   ├── supabase/          # Supabase client and types
│   └── utils/             # Utility functions
├── public/                 # Static assets
│   ├── assets/            # Game assets (sprites, tiles)
│   └── sounds/            # Audio files
├── flexport-integration/   # Backend integration
│   ├── src/               # Source code
│   └── docs/              # API documentation
└── documentation/          # Game design documents
```

## Core Systems

### 1. Map System
- Isometric 2D visualization using Phaser.js
- Port nodes connected by route lines
- Camera controls (pan, zoom)
- Asset placement with validation

### 2. Asset System
- **Transport Assets**: Ships and planes for routes
- **Storage Assets**: Warehouses at ports
- **Support Assets**: Specialists and upgrades
- **Financial Assets**: Loans and insurance

### 3. Route System
- Origin-destination connections
- Profit calculation based on distance and cargo
- Risk modifiers (weather, geopolitics)
- Capacity management

### 4. Economy System
- Dynamic market prices
- Supply and demand simulation
- Contract negotiations
- Revenue and expense tracking

### 5. AI Companion
- Learns from player routes
- Provides optimization suggestions
- Levels up with experience
- Risk analysis capabilities

## Development Phases

### Phase 1: Foundation (Day 1) ✓
- [x] Project setup and structure
- [x] Basic Next.js + Phaser integration
- [ ] Isometric map rendering
- [ ] Asset placement system
- [ ] State management setup
- [ ] Supabase integration

### Phase 2: Core Gameplay (Days 2-3)
- [ ] Route building system
- [ ] Economy simulation
- [ ] Market implementation
- [ ] AI companion basics
- [ ] Time progression

### Phase 3: Features & Content (Days 4-5)
- [ ] Disaster events
- [ ] Advanced AI features
- [ ] Multiplayer auctions
- [ ] Tutorial system
- [ ] Sound and music

### Phase 4: Polish & Launch (Days 6-7)
- [ ] Performance optimization
- [ ] Mobile responsiveness
- [ ] Bug fixes
- [ ] Production deployment
- [ ] Launch preparation

## API Documentation

See [API Documentation](./flexport-integration/docs/api/README.md) for detailed API references.

## State Management

The game uses Zustand for centralized state management. Key stores include:

- **GameStore**: Core game state (cash, assets, routes)
- **UIStore**: UI state (panels, selections, modals)
- **MarketStore**: Market prices and trends
- **AIStore**: AI companion state and learning data

## Database Schema

See [Database Documentation](./docs/database-schema.md) for complete schema details.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Deployment

The game is designed to deploy on Vercel with Supabase as the backend:

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Performance Targets

- Initial load: < 3 seconds
- Game start: < 5 seconds
- 60 FPS on modern hardware
- Mobile responsive design

## License

[License Type] - see LICENSE file for details

## Acknowledgments

- Inspired by RollerCoaster Tycoon and modern logistics
- Built with the amazing Phaser.js game engine
- Powered by Supabase's real-time capabilities

---

For detailed game design, see the [Game Design Document](./documentation/Game%20Design%20Document_%20Flexport.md).