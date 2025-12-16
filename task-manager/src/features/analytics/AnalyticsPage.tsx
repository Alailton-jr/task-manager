import React, { useMemo } from 'react';
import { useStore } from '../../store';
import { TimeUtils } from '../../services/time';
import { BarChart3, CheckCircle2, Clock, TrendingUp, Target, Award, Calendar, Zap } from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const { tasks, pomodoroSessions } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = TimeUtils.getTodayDateString();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    // Task completion stats
    const totalTasks = tasks.filter(t => t.active).length;
    const completedToday = tasks.filter(t => t.completionByDate[todayStr]?.completed).length;
    
    const completionsByDay = last7Days.map(date => ({
      date,
      completed: tasks.filter(t => t.completionByDate[date]?.completed).length,
    }));

    const weeklyCompletionRate = completionsByDay.reduce((sum, day) => sum + day.completed, 0) / 7;
    
    const monthlyCompletions = last30Days.reduce((sum, date) => {
      return sum + tasks.filter(t => t.completionByDate[date]?.completed).length;
    }, 0);

    // Pomodoro stats
    const pomodoroLast7Days = pomodoroSessions.filter(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return last7Days.includes(sessionDate);
    });

    const totalPomodoroSessions = pomodoroLast7Days.length;
    const completedPomodoros = pomodoroLast7Days.filter(s => !s.interrupted).length;
    const totalFocusMinutes = pomodoroLast7Days
      .filter(s => s.type === 'work' && !s.interrupted)
      .reduce((sum, s) => sum + Math.floor((new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 60000), 0);

    // Task breakdown by category
    const categoryBreakdown = tasks
      .filter(t => t.active)
      .reduce((acc, task) => {
        const category = task.category || 'other';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    // Most productive day (by completions)
    const dayCompletions = last7Days.map(date => {
      const completions = tasks.filter(t => t.completionByDate[date]?.completed).length;
      return { date, completions, dayName: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }) };
    });
    const mostProductiveDay = dayCompletions.reduce((max, day) => 
      day.completions > max.completions ? day : max
    , dayCompletions[0]);

    // Average task duration (estimated vs actual)
    const tasksWithTime = tasks.filter(t => t.estimatedDurationMinutes);
    const avgEstimatedDuration = tasksWithTime.length > 0
      ? tasksWithTime.reduce((sum, t) => sum + (t.estimatedDurationMinutes || 0), 0) / tasksWithTime.length
      : 0;

    return {
      totalTasks,
      completedToday,
      weeklyCompletionRate: Math.round(weeklyCompletionRate * 10) / 10,
      monthlyCompletions,
      totalPomodoroSessions,
      completedPomodoros,
      totalFocusMinutes,
      categoryBreakdown,
      completionsByDay,
      mostProductiveDay,
      avgEstimatedDuration: Math.round(avgEstimatedDuration),
    };
  }, [tasks, pomodoroSessions]);

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      work: 'bg-blue-500',
      personal: 'bg-green-500',
      shopping: 'bg-yellow-500',
      health: 'bg-red-500',
      home: 'bg-purple-500',
      finance: 'bg-orange-500',
      other: 'bg-zinc-500',
    };
    return colors[category] || colors.other;
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-zinc-400">Track your productivity and performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Today's Completions */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs text-zinc-400">Today</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.completedToday}</div>
            <div className="text-sm text-zinc-400">Tasks Completed</div>
          </div>

          {/* Weekly Average */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-xs text-zinc-400">7 Days</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.weeklyCompletionRate}</div>
            <div className="text-sm text-zinc-400">Avg Tasks/Day</div>
          </div>

          {/* Total Focus Time */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs text-zinc-400">7 Days</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{Math.floor(stats.totalFocusMinutes / 60)}h {stats.totalFocusMinutes % 60}m</div>
            <div className="text-sm text-zinc-400">Focus Time</div>
          </div>

          {/* Pomodoro Sessions */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-orange-400" />
              </div>
              <span className="text-xs text-zinc-400">7 Days</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.completedPomodoros}</div>
            <div className="text-sm text-zinc-400">Pomodoro Sessions</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Completion Trend */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Completion Trend</h2>
            </div>
            
            <div className="space-y-3">
              {stats.completionsByDay.map((day) => {
                const maxCompletions = Math.max(...stats.completionsByDay.map(d => d.completed), 1);
                const percentage = (day.completed / maxCompletions) * 100;
                const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
                
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{dayName}</span>
                      <span className="text-white font-medium">{day.completed} tasks</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Tasks by Category</h2>
            </div>

            {Object.keys(stats.categoryBreakdown).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(stats.categoryBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => {
                    const total = Object.values(stats.categoryBreakdown).reduce((sum, c) => sum + c, 0);
                    const percentage = Math.round((count / total) * 100);
                    
                    return (
                      <div key={category} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="capitalize text-zinc-300">{category}</span>
                          <span className="text-white font-medium">{count} tasks ({percentage}%)</span>
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: Math.ceil(percentage / 10) }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-2 flex-1 rounded-full ${getCategoryColor(category)}`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="text-center py-8 text-zinc-400">
                No tasks yet. Start adding tasks to see category breakdown.
              </div>
            )}
          </div>

          {/* Productivity Insights */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Award className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Insights</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-zinc-700/30 rounded-lg border border-zinc-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-4 h-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Most Productive Day</div>
                    <div className="text-xs text-zinc-400">
                      {stats.mostProductiveDay.dayName} with {stats.mostProductiveDay.completions} completions
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-700/30 rounded-lg border border-zinc-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Focus Success Rate</div>
                    <div className="text-xs text-zinc-400">
                      {stats.totalPomodoroSessions > 0 
                        ? `${Math.round((stats.completedPomodoros / stats.totalPomodoroSessions) * 100)}% of Pomodoro sessions completed`
                        : 'Start a Pomodoro session to track focus time'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-700/30 rounded-lg border border-zinc-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Average Task Duration</div>
                    <div className="text-xs text-zinc-400">
                      {stats.avgEstimatedDuration > 0 
                        ? `${stats.avgEstimatedDuration} minutes per task (estimated)`
                        : 'Add estimated durations to tasks for insights'}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-700/30 rounded-lg border border-zinc-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-1">Monthly Progress</div>
                    <div className="text-xs text-zinc-400">
                      {stats.monthlyCompletions} tasks completed in the last 30 days
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Tasks Overview */}
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">Active Tasks</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-zinc-700/30 rounded-lg">
                <div className="text-3xl font-bold text-white mb-1">{stats.totalTasks}</div>
                <div className="text-xs text-zinc-400">Total Active</div>
              </div>
              
              <div className="text-center p-4 bg-zinc-700/30 rounded-lg">
                <div className="text-3xl font-bold text-white mb-1">
                  {stats.totalTasks > 0 
                    ? Math.round((stats.completedToday / stats.totalTasks) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-zinc-400">Completed Today</div>
              </div>

              <div className="text-center p-4 bg-zinc-700/30 rounded-lg">
                <div className="text-3xl font-bold text-white mb-1">
                  {tasks.filter(t => t.active && t.isRepeatable).length}
                </div>
                <div className="text-xs text-zinc-400">Repeatable</div>
              </div>

              <div className="text-center p-4 bg-zinc-700/30 rounded-lg">
                <div className="text-3xl font-bold text-white mb-1">
                  {tasks.filter(t => t.active && !t.isRepeatable).length}
                </div>
                <div className="text-xs text-zinc-400">One-Time</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
