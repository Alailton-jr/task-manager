# Installation Guide

Complete setup instructions for Task Manager across all platforms.

## Table of Contents

- [System Requirements](#system-requirements)
- [Installing Prerequisites](#installing-prerequisites)
- [Installation Methods](#installation-methods)
- [Post-Installation](#post-installation)
- [Troubleshooting](#troubleshooting)

## System Requirements

### Minimum Requirements

- **RAM**: 2GB (4GB recommended)
- **Disk Space**: 200MB for app + dependencies
- **OS**: 
  - macOS 10.15 (Catalina) or later
  - Windows 10 (1809+) or Windows 11
  - Ubuntu 20.04+, Debian 11+, Fedora 36+, or equivalent

### Software Requirements

- Node.js 18.0 or higher
- Rust (latest stable version)
- Platform-specific build tools

## Installing Prerequisites

### macOS

1. **Install Xcode Command Line Tools**:
   ```bash
   xcode-select --install
   ```

2. **Install Node.js**:
   ```bash
   # Using Homebrew (recommended)
   brew install node

   # Or download from https://nodejs.org/
   ```

3. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

### Windows

1. **Install Microsoft Visual Studio C++ Build Tools**:
   - Download [Visual Studio](https://visualstudio.microsoft.com/downloads/)
   - Install "Desktop development with C++" workload

2. **Install Node.js**:
   - Download installer from [nodejs.org](https://nodejs.org/)
   - Run installer and follow prompts

3. **Install Rust**:
   - Download [rustup-init.exe](https://rustup.rs/)
   - Run and follow installer prompts
   - Restart terminal after installation

### Linux (Ubuntu/Debian)

1. **Install System Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y \
     libwebkit2gtk-4.0-dev \
     build-essential \
     curl \
     wget \
     file \
     libssl-dev \
     libgtk-3-dev \
     libayatana-appindicator3-dev \
     librsvg2-dev
   ```

2. **Install Node.js**:
   ```bash
   # Using NodeSource repository
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

3. **Install Rust**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source $HOME/.cargo/env
   ```

### Linux (Fedora)

1. **Install System Dependencies**:
   ```bash
   sudo dnf install -y \
     webkit2gtk4.0-devel \
     openssl-devel \
     gtk3-devel \
     libappindicator-gtk3-devel \
     librsvg2-devel
   ```

2. **Install Node.js and Rust** (same as Ubuntu above)

### Linux (Arch)

1. **Install System Dependencies**:
   ```bash
   sudo pacman -S \
     webkit2gtk \
     base-devel \
     curl \
     wget \
     file \
     openssl \
     gtk3 \
     libappindicator-gtk3 \
     librsvg
   ```

2. **Install Node.js and Rust**:
   ```bash
   sudo pacman -S nodejs npm rust
   ```

## Installation Methods

### Method 1: From Source (Recommended for Development)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/task-manager.git
   cd task-manager/task-manager
   ```

2. **Install npm dependencies**:
   ```bash
   npm install
   ```

3. **Run in development mode**:
   ```bash
   npm run tauri dev
   ```

4. **Build for production**:
   ```bash
   npm run tauri build
   ```

   Find installers in:
   - macOS: `src-tauri/target/release/bundle/dmg/`
   - Windows: `src-tauri/target/release/bundle/msi/`
   - Linux: `src-tauri/target/release/bundle/deb/` or `appimage/`

### Method 2: Pre-built Binaries (Coming Soon)

Download the latest release for your platform:

1. Go to [Releases](https://github.com/your-username/task-manager/releases)
2. Download the appropriate file:
   - **macOS**: `Task-Manager_<version>_x64.dmg`
   - **Windows**: `Task-Manager_<version>_x64.msi`
   - **Linux**: `task-manager_<version>_amd64.deb` or `.AppImage`
3. Install/run the downloaded file

### Method 3: Using Make (Unix-like systems)

From the repository root:

```bash
# Install dependencies
make install

# Run development server
make dev

# Build release
make release
```

## Post-Installation

### First Launch

1. **Grant Permissions**:
   - macOS: System Preferences → Security & Privacy → Allow Task Manager
   - Windows: Windows Defender may prompt - click "Allow"
   - Linux: Should work immediately

2. **Enable Notifications**:
   - macOS: System Preferences → Notifications → Task Manager
   - Windows: Settings → System → Notifications → Task Manager
   - Linux: Check your desktop environment's notification settings

3. **Optional: Enable Autostart**:
   - Open Task Manager
   - Go to Settings tab
   - Toggle "Launch on Startup"

### Data Location

Your data is stored locally at:

- **macOS**: `~/Library/Application Support/com.taskmanager.app/`
- **Windows**: `%APPDATA%\com.taskmanager.app\`
- **Linux**: `~/.config/com.taskmanager.app/`

## Troubleshooting

### Build Issues

**Issue**: `error: could not compile` (Rust errors)
```bash
# Update Rust
rustup update stable

# Clean and rebuild
cd src-tauri
cargo clean
cd ..
npm run tauri build
```

**Issue**: `ENOENT: no such file` (npm errors)
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Issue**: Vite errors or frontend issues
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### Runtime Issues

**Issue**: App won't start
```bash
# Run from terminal to see error logs
./src-tauri/target/release/task-manager
```

**Issue**: Notifications not working
- Check OS notification permissions (see Post-Installation)
- Enable in app Settings → Notifications
- Restart the app

**Issue**: Autostart not working
- Re-toggle in Settings
- Check OS autostart settings:
  - macOS: System Preferences → Users & Groups → Login Items
  - Windows: Task Manager → Startup tab
  - Linux: Varies by DE, check `~/.config/autostart/`

**Issue**: High CPU usage
- Check for runaway timers in Tasks tab
- Try restarting the app
- Report persistent issues on GitHub

### Platform-Specific Issues

**macOS**: "App is damaged and can't be opened"
```bash
# Remove quarantine attribute
xattr -cr "/Applications/Task Manager.app"
```

**Windows**: "Windows protected your PC"
- Click "More info"
- Click "Run anyway"
- This is expected for unsigned apps

**Linux**: AppImage won't run
```bash
# Make executable
chmod +x task-manager_*.AppImage

# Run
./task-manager_*.AppImage
```

### Getting Help

If you're still having issues:

1. Check [existing issues](https://github.com/your-username/task-manager/issues)
2. Search [discussions](https://github.com/your-username/task-manager/discussions)
3. Create a new issue with:
   - Your OS and version
   - Node.js version (`node --version`)
   - Rust version (`rustc --version`)
   - Complete error message
   - Steps to reproduce

## Updating

### From Source

```bash
cd task-manager
git pull origin main
cd task-manager
npm install
npm run tauri build
```

### From Binary

Download and install the latest release following Method 2 above.

---

**Next Steps**: Check out the [User Guide](USER_GUIDE.md) to learn how to use all features!
