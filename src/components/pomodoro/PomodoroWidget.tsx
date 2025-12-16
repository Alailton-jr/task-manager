import React, { useState, useEffect } from 'react';
import { Play, SkipForward, X, Coffee, Briefcase } from 'lucide-react';
import { useStore } from '../../store';

const PomodoroWidget: React.FC = () => {
  const {
    activePomodoroSession,
    pomodoroTimer,
    settings,
    tasks,
    startPomodoroSession,
    completePomodoroSession,
    interruptPomodoroSession,
    updatePomodoroTimer,
  } = useStore();

  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');

  const pomodoroSettings = settings.pomodoro || {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    sessionsUntilLongBreak: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    autoStartWork: false,
  };

  useEffect(() => {
    if (!activePomodoroSession) return;

    const interval = setInterval(() => {
      const newTimer = pomodoroTimer - 1;
      
      if (newTimer <= 0) {
        // Session complete
        completePomodoroSession();
        // Auto-start next session if enabled
        if (pomodoroSettings.autoStartBreaks || pomodoroSettings.autoStartPomodoros) {
          const nextType = activePomodoroSession.type === 'work' 
            ? (activePomodoroSession.sessionNumber % 4 === 0 ? 'longBreak' : 'shortBreak')
            : 'work';
          
          if (
            (nextType === 'work' && pomodoroSettings.autoStartPomodoros) ||
            (nextType !== 'work' && pomodoroSettings.autoStartBreaks)
          ) {
            startPomodoroSession(nextType, selectedTaskId || undefined);
          }
        }
      } else {
        updatePomodoroTimer(newTimer);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activePomodoroSession, pomodoroTimer, selectedTaskId, pomodoroSettings]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionDuration = (type: 'work' | 'shortBreak' | 'longBreak'): number => {
    switch (type) {
      case 'work':
        return pomodoroSettings.workDuration * 60;
      case 'shortBreak':
        return pomodoroSettings.shortBreakDuration * 60;
      case 'longBreak':
        return pomodoroSettings.longBreakDuration * 60;
    }
  };

  const handleStart = (type: 'work' | 'shortBreak' | 'longBreak') => {
    startPomodoroSession(type, selectedTaskId || undefined);
  };

  const handleSkip = () => {
    if (!activePomodoroSession) return;
    completePomodoroSession();
  };

  const handleStop = () => {
    if (!activePomodoroSession) return;
    if (confirm('Are you sure you want to stop the current session?')) {
      interruptPomodoroSession();
    }
  };

  const getProgress = (): number => {
    if (!activePomodoroSession) return 0;
    const total = getSessionDuration(activePomodoroSession.type);
    return ((total - pomodoroTimer) / total) * 100;
  };

  const activeTasks = tasks.filter(t => t.active && !t.completionByDate[new Date().toISOString().split('T')[0]]?.completed);

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-lg shadow-cyan-500/30 flex items-center justify-center text-white hover:shadow-xl hover:shadow-cyan-500/40 transition-all duration-300"
        >
          {activePomodoroSession ? (
            <span className="font-mono font-bold text-sm">
              {formatTime(pomodoroTimer)}
            </span>
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activePomodoroSession?.type === 'work' ? (
              <Briefcase className="w-5 h-5 text-white" />
            ) : (
              <Coffee className="w-5 h-5 text-white" />
            )}
            <span className="font-semibold text-white">
              {activePomodoroSession
                ? activePomodoroSession.type === 'work'
                  ? 'Focus Time'
                  : activePomodoroSession.type === 'shortBreak'
                  ? 'Short Break'
                  : 'Long Break'
                : 'Pomodoro Timer'}
            </span>
          </div>
          <button
            onClick={() => setIsMinimized(true)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Timer Display */}
        <div className="p-6">
          {activePomodoroSession ? (
            <>
              {/* Progress Ring */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    className="stroke-zinc-800"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    className="stroke-cyan-500"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 88}`}
                    strokeDashoffset={`${2 * Math.PI * 88 * (1 - getProgress() / 100)}`}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-5xl font-mono font-bold text-white">
                      {formatTime(pomodoroTimer)}
                    </div>
                    <div className="text-sm text-zinc-400 mt-2">
                      Session {activePomodoroSession.sessionNumber}
                    </div>
                  </div>
                </div>
              </div>

              {/* Linked Task */}
              {activePomodoroSession.taskId && (
                <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
                  <div className="text-xs text-zinc-400 mb-1">Working on:</div>
                  <div className="text-sm font-medium text-white">
                    {tasks.find(t => t.id === activePomodoroSession.taskId)?.title || 'Unknown Task'}
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={handleStop}
                  className="flex-1 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Stop
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <SkipForward className="w-4 h-4" />
                  Skip
                </button>
              </div>

              {/* Session Info */}
              <div className="mt-4 text-center text-xs text-zinc-400">
                {activePomodoroSession.sessionNumber % 4 === 0 
                  ? 'Long break after this session'
                  : `${4 - (activePomodoroSession.sessionNumber % 4)} session(s) until long break`}
              </div>
            </>
          ) : (
            <>
              {/* Start Options */}
              <div className="space-y-3 mb-4">
                <select
                  value={selectedTaskId}
                  onChange={(e) => setSelectedTaskId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">No task linked</option>
                  {activeTasks.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-center mb-6">
                <div className="text-6xl font-mono font-bold text-white mb-2">
                  {formatTime(getSessionDuration('work'))}
                </div>
                <div className="text-sm text-zinc-400">
                  Ready to start a focus session
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => handleStart('work')}
                  className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
                >
                  <Play className="w-4 h-4" />
                  Start Focus Session
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleStart('shortBreak')}
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Short Break ({pomodoroSettings.shortBreakDuration}m)
                  </button>
                  <button
                    onClick={() => handleStart('longBreak')}
                    className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                  >
                    Long Break ({pomodoroSettings.longBreakDuration}m)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PomodoroWidget;
