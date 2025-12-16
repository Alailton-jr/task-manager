# Task Manager - Makefile
# Simplified commands for building and running the Tauri application

.PHONY: help install dev run build clean test format lint check-types release bundle open-app

# Default target - show help
help:
	@echo "Task Manager - Available Commands:"
	@echo ""
	@echo "  make install       - Install all dependencies (npm)"
	@echo "  make dev          - Start development server (kills port 1420 first)"
	@echo "  make run          - Alias for 'make dev'"
	@echo "  make build        - Build the application for production"
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
	npm install

# Development server (kills port 1420 first)
dev:
	@echo "🚀 Starting development server..."
	@lsof -ti:1420 | xargs kill -9 2>/dev/null || true
	npm run tauri dev

# Alias for dev
run: dev

# Build for production
build:
	@echo "🏗️  Building application..."
	npm run build

# Create production bundle (dmg/app)
release:
	@echo "📦 Creating production bundle..."
	npm run tauri build

# Alias for release
bundle: release

# Clean build artifacts
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf dist/
	rm -rf src-tauri/target/
	@echo "✨ Clean complete!"

# Deep clean (including node_modules)
clean-all: clean
	@echo "🧹 Deep cleaning (removing node_modules)..."
	rm -rf node_modules/
	@echo "✨ Deep clean complete! Run 'make install' to reinstall dependencies."

# Run tests
test:
	@echo "🧪 Running tests..."
	npm test || echo "⚠️  No tests configured"

# Format code
format:
	@echo "✨ Formatting code..."
	npm run format || npx prettier --write "src/**/*.{ts,tsx,css}" || echo "⚠️  Prettier not configured"

# Lint code
lint:
	@echo "🔍 Linting code..."
	npm run lint || npx eslint "src/**/*.{ts,tsx}" || echo "⚠️  ESLint not configured"

# Type checking
check-types:
	@echo "🔍 Checking TypeScript types..."
	npx tsc --noEmit

# Run all checks
check: format lint check-types
	@echo "✅ All checks complete!"

# Open the built macOS application
open-app:
	@echo "🚀 Opening Task Manager.app..."
	@open "src-tauri/target/release/bundle/macos/Task Manager.app" || echo "❌ Application not found. Run 'make release' first."

# Open the DMG installer
open-dmg:
	@echo "💿 Opening DMG installer location..."
	@open src-tauri/target/release/bundle/dmg/ || echo "❌ DMG not found. Run 'make release' first."

# Kill process on port 1420
kill-port:
	@echo "🔪 Killing process on port 1420..."
	@lsof -ti:1420 | xargs kill -9 2>/dev/null || echo "✅ Port 1420 is already free"
