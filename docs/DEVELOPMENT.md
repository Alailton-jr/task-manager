# Development Guide

Technical documentation for developers who want to contribute or extend Task Manager.

## Table of Contents

- [Architecture](#architecture)
- [Setup Development Environment](#setup-development-environment)
- [Project Structure](#project-structure)
- [Building & Deploying](#building--deploying)
- [Contributing](#contributing)
- [Extending Features](#extending-features)

## Architecture

### Tech Stack

```
┌─────────────────────────────────────┐
│         Desktop Window              │
│  ┌──────────────────────────────┐  │
│  │      React Frontend          │  │
│  │  - TypeScript                │  │
│  │  - Tailwind CSS              │  │
│  │  - Zustand (State)           │  │
│  │  - Vite (Build)              │  │
│  └──────────────────────────────┘  │
│             ↕ IPC API               │
│  ┌──────────────────────────────┐  │
│  │      Tauri Backend           │  │
│  │  - Rust                      │  │
│  │  - System Integration        │  │
│  │  - Native APIs               │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

### Key Technologies

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Runtime** | Tauri v2 | Desktop app framework |
| **Frontend** | React 18 | UI library |
| **Language** | TypeScript 5 | Type safety |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **State** | Zustand | Lightweight state management |
| **Build** | Vite | Fast dev server & bundler |
| **Backend** | Rust | System integration |
| **Storage** | Tauri Store Plugin | Persistent local storage |
| **Notifications** | Tauri Notification Plugin | Native OS notifications |
| **Icons** | Lucide React | Icon library |
| **Date Utils** | date-fns | Date manipulation |
| **Drag & Drop** | @dnd-kit | Task/routine ordering |

### Data Flow

```
User Action
    ↓
React Component
    ↓
Zustand Store Action
    ↓
Service Layer (src/services/)
    ↓
Tauri API (if needed)
    ↓
Storage Plugin
    ↓
File System
```

### State Management

```typescript
// Zustand store structure
{
  tasks: Task[]           // All tasks
  reminders: Reminder[]   // All reminders
  routineBlocks: Block[]  // Daily routine
  settings: Settings      // User preferences
  profiles: Profile[]     // User profiles
  
  // Actions
  addTask()
  updateTask()
  deleteTask()
  // ... etc
}
```

## Setup Development Environment

### Prerequisites

1. **Install required tools**:
   - Node.js 18+
   - Rust (via rustup)
   - Platform build tools (see [INSTALLATION.md](INSTALLATION.md))

2. **Clone and setup**:
   ```bash
   git clone https://github.com/your-username/task-manager.git
   cd task-manager/task-manager
   npm install
   ```

### Development Workflow

```bash
# Start dev server with hot reload
npm run tauri dev

# Or use Make (from repo root)
make dev
```

### Development Tips

1. **Hot Reload**: Frontend changes auto-reload, Rust changes require rebuild
2. **Console**: Open dev tools with `Cmd+Option+I` (Mac) or `F12` (Windows/Linux)
3. **Logs**: Rust logs appear in terminal running `npm run tauri dev`
4. **Debugging**: Use React DevTools and browser console

## Project Structure

```
task-manager/
├── task-manager/                    # Main application
│   ├── src/                         # React frontend
│   │   ├── components/              # Reusable components
│   │   │   ├── ui/                  # Base UI components
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/              # Layout components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Navigation.tsx
│   │   │   │   └── Layout.tsx
│   │   │   ├── calendar/            # Calendar components
│   │   │   ├── pomodoro/            # Timer components
│   │   │   ├── profiles/            # Profile management
│   │   │   └── tasks/               # Task components
│   │   │
│   │   ├── features/                # Feature modules
│   │   │   ├── tasks/
│   │   │   │   ├── TasksPage.tsx    # Main tasks view
│   │   │   │   └── TaskModal.tsx    # Task edit modal
│   │   │   ├── reminders/
│   │   │   │   ├── RemindersPage.tsx
│   │   │   │   └── ReminderModal.tsx
│   │   │   ├── calendar/
│   │   │   │   └── CalendarPage.tsx
│   │   │   ├── routine/
│   │   │   │   ├── RoutinePage.tsx
│   │   │   │   └── RoutineBlockModal.tsx
│   │   │   ├── analytics/
│   │   │   │   └── AnalyticsPage.tsx
│   │   │   └── settings/
│   │   │       └── SettingsPage.tsx
│   │   │
│   │   ├── services/                # Business logic
│   │   │   ├── storage.ts           # Persistent storage
│   │   │   ├── notifications.ts     # Notification system
│   │   │   ├── time.ts              # Date/time utilities
│   │   │   └── googleCalendar.ts    # Google Calendar API
│   │   │
│   │   ├── store/                   # State management
│   │   │   └── index.ts             # Zustand store
│   │   │
│   │   ├── types/                   # TypeScript types
│   │   │   └── index.ts             # Type definitions
│   │   │
│   │   ├── App.tsx                  # Main app component
│   │   ├── main.tsx                 # Entry point
│   │   └── index.css                # Global styles
│   │
│   ├── src-tauri/                   # Rust backend
│   │   ├── src/
│   │   │   ├── main.rs              # Tauri app setup
│   │   │   └── lib.rs               # Library code
│   │   ├── capabilities/            # Tauri capabilities
│   │   │   └── main.json
│   │   ├── icons/                   # App icons
│   │   ├── Cargo.toml               # Rust dependencies
│   │   └── tauri.conf.json          # Tauri configuration
│   │
│   ├── public/                      # Static assets
│   │   └── sounds/                  # Notification sounds
│   │
│   ├── index.html                   # HTML template
│   ├── package.json                 # npm dependencies
│   ├── vite.config.ts               # Vite configuration
│   ├── tailwind.config.js           # Tailwind CSS config
│   └── tsconfig.json                # TypeScript config
│
├── docs/                            # Documentation & GitHub Pages
│   ├── images/                      # Screenshots
│   ├── INSTALLATION.md
│   ├── USER_GUIDE.md
│   ├── DEVELOPMENT.md (this file)
│   └── API.md
│
├── Makefile                         # Build automation
└── README.md                        # Main readme
```

## Building & Deploying

### Desktop Application

```bash
# Development build (faster, includes debug info)
npm run tauri build -- --debug

# Production build (optimized)
npm run tauri build

# Using Make (from repo root)
make release
```

**Output locations**:
- macOS: `src-tauri/target/release/bundle/dmg/` and `macos/`
- Windows: `src-tauri/target/release/bundle/msi/` and `nsis/`
- Linux: `src-tauri/target/release/bundle/deb/` and `appimage/`

### GitHub Pages (Static Website)

```bash
# Build static site
npm run build:pages

# Using Make (from repo root)
make build-pages
```

**Configuration**:
- Output: `/docs` folder at repo root
- Base path: `/task-manager/` (configurable in `vite.config.ts`)
- Deployment: Push to GitHub, enable Pages from `/docs` folder

**Limitations of web version**:
- ❌ No native notifications (browser notifications only)
- ❌ No system tray
- ❌ No autostart
- ❌ No file system access
- ✅ UI/UX fully functional
- ✅ Perfect for demos and previews

### Environment Variables

Create `.env` file in `task-manager/`:

```env
# For Google Calendar (optional)
VITE_GOOGLE_CLIENT_ID=your-client-id
VITE_GOOGLE_CLIENT_SECRET=your-client-secret

# Build configuration
BUILD_FOR_PAGES=false
```

## Contributing

### Code Style

- **TypeScript**: Use strict mode, explicit types
- **React**: Functional components with hooks
- **Naming**: 
  - Components: PascalCase (`TaskCard.tsx`)
  - Files: camelCase or kebab-case
  - Functions: camelCase
  - Constants: UPPER_SNAKE_CASE
- **Formatting**: Prettier (run `npm run format`)
- **Linting**: ESLint (run `npm run lint`)

### Git Workflow

1. **Fork** the repository
2. **Create branch**: `git checkout -b feature/my-feature`
3. **Make changes** and commit
4. **Push**: `git push origin feature/my-feature`
5. **Create Pull Request**

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add weekly task summary
fix: resolve timer pause issue
docs: update installation guide
style: format with prettier
refactor: extract task logic to service
test: add task completion tests
chore: update dependencies
```

### Testing (Coming Soon)

```bash
# Unit tests
npm test

# E2E tests
npm run test:e2e

# Coverage
npm run test:coverage
```

## Extending Features

### Adding a New Feature

Example: Adding a "Focus Mode" feature

1. **Create types** (`src/types/index.ts`):
   ```typescript
   export interface FocusSession {
     id: string;
     taskId: string;
     startTime: Date;
     duration: number;
     breaks: number;
   }
   ```

2. **Add to store** (`src/store/index.ts`):
   ```typescript
   interface AppStore {
     // ... existing state
     focusSessions: FocusSession[];
     
     // Actions
     startFocusSession: (taskId: string) => void;
     endFocusSession: (id: string) => void;
   }
   ```

3. **Create service** (`src/services/focus.ts`):
   ```typescript
   export const startFocusTimer = (duration: number) => {
     // Timer logic
   };
   ```

4. **Build UI** (`src/features/focus/FocusPage.tsx`):
   ```typescript
   export const FocusPage = () => {
     // Component logic
   };
   ```

5. **Add navigation** (`src/components/layout/Navigation.tsx`)
6. **Update routes** (`src/App.tsx`)

### Adding a New UI Component

1. Create component in `src/components/ui/`:
   ```typescript
   // src/components/ui/Badge.tsx
   interface BadgeProps {
     variant: 'success' | 'warning' | 'error';
     children: React.ReactNode;
   }
   
   export const Badge = ({ variant, children }: BadgeProps) => {
     return (
       <span className={`badge badge-${variant}`}>
         {children}
       </span>
     );
   };
   ```

2. Export from `src/components/ui/index.ts`
3. Use in features: `import { Badge } from '@/components/ui'`

### Adding Tauri Commands (Rust)

1. **Define command** (`src-tauri/src/main.rs`):
   ```rust
   #[tauri::command]
   fn get_system_info() -> String {
       // Implementation
       "System info".to_string()
   }
   ```

2. **Register** in main:
   ```rust
   tauri::Builder::default()
       .invoke_handler(tauri::generate_handler![get_system_info])
       .run(tauri::generate_context!())
   ```

3. **Call from frontend**:
   ```typescript
   import { invoke } from '@tauri-apps/api';
   
   const info = await invoke('get_system_info');
   ```

### Google Calendar Integration

To implement full OAuth flow:

1. **Setup Google Cloud** (see User Guide)
2. **Add OAuth logic** in `src/services/googleCalendar.ts`
3. **Implement token refresh**
4. **Add calendar sync service**
5. **Update CalendarPage.tsx**

See inline comments in `googleCalendar.ts` for detailed TODOs.

### Custom Notification Sounds

1. Add `.mp3` files to `public/sounds/`
2. Update `src/services/notifications.ts`:
   ```typescript
   const sounds = ['bell', 'chime', 'your-sound'];
   ```
3. Rebuild app

### Theming / Customization

**Current**: Dark mode only with fixed color palette

**To add light mode**:
1. Update `tailwind.config.js` with light variants
2. Add theme toggle in settings
3. Store preference in Zustand
4. Apply theme class to `<html>` element

## Architecture Decisions

### Why Tauri?

- ✅ Small bundle size (~3MB vs 100MB+ Electron)
- ✅ Native performance (Rust backend)
- ✅ Better security (no Node.js exposure)
- ✅ Cross-platform with single codebase
- ✅ Active development and community

### Why Zustand over Redux?

- ✅ Less boilerplate
- ✅ Better TypeScript support
- ✅ Simpler to understand
- ✅ Perfect for small to medium apps
- ✅ Easy to extend

### Why Tailwind CSS?

- ✅ Rapid development
- ✅ Consistent design system
- ✅ Small production bundle (purged)
- ✅ Great with component libraries

## Performance Optimization

### Frontend

- Use `React.memo` for expensive components
- Lazy load feature pages with `React.lazy`
- Debounce search/filter inputs
- Virtual scrolling for long lists (future)

### Backend

- Batch storage writes
- Debounce file system operations
- Use async Rust operations
- Efficient data structures

### Build

- Vite tree-shaking (automatic)
- Tailwind CSS purging (automatic)
- Code splitting by route
- Asset optimization

## Security Considerations

- ⚠️ All data stored locally (unencrypted)
- ⚠️ Google OAuth tokens in local storage
- ⚠️ No server-side validation
- ✅ Tauri security context isolation
- ✅ No arbitrary code execution
- ✅ Sandboxed file system access

## Future Roadmap

- [ ] Cloud sync (optional)
- [ ] Mobile app (React Native or Tauri Mobile)
- [ ] Collaboration features
- [ ] Plugin system
- [ ] Advanced analytics (ML predictions)
- [ ] Integration marketplace
- [ ] Light theme
- [ ] Keyboard shortcuts
- [ ] Accessibility improvements
- [ ] Unit tests & E2E tests

## Resources

- [Tauri Documentation](https://tauri.app/)
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Zustand Guide](https://github.com/pmndrs/zustand)

## Getting Help

- **Issues**: [GitHub Issues](https://github.com/your-username/task-manager/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/task-manager/discussions)
- **Tauri Discord**: [Join here](https://discord.com/invite/tauri)

---

**Happy coding!** 🚀
