
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Mail } from "lucide-react";
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
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your daily feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{todaysTasks.length}</p>
                <p className="text-sm text-gray-600">Tasks due today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{upcomingTasks.length}</p>
                <p className="text-sm text-gray-600">Upcoming tasks</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Mail className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{flaggedMessages.length}</p>
                <p className="text-sm text-gray-600">Flagged messages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {todaysTasks.length > 0 ? (
              <>
                {todaysTasks.slice(0, 3).map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm">{task.title}</span>
                    <Badge variant="outline">Due Today</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  View All Tasks
                </Button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">No tasks due today! 🎉</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Message Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {flaggedMessages.length > 0 ? (
              <>
                {flaggedMessages.slice(0, 3).map((message) => (
                  <div key={message.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm truncate">
                      {message.content.substring(0, 40)}...
                    </span>
                    <Badge variant="secondary">Needs Reply</Badge>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  View All Messages
                </Button>
              </>
            ) : (
              <p className="text-gray-500 text-center py-4">No pending messages</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-lg mb-1">💡</span>
              <span>Capture New Idea</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-lg mb-1">📧</span>
              <span>Analyze Message</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <span className="text-lg mb-1">✅</span>
              <span>Complete Task</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
