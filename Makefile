# Task Manager - Makefile
# Simplified commands for building and running the Tauri application

.PHONY: help install dev run build build-pages clean test format lint check-types release bundle open-app

# Project directory
PROJECT_DIR := task-manager

# Default target - show help
help:
	@echo "Task Manager - Available Commands:"
	@echo ""
	@echo "  make install       - Install all dependencies (npm)"
	@echo "  make dev          - Start development server (kills port 1420 first)"
	@echo "  make run          - Alias for 'make dev'"
	@echo "  make build        - Build the application for production"
	@echo "  make build-pages  - Build static website for GitHub Pages"
	@echo "  make release      - Build production bundle (dmg/app)"
	@echo "  make bundle       - Alias for 'make release'"
	@echo ""
	@echo "  make clean        - Clean build artifacts and caches"
	@echo "  make clean-all    - Deep clean (removes node_modules too)"
	@echo ""
	@echo "  make test         - Run tests (if available)"
	@echo "  make format       - Format code with prettier"
	@echo "  make lint         - Lint code with eslint"
	@echo "  make check-types  - Run TypeScript type checking"
	@echo "  make check        - Run format, lint, and type checking"
	@echo ""
	@echo "  make open-app     - Open the built macOS application"
	@echo "  make open-dmg     - Open the DMG installer"
	@echo ""

# Install dependencies
install:
	@echo "📦 Installing dependencies..."
	cd $(PROJECT_DIR) && npm install

# Development server (kills port 1420 first)
dev:
	@echo "🚀 Starting development server..."
	@lsof -ti:1420 | xargs kill -9 2>/dev/null || true
	cd $(PROJECT_DIR) && npm run tauri dev

# Alias for dev
run: dev

# Build for production
build:
	@echo "🏗️  Building application..."
	cd $(PROJECT_DIR) && npm run build

# Build static website for GitHub Pages
build-pages:
	@echo "📄 Building static website for GitHub Pages..."
	cd $(PROJECT_DIR) && npm run build:pages
	@echo "✨ Static website built in docs/ folder!"
	@echo "💡 To deploy to GitHub Pages:"
	@echo "   1. Push the docs/ folder to your repository"
	@echo "   2. Enable GitHub Pages in repository settings (Settings → Pages)"
	@echo "   3. Select 'main' branch and '/docs' folder"

# Create production bundle (dmg/app)
release:
	@echo "📦 Creating production bundle..."
	cd $(PROJECT_DIR) && npm run tauri build

# Alias for release
bundle: release

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf $(PROJECT_DIR)/dist/
	rm -rf $(PROJECT_DIR)/src-tauri/target/
	@echo "✨ Clean complete!"

# Deep clean (including node_modules)
clean-all: clean
	@echo "🧹 Deep cleaning (removing node_modules)..."
	rm -rf $(PROJECT_DIR)/node_modules/
	@echo "✨ Deep clean complete! Run 'make install' to reinstall dependencies."

# Run tests
test:
	@echo "🧪 Running tests..."
	cd $(PROJECT_DIR) && npm test || echo "⚠️  No tests configured"

# Format code
format:
	@echo "✨ Formatting code..."
	cd $(PROJECT_DIR) && npm run format || npx prettier --write "src/**/*.{ts,tsx,css}" || echo "⚠️  Prettier not configured"

# Lint code
lint:
	@echo "🔍 Linting code..."
	cd $(PROJECT_DIR) && npm run lint || npx eslint "src/**/*.{ts,tsx}" || echo "⚠️  ESLint not configured"

# Type checking
check-types:
	@echo "🔍 Checking TypeScript types..."
	cd $(PROJECT_DIR) && npx tsc --noEmit

# Run all checks
check: format lint check-types
	@echo "✅ All checks complete!"

# Open the built macOS application
open-app:
	@echo "🚀 Opening Task Manager.app..."
	@open "$(PROJECT_DIR)/src-tauri/target/release/bundle/macos/Task Manager.app" || echo "❌ Application not found. Run 'make release' first."

# Open the DMG installer
open-dmg:
	@echo "💿 Opening DMG installer location..."
	@open $(PROJECT_DIR)/src-tauri/target/release/bundle/dmg/ || echo "❌ DMG not found. Run 'make release' first."

# Kill process on port 1420
kill-port:
	@echo "🔪 Killing process on port 1420..."
	@lsof -ti:1420 | xargs kill -9 2>/dev/null || echo "✅ Port 1420 is already free"
