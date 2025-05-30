import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CheckSquare, MessageCircle, Lightbulb, TrendingUp, Calendar, Plus, Grid3X3, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyFeedProps {
  onLogout: () => void;
}

export const DailyFeed = ({ onLogout }: DailyFeedProps) => {
  const [stats, setStats] = useState({
    totalTasks: 55,
    completedTasks: 13,
    workingOnTasks: 25,
    pendingTasks: 17,
    flaggedMessages: 0,
    totalIdeas: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [tasksResult, messagesResult, ideasResult] = await Promise.all([
        supabase.from('tasks').select('status'),
        supabase.from('messages').select('is_flagged'),
        supabase.from('ideas').select('id')
      ]);

      if (tasksResult.error || messagesResult.error || ideasResult.error) {
        throw new Error('Failed to fetch stats');
      }

      const tasks = tasksResult.data || [];
      const messages = messagesResult.data || [];
      const ideas = ideasResult.data || [];

      setStats({
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'completed').length,
        workingOnTasks: tasks.filter(t => t.status === 'in_progress').length,
        pendingTasks: tasks.filter(t => t.status === 'pending').length,
        flaggedMessages: messages.filter(m => m.is_flagged).length,
        totalIdeas: ideas.length
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard stats",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-3xl h-32 mb-4"></div>
          <div className="bg-gray-200 rounded-2xl h-24 mb-4"></div>
          <div className="bg-gray-200 rounded-2xl h-24"></div>
        </div>
      </div>
    );
  }

  const StatCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
    <div className="flex items-center space-x-3 p-3">
      <div className={`w-10 h-10 rounded-2xl ${color} flex items-center justify-center`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="text-gray-900 font-semibold">{label}</p>
        <p className="text-gray-500 text-sm">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm">Track your productivity</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLogout}
          className="text-gray-600 hover:bg-gray-100 rounded-full w-10 h-10 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Chart */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
        <div className="relative w-32 h-32 mx-auto mb-6">
          {/* Donut Chart */}
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#10b981"
              strokeWidth="3"
              strokeDasharray={`${(stats.completedTasks / stats.totalTasks) * 100}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-gray-600">15%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-sm text-gray-600">13%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">28%</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="space-y-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <StatCard 
            icon={CheckSquare} 
            label="Total task" 
            value={stats.totalTasks} 
            color="bg-purple-500" 
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <StatCard 
            icon={CheckSquare} 
            label="Completed" 
            value={stats.completedTasks} 
            color="bg-green-500" 
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <StatCard 
            icon={TrendingUp} 
            label="Working on" 
            value={stats.workingOnTasks} 
            color="bg-blue-500" 
          />
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <StatCard 
            icon={Calendar} 
            label="Pending" 
            value={stats.pendingTasks} 
            color="bg-orange-500" 
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-3">
          <Button className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl h-12 justify-start">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
          <Button className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl h-12 justify-start">
            <Lightbulb className="h-4 w-4 mr-2" />
            New Idea
          </Button>
        </div>
      </div>
    </div>
  );
};
