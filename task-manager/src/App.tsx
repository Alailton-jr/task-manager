import { useEffect } from 'react';
import { useStore } from './store';
import { Layout } from './components/layout/Layout';
import { TasksPage } from './features/tasks/TasksPage';
import { RemindersPage } from './features/reminders/RemindersPage';
import { CalendarPage } from './features/calendar/CalendarPage';
import { RoutinePage } from './features/routine/RoutinePage';
import { SettingsPage } from './features/settings/SettingsPage';
import { AnalyticsPage } from './features/analytics/AnalyticsPage';
import { notificationService } from './services/notifications';

function App() {
  const { currentTab, init, isLoading, settings } = useStore();

  useEffect(() => {
    // Initialize store and notification service
    const initialize = async () => {
      try {
        await init();
        await notificationService.init();
      } catch (error) {
        console.error('Initialization error:', error);
        // Continue even if notification init fails
      }
    };

    initialize();
  }, [init]);

  // Update notification sound settings when they change
  useEffect(() => {
    if (settings.notifications?.sound) {
      notificationService.setSoundSettings(settings.notifications.sound);
    }
  }, [settings.notifications?.sound]);

  // Disable browser's default right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentTab) {
      case 'tasks':
        return <TasksPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'calendar':
        return <CalendarPage />;
      case 'routine':
        return <RoutinePage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <TasksPage />;
    }
  };

  return (
    <Layout>
      {renderPage()}
    </Layout>
  );
}

export default App;
