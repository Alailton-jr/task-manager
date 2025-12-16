# Task Manager

A cross-platform desktop productivity application built with Tauri v2, React, TypeScript, and Tailwind CSS. Manage repeatable tasks, reminders, calendar events, and daily routines with system tray integration and desktop notifications.

## Features

- ✅ **Repeatable Tasks**: Create daily/weekly tasks with timers and completion tracking
- 🔔 **Reminders**: Set multiple notification offsets for important events and birthdays
- 📅 **Calendar Integration**: Google Calendar sync support (requires OAuth setup)
- ⏰ **Daily Routine**: Build and visualize your ideal daily schedule
- 🎨 **Modern Dark UI**: Clean, accessible interface with Tailwind CSS
- 🖥️ **System Tray**: Minimize to tray, run in background
- 🔔 **Desktop Notifications**: Native OS notifications for tasks, reminders, and events
- 🚀 **Autostart**: Launch automatically on system startup
- 💾 **Local Storage**: All data stored locally with import/export functionality

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher): [Download](https://nodejs.org/)
- **Rust** (latest stable): [Install via rustup](https://rustup.rs/)
- **System Dependencies**:
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: Development packages
    ```bash
    # Debian/Ubuntu
    sudo apt install libwebkit2gtk-4.0-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
    
    # Fedora
    sudo dnf install webkit2gtk4.0-devel openssl-devel gtk3-devel libappindicator-gtk3-devel librsvg2-devel
    
    # Arch
    sudo pacman -S webkit2gtk base-devel curl wget file openssl gtk3 libappindicator-gtk3 librsvg
    ```
  - **Windows**: Microsoft Visual Studio C++ Build Tools

## Installation

1. **Clone the repository** (or navigate to the project directory):
   ```bash
   cd task-manager
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the Rust backend** (first time only):
   ```bash
   npm run tauri build -- --debug
   ```

## Development

Run the app in development mode with hot reload:

```bash
npm run tauri dev
```

This will:
- Start the Vite dev server on `http://localhost:1420`
- Launch the Tauri window
- Enable hot module replacement for instant updates

## Building for Production

### Desktop Application

Build optimized binaries for your platform:

```bash
npm run tauri build
```

This creates installers in `src-tauri/target/release/bundle/`:
- **macOS**: `.dmg` and `.app` in `dmg/` and `macos/`
- **Windows**: `.msi` and `.exe` in `msi/` and `nsis/`
- **Linux**: `.deb`, `.AppImage` in `deb/` and `appimage/`

### Static Website (GitHub Pages)

You can also build the frontend as a static website for GitHub Pages:

```bash
npm run build:pages
```

This creates a static website in the `docs/` folder that can be deployed to GitHub Pages.

**Note**: Some Tauri-specific features (like native notifications, system tray, and file system access) won't work in the browser version. The web version is best for previewing the UI/UX.

To enable GitHub Pages:
1. Push the `docs/` folder to your repository
2. Go to **Settings** → **Pages** in your GitHub repository
3. Select **Deploy from a branch**
4. Choose the `main` branch and `/docs` folder
5. Save and wait for deployment

## Usage

### First Launch

1. The app opens to the **Tasks** tab
2. Grant notification permissions when prompted
3. Navigate between tabs using the top navigation bar

### Managing Tasks

- **Create Task**: Click "+ Add Task"
- **Configure**:
  - Title, description, category
  - Estimated duration
  - Repeat pattern (daily, weekly)
  - Preferred start time (for notifications)
- **Track Progress**:
  - Check off completed tasks
  - Use built-in timer (Start/Pause/Reset)
  - Timer auto-completes task and sends notification

### Managing Reminders

- **Create Reminder**: Click "+ Add Reminder"
- **Set Up**:
  - Title, type (birthday/event/custom)
  - Date and time
  - Multiple notification offsets (e.g., 1 week before, 1 day before, on time)
  - Yearly repeat (for birthdays)

### Daily Routine

- **Create Blocks**: Define time blocks for your ideal day
- **Link to Tasks**: Optionally connect routine blocks to tasks
- **Calendar Overlay**: View routine blocks on your calendar

### Settings

- **General**: Time format (12h/24h), language
- **Notifications**: Enable/disable, set default lead times
- **Autostart**: Launch app on system startup
- **Data Management**: Export/import data, reset all data

### System Tray

- **Hide to Tray**: Close the window (app continues running)
- **Show**: Click tray icon or "Show" in tray menu
- **Quit**: Select "Quit" from tray menu to fully exit

## Google Calendar Integration (Optional)

To enable Google Calendar sync, you need to set up OAuth 2.0:

### Setup Steps

1. **Create Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project
   - Enable Google Calendar API

2. **Configure OAuth Consent Screen**:
   - Set up OAuth consent screen
   - Add scopes: `https://www.googleapis.com/auth/calendar.readonly`

3. **Create OAuth 2.0 Credentials**:
   - Create "Desktop app" credentials
   - Download credentials JSON

4. **Implementation** (requires additional development):
   - The current app has placeholder UI for Google Calendar
   - Full implementation requires:
     - Backend OAuth flow handling
     - Token refresh logic
     - API integration layer
     - See `src/features/calendar/CalendarPage.tsx` for details

## Data Storage

All data is stored locally using Tauri's store plugin:

- **Location**: 
  - macOS: `~/Library/Application Support/com.taskmanager.app/tasks.json`
  - Windows: `%APPDATA%\com.taskmanager.app\tasks.json`
  - Linux: `~/.config/com.taskmanager.app/tasks.json`

- **Backup**: Use Settings → Export Data to save a JSON backup
- **Restore**: Use Settings → Import Data to restore from backup

## Security Notes

⚠️ **Important Security Considerations**:

1. **Local Storage**: All data is stored unencrypted locally
2. **Google OAuth**: If implementing, never commit OAuth credentials to version control
3. **Notifications**: May contain sensitive information; review before enabling

## Troubleshooting

### App won't start
- Ensure all prerequisites are installed
- Try rebuilding: `npm run tauri build -- --debug`
- Check console for errors: Run from terminal to see logs

### Notifications not working
- Check OS notification permissions
- Enable notifications in Settings tab
- macOS: System Preferences → Notifications → Task Manager
- Windows: Settings → System → Notifications → Task Manager
- Linux: Varies by desktop environment

### Autostart not working
- Re-toggle in Settings
- macOS: Check System Preferences → Users & Groups → Login Items
- Windows: Check Task Manager → Startup
- Linux: Check autostart entries in `~/.config/autostart/`

### Data loss
- Always export data before major updates
- Keep regular backups using Export Data feature

## Development Notes

### Project Structure

```
task-manager/
├── src/                          # React frontend
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # Base components
│   │   └── layout/               # Layout components
│   ├── features/                 # Feature modules
│   │   ├── tasks/
│   │   ├── reminders/
│   │   ├── calendar/
│   │   ├── routine/
│   │   └── settings/
│   ├── services/                 # Business logic
│   │   ├── storage.ts
│   │   ├── notifications.ts
│   │   └── time.ts
│   ├── store/                    # Zustand state management
│   ├── types/                    # TypeScript types
│   ├── App.tsx                   # Main app component
│   └── main.tsx                  # Entry point
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   └── main.rs               # Tauri app logic
│   ├── icons/                    # App icons
│   ├── Cargo.toml                # Rust dependencies
│   └── tauri.conf.json           # Tauri configuration
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

### Key Technologies

- **Tauri v2**: Desktop app framework
- **React 18**: UI library
- **TypeScript**: Type safety
- **Zustand**: State management
- **Tailwind CSS**: Styling
- **date-fns**: Date utilities
- **Vite**: Build tool

### Adding Icons

Replace placeholder icons in `src-tauri/icons/` with actual icons:
- Required formats: PNG (32x32, 128x128, 128x128@2x), ICO, ICNS
- Use tools like [tauri-icon](https://github.com/tauri-apps/tao/tree/dev/tauri-icon) to generate

## Contributing

This is a complete implementation based on the specifications. To extend:

1. **Google Calendar**: Implement full OAuth flow in `src/services/calendarApi/`
2. **Calendar Views**: Add month/week/agenda components
3. **Enhanced Timers**: Add Pomodoro technique support
4. **Themes**: Add light mode toggle
5. **i18n**: Add multi-language support

## License

This project is provided as-is for educational and personal use.

## Support

For issues or questions:
1. Check this README
2. Review inline code comments
3. Check Tauri documentation: https://tauri.app/
4. Review React/TypeScript documentation

---

**Built with ❤️ using Tauri v2, React, and TypeScript**
