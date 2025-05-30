
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Mail, TrendingUp, Target, Zap, ArrowRight, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'tasks'>;
type Message = Tables<'messages'>;

export const DailyFeed = () => {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [flaggedMessages, setFlaggedMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch tasks
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .neq('status', 'completed')
        .order('due_date', { ascending: true });

      if (tasksError) throw tasksError;

      // Categorize tasks
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const todayTasks = (tasks || []).filter(task => {
        if (!task.due_date) return false;
        return new Date(task.due_date) <= today;
      });

      const upcomingTasksFiltered = (tasks || []).filter(task => {
        if (!task.due_date) return true; // Tasks without due date go to upcoming
        return new Date(task.due_date) > today;
      });

      setTodaysTasks(todayTasks);
      setUpcomingTasks(upcomingTasksFiltered);

      // Fetch flagged messages
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('is_flagged', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;
      
      setFlaggedMessages(messages || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
          </div>
          <p className="text-xl font-medium text-gray-700">Loading your daily insights...</p>
          <p className="text-gray-500 mt-2">Preparing your personalized workspace</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Welcome header */}
      <div className="text-center space-y-4 animate-fade-in">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Good morning! Ready to make progress?
        </h2>
        <p className="text-gray-600 text-lg">Here's your productivity overview for today</p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 animate-slide-up">
        <Card className="card-hover bg-gradient-to-r from-green-500 to-emerald-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{todaysTasks.length}</p>
                <p className="text-green-100 font-medium">Due Today</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-r from-blue-500 to-cyan-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{upcomingTasks.length}</p>
                <p className="text-blue-100 font-medium">Upcoming</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-r from-purple-500 to-pink-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">{flaggedMessages.length}</p>
                <p className="text-purple-100 font-medium">Need Reply</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-r from-orange-500 to-red-600 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold">94%</p>
                <p className="text-orange-100 font-medium">Productivity</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Today's Focus */}
        <Card className="card-hover border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span>Today's Focus</span>
              <Badge variant="secondary" className="ml-auto">{todaysTasks.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todaysTasks.length > 0 ? (
              <>
                {todaysTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 group-hover:text-green-600 transition-colors">{task.title}</p>
                        <p className="text-sm text-gray-500">Due today</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 h-12 rounded-2xl border-2 hover:border-green-300 hover:bg-green-50 transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  View All Tasks
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-gray-800 mb-2">All caught up! 🎉</p>
                <p className="text-gray-500">No tasks due today. Great job!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Message Intelligence */}
        <Card className="card-hover border-0 shadow-xl bg-white/80 backdrop-blur-sm animate-slide-up">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-3 text-xl">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span>Message Follow-ups</span>
              <Badge variant="secondary" className="ml-auto">{flaggedMessages.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {flaggedMessages.length > 0 ? (
              <>
                {flaggedMessages.slice(0, 4).map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-2xl hover:bg-purple-100 transition-all duration-200 group">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                        <Mail className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 group-hover:text-purple-600 transition-colors truncate">
                          {message.content.substring(0, 40)}...
                        </p>
                        <p className="text-sm text-purple-600">AI reply ready</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-purple-500 transition-colors" />
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4 h-12 rounded-2xl border-2 hover:border-purple-300 hover:bg-purple-50 transition-all duration-200">
                  <Plus className="w-4 h-4 mr-2" />
                  View All Messages
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <p className="text-lg font-medium text-gray-800 mb-2">Inbox zero! 📬</p>
                <p className="text-gray-500">No pending messages to review</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-0 shadow-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 animate-fade-in">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl">
            <Zap className="w-6 h-6 text-purple-600" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl border-2 hover:border-purple-300 group">
              <div className="text-2xl group-hover:animate-bounce-gentle">💡</div>
              <span className="font-medium">Capture New Idea</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl border-2 hover:border-blue-300 group">
              <div className="text-2xl group-hover:animate-bounce-gentle">📧</div>
              <span className="font-medium">Analyze Message</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2 bg-white/60 hover:bg-white hover:shadow-lg transition-all duration-300 rounded-2xl border-2 hover:border-green-300 group">
              <div className="text-2xl group-hover:animate-bounce-gentle">✅</div>
              <span className="font-medium">Complete Task</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
