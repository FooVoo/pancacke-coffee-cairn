# Cairn Character Manager

A mobile-first SvelteKit application for managing Cairn/D&D-style characters with SSR and Turso DB integration.

## Features

- 🎮 **Enriched Character Management** - Complex D&D/Cairn-like character sheets
- 📱 **Mobile-First Design** - Optimized for mobile devices, enhanced for desktop
- 🔐 **Authentication Mock** - Login/Register/Logout flow (development only)
- 🗄️ **Turso DB Integration** - In-memory SQLite for dev, ready for production Turso
- ⚡ **Server-Side Rendering** - Full SSR for optimal performance
- 🎨 **Dark Grim Theme** - Atmospheric color scheme for fantasy RPG feel

## Character Features

Each character includes:

### Core Stats
- 6 Attributes (STR, DEX, CON, INT, WIS, CHA) with modifiers
- HP/Max HP, Armor Class, Proficiency Bonus
- Level and Experience tracking

### Combat & Equipment
- Weapons (with damage and properties)
- Armor (with AC values)
- General equipment inventory
- Currency (Gold, Silver, Copper)

### Abilities & Skills
- Saving throw proficiencies
- Skill lists
- Tool/Weapon proficiencies
- Languages
- Spells with spell slot tracking
- Special features and abilities

### Personality
- Personality traits
- Ideals, Bonds, Flaws
- Background story
- Active conditions
- Notes

## Getting Started

### Prerequisites

- Node.js 20+ 
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### First Run

The app automatically:
1. Initializes an in-memory SQLite database
2. Creates a demo user (username: `demo`, password: `demo`)
3. Creates a sample character "Edrin Thorn"
4. Logs you in as the demo user

## Project Structure

```
src/
├── lib/
│   ├── server/
│   │   ├── auth.ts          # Authentication utilities (MOCK)
│   │   ├── characters.ts    # Character CRUD operations
│   │   └── db.ts           # Database setup and connection
│   └── assets/             # Images and static assets
├── routes/
│   ├── characters/         # Character list and detail pages
│   │   ├── [id]/          # Character detail (SSR)
│   │   └── +page.svelte   # Character list (SSR)
│   ├── login/             # Login page
│   ├── register/          # Registration page
│   └── logout/            # Logout action
├── app.css                # Global styles with CSS variables
└── hooks.server.ts        # Server hooks (DB init, auth)
```

## Development Notes

### Authentication Mock

⚠️ **WARNING**: The authentication system is a MOCK for development only:
- Passwords are "hashed" using simple string concatenation
- Session IDs use timestamp + random (not cryptographically secure)
- For production, use proper libraries:
  - Password hashing: `bcrypt` or `argon2`
  - Session IDs: `crypto.randomUUID()` or `uuid` package

### Database

Currently uses `:memory:` SQLite for development. To use Turso in production:

1. Create a Turso database:
   ```bash
   turso db create my-cairn-db
   turso db show my-cairn-db --url
   turso db tokens create my-cairn-db
   ```

2. Set environment variables:
   ```bash
   TURSO_DATABASE_URL=libsql://your-database.turso.io
   TURSO_AUTH_TOKEN=your-auth-token
   ```

### Mobile-First Design

All components are designed mobile-first:
- Base styles target mobile devices (375px viewport)
- Media queries enhance for tablets (768px+) and desktop (1024px+)
- Touch-friendly tap targets (min 44x44px)
- Responsive typography using `clamp()`

## Color Scheme

The grim dark theme uses CSS custom properties:

```css
--grim-bg: #0b0b0c          /* Main background */
--grim-surface: #101112      /* Cards, panels */
--grim-primary: #7f1919      /* Blood red (primary) */
--grim-accent: #2b7c78       /* Teal accent */
--grim-text: #e6e3dd         /* Off-white text */
```

## API Routes

All data loading uses SvelteKit's SSR:

- `GET /` → Redirects to `/characters`
- `GET /characters` → Lists all user's characters (SSR)
- `GET /characters/[id]` → Shows character detail (SSR)
- `POST /login` → Authenticates user
- `POST /register` → Creates new user
- `POST /logout` → Destroys session

## Testing

```bash
# Run type checking
npm run check

# Run linter
npm run lint

# Format code
npm run format

# Run unit tests
npm run test:unit

# Run e2e tests
npm run test:e2e
```

## Deployment

The app is configured for Vercel deployment:

```bash
# Deploy to Vercel
vercel

# Or use the adapter for other platforms
# See: https://kit.svelte.dev/docs/adapters
```

## License

MIT

## Contributing

This is a development project. For production use:
1. Replace authentication mock with proper auth (e.g., Lucia, Auth.js)
2. Set up Turso database
3. Add proper UUID generation
4. Implement character CRUD forms
5. Add character avatar upload
6. Add tests

## Demo Credentials

- **Username**: `demo`
- **Password**: `demo`

The demo user is automatically created with a sample character on first load.
