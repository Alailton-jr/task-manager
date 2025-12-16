# User Guide

Complete guide to using Task Manager effectively.

## Table of Contents

- [Getting Started](#getting-started)
- [Tasks](#tasks)
- [Reminders](#reminders)
- [Calendar](#calendar)
- [Routine](#routine)
- [Analytics](#analytics)
- [Settings](#settings)
- [Tips & Tricks](#tips--tricks)

## Getting Started

### First Launch

![Tasks View](images/Tasks.png)

When you first launch Task Manager:

1. **Grant Permissions**: Allow notifications when prompted
2. **Explore the Interface**: Use the navigation bar at the top
3. **Create Your First Task**: Click the "+ Add Task" button

### Navigation

- **Tasks** (📝): Manage your repeatable tasks
- **Reminders** (🔔): Set up event notifications
- **Calendar** (📅): View and sync with Google Calendar
- **Routine** (⏰): Design your ideal daily schedule
- **Analytics** (📊): Track your productivity
- **Settings** (⚙️): Configure preferences

## Tasks

![Tasks View](images/Tasks.png)

### Creating a Task

1. Click **"+ Add Task"**
2. Fill in the details:
   - **Title**: Brief task name
   - **Description**: Optional details
   - **Category**: Work, Personal, Health, Learning, or Other
   - **Estimated Duration**: How long the task typically takes
   - **Repeat Pattern**: Daily, Weekly, or One-time
   - **Preferred Time**: When you'd like to be notified
   - **Tags**: Optional labels for organization

3. Click **"Add Task"**

### Using the Timer

Each task has a built-in timer:

1. Click **"Start Timer"** to begin
2. Click **"Pause"** to pause (continues from where you left off)
3. Click **"Reset"** to clear the timer
4. Timer automatically completes the task when duration is reached

**Features**:
- ✅ Auto-completion when timer finishes
- 🔔 Desktop notification on completion
- 📊 Time tracked for analytics
- ⏸️ Pause and resume anytime

### Managing Tasks

- **Complete**: Check the checkbox (or let timer finish)
- **Edit**: Click the task to open details modal
- **Delete**: Click trash icon
- **Filter**: Use category tabs to focus
- **Search**: (Coming soon) Search by title or tags

### Task Repeat Patterns

- **Daily**: Resets every day at midnight
- **Weekly**: Resets every 7 days
- **One-time**: Doesn't repeat

## Reminders

![Reminders View](images/Reminders.png)

### Creating a Reminder

1. Click **"+ Add Reminder"**
2. Configure:
   - **Title**: Event name
   - **Type**: Event, Birthday, or Custom
   - **Date & Time**: When the event occurs
   - **Notification Offsets**: When to be notified
   - **Repeat Yearly**: For birthdays and anniversaries

3. Click **"Add Reminder"**

### Notification Offsets

Add multiple notification times before your event:

- **1 week before**: Get early warning
- **1 day before**: Final preparation reminder
- **1 hour before**: Last-minute notification
- **At time**: When event starts
- **Custom**: Set your own offset

**Example**: For a birthday on June 15th at 12:00 PM:
- June 8, 12:00 PM (1 week before)
- June 14, 12:00 PM (1 day before)
- June 15, 12:00 PM (at time)

### Birthday Reminders

Special handling for birthdays:

1. Set type to **"Birthday"**
2. Enable **"Repeat Yearly"**
3. Add notification offsets (recommended: 1 week, 1 day)
4. The reminder will automatically repeat every year

### Managing Reminders

- **Edit**: Click reminder card
- **Delete**: Click trash icon
- **View Upcoming**: Sorted by date (soonest first)
- **Past Reminders**: Automatically archived

## Calendar

![Calendar View](images/Calendar.png)

### Google Calendar Integration

**Current Status**: OAuth setup required (see below)

Once configured:
1. Click **"Connect Google Calendar"**
2. Authorize access
3. Your events sync automatically
4. View combined calendar with tasks and routine

### Setting Up Google Calendar (Advanced)

1. Create a [Google Cloud Project](https://console.cloud.google.com/)
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials (Desktop app)
4. Configure OAuth consent screen
5. Add credentials to app (requires code modification)

See [Development Guide](DEVELOPMENT.md) for implementation details.

### Calendar Views

- **Month View**: See full month overview
- **Week View**: Detailed weekly schedule
- **Event Details**: Click events for more info

## Routine

![Routine View](images/Routine.png)

### Creating Routine Blocks

Build your ideal daily schedule:

1. Click **"+ Add Block"**
2. Configure:
   - **Title**: Activity name (e.g., "Morning Workout")
   - **Start Time**: When it begins
   - **End Time**: When it ends
   - **Category**: Work, Personal, Health, etc.
   - **Linked Task**: Optional task connection
   - **Color**: Visual organization

3. Click **"Add Block"**

### Using the Routine

- **Visual Timeline**: See your whole day at a glance
- **Time Blocks**: Color-coded by category
- **Task Links**: Connected tasks show completion status
- **Flexible**: Edit blocks anytime
- **Calendar Overlay**: View on calendar page

### Best Practices

1. **Start Simple**: Begin with 3-5 key blocks
2. **Be Realistic**: Allow buffer time between activities
3. **Link Tasks**: Connect routine blocks to repeatable tasks
4. **Review Weekly**: Adjust based on what works
5. **Use Colors**: Visual cues help quickly scan your day

## Analytics

![Analytics View](images/Analytics.png)

### Tracking Your Progress

The Analytics dashboard shows:

- **Task Completion Rate**: Overall completion percentage
- **Category Breakdown**: Which categories you focus on
- **Weekly Trends**: Completion patterns over time
- **Time Tracking**: Total time spent on tasks
- **Streaks**: Consecutive days of completed tasks

### Understanding the Charts

- **Pie Chart**: Category distribution
- **Bar Chart**: Weekly completion rates
- **Line Graph**: Productivity trends
- **Heat Map**: Active days and patterns

### Tips for Better Insights

1. **Use Timers**: Get accurate time tracking
2. **Consistent Categories**: Easier to analyze patterns
3. **Regular Completion**: Check off tasks promptly
4. **Review Weekly**: Look for improvement opportunities

## Settings

![Settings View](images/Settings.png)

### General Settings

- **Time Format**: 12-hour or 24-hour
- **Language**: Currently English (more coming)
- **Theme**: Dark mode (light mode coming soon)
- **Profile**: Multiple profiles for different contexts

### Notification Settings

- **Enable Notifications**: Master toggle
- **Sound**: Choose notification sound
- **Default Lead Time**: For tasks and reminders
- **Quiet Hours**: Silence notifications during sleep

### Autostart

- **Launch on Startup**: Auto-start with your computer
- **Start Minimized**: Open in system tray
- **Platform Support**:
  - ✅ macOS: Login Items
  - ✅ Windows: Startup folder
  - ✅ Linux: Autostart entries

### Data Management

#### Export Data

1. Click **"Export Data"**
2. Choose save location
3. Saves `task-manager-backup-YYYY-MM-DD.json`

**When to Export**:
- Before major updates
- Weekly/monthly backups
- Before changing devices
- Testing new features

#### Import Data

1. Click **"Import Data"**
2. Select your backup `.json` file
3. Confirm restoration
4. App reloads with imported data

**Note**: Import **replaces** all current data!

#### Reset All Data

⚠️ **Warning**: This deletes everything!

1. Click **"Reset All Data"**
2. Confirm (requires typing "DELETE")
3. All tasks, reminders, routine blocks cleared
4. Settings reset to defaults

## Tips & Tricks

### Productivity Hacks

1. **Pomodoro Technique**:
   - Create 25-minute tasks
   - Use timer for focused work
   - Take 5-minute breaks between

2. **Time Blocking**:
   - Build comprehensive routine
   - Link tasks to routine blocks
   - Follow your schedule

3. **Weekly Planning**:
   - Sunday: Review analytics
   - Plan next week's tasks
   - Adjust routine if needed

4. **Category Strategy**:
   - Limit to 3-5 categories
   - Balance across types
   - Track in analytics

### Keyboard Shortcuts

**Coming Soon**:
- `Cmd/Ctrl + N`: New task
- `Cmd/Ctrl + R`: New reminder
- `Cmd/Ctrl + ,`: Settings
- `Escape`: Close modal

### System Tray Tips

1. **Minimize to Tray**: Close window to hide app
2. **Quick Access**: Click tray icon to restore
3. **Quit Completely**: Right-click tray → Quit
4. **Background Notifications**: Still receive alerts when hidden

### Data Safety

1. **Weekly Exports**: Set a recurring reminder to export data
2. **Cloud Backup**: Store exports in Dropbox/Google Drive
3. **Version Control**: Keep multiple backup versions
4. **Test Imports**: Verify backups work before you need them

### Best Practices

1. **Daily Review**: 5 minutes each morning to plan
2. **Weekly Review**: 30 minutes Sunday to reflect
3. **Consistent Completion**: Check tasks off same day
4. **Timer Usage**: Use for accurate time tracking
5. **Realistic Estimates**: Adjust task durations based on actual time

## FAQ

**Q: Can I sync across devices?**  
A: Not yet. Currently local storage only. Cloud sync planned for future.

**Q: Does it work offline?**  
A: Yes! All data stored locally, no internet required (except Google Calendar).

**Q: How do I uninstall?**  
A: 
- macOS: Delete app from Applications, remove `~/Library/Application Support/com.taskmanager.app`
- Windows: Control Panel → Uninstall, delete `%APPDATA%\com.taskmanager.app`
- Linux: Remove app and `~/.config/com.taskmanager.app`

**Q: Is my data private?**  
A: Yes. Everything stays on your device. No telemetry or cloud storage.

**Q: Can I customize colors/themes?**  
A: Currently dark mode only. Light mode and custom themes coming soon.

**Q: How do I report a bug?**  
A: [Create an issue](https://github.com/your-username/task-manager/issues) on GitHub.

---

**Need More Help?** Check out:
- [Installation Guide](INSTALLATION.md)
- [Development Guide](DEVELOPMENT.md)
- [GitHub Issues](https://github.com/your-username/task-manager/issues)
