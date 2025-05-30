
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, Edit, Plus, Calendar, Clock, Users, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'tasks'>;

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { toast } = useToast();

  const today = new Date();
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const currentWeek = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(today.getDate() - today.getDay() + i);
    return date;
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load tasks",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('tasks')
        .insert({
          title: newTaskTitle.trim(),
          user_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      setNewTaskTitle("");
      setShowAddTask(false);
      fetchTasks();
      
      toast({
        title: "Task created!",
        description: "Your new task has been added",
      });
    } catch (error) {
      console.error('Error creating task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create task",
      });
    }
  };

  const toggleTask = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTasks(tasks.map(task => 
        task.id === id 
          ? { ...task, status: newStatus as any }
          : task
      ));

      toast({
        title: "Task updated",
        description: `Task marked as ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task",
      });
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setTasks(tasks.filter(task => task.id !== id));
      toast({
        title: "Task deleted",
        description: "Task has been removed",
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task",
      });
    }
  };

  const getTaskCategory = (task: Task) => {
    if (task.status === 'completed') return 'completed';
    
    if (task.due_date) {
      const dueDate = new Date(task.due_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (dueDate <= today) return 'today';
    }
    
    return 'upcoming';
  };

  const filterTasks = (category: string) => {
    return tasks.filter(task => getTaskCategory(task) === category);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Completed</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Running</Badge>;
      default:
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">Pending</Badge>;
    }
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group">
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          {getStatusBadge(task.status)}
          <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="sm" className="text-gray-400 hover:text-blue-500 w-8 h-8 p-0">
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)} className="text-gray-400 hover:text-red-500 w-8 h-8 p-0">
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-1 h-16 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full flex-shrink-0 mt-1"></div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg leading-tight">
                {task.title}
              </h3>
              {task.description && (
                <p className="text-gray-500 text-sm mt-1">{task.description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-gray-50">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {task.due_date && (
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{new Date(task.due_date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Personal</span>
              </div>
            </div>
            
            <Checkbox
              checked={task.status === "completed"}
              onCheckedChange={() => toggleTask(task.id, task.status)}
              className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const EmptyState = ({ category }: { category: string }) => {
    if (category === "today") {
      return (
        <div className="text-center py-16">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center">
              <Sparkles className="h-12 w-12 text-purple-500 animate-pulse" />
            </div>
            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">🎉</div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">You're all caught up!</h3>
          <p className="text-gray-500 mb-6">No tasks for today. Time to create something amazing!</p>
          <Button 
            onClick={() => setShowAddTask(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl px-6 py-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            Capture a new idea
          </Button>
        </div>
      );
    }

    const emptyMessages = {
      upcoming: { icon: Clock, title: "No upcoming tasks", subtitle: "You're all set for the future" },
      completed: { icon: Calendar, title: "No completed tasks", subtitle: "Complete some tasks to see them here" }
    };

    const { icon: Icon, title, subtitle } = emptyMessages[category] || emptyMessages.upcoming;

    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">{title}</p>
        <p className="text-gray-400 text-sm">{subtitle}</p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <h1 className="text-2xl font-bold">Today</h1>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-2xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
        
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-purple-700 to-blue-600 rounded-3xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-purple-100 text-sm">{today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <h1 className="text-2xl font-bold">Today</h1>
          </div>
          <Button 
            onClick={() => setShowAddTask(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white border-0 rounded-2xl shadow-lg"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </div>
        
        {/* Calendar Week */}
        <div className="grid grid-cols-7 gap-2 text-center">
          {currentWeek.map((date, index) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <div key={index} className="text-center">
                <p className="text-purple-200 text-xs mb-1">{weekDays[date.getDay()]}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all duration-300 ${
                  isToday 
                    ? 'bg-gradient-to-br from-white to-purple-50 text-purple-600 font-semibold shadow-lg ring-2 ring-white/30 animate-pulse' 
                    : 'text-white hover:bg-white/20'
                }`}>
                  {date.getDate()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Add New Task</h3>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="w-full border border-gray-200 rounded-2xl p-3 mb-4 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              autoFocus
            />
            <div className="flex space-x-3">
              <Button
                onClick={() => setShowAddTask(false)}
                variant="outline"
                className="flex-1 rounded-2xl"
              >
                Cancel
              </Button>
              <Button
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
                className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl"
              >
                Add Task
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Section */}
      <div className="space-y-4">
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 bg-gray-100 rounded-2xl">
            <TabsTrigger value="today" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Today ({filterTasks("today").length})
            </TabsTrigger>
            <TabsTrigger value="upcoming" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Upcoming ({filterTasks("upcoming").length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Done ({filterTasks("completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-4">
            {filterTasks("today").length > 0 ? (
              filterTasks("today").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            ) : (
              <EmptyState category="today" />
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {filterTasks("upcoming").length > 0 ? (
              filterTasks("upcoming").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            ) : (
              <EmptyState category="upcoming" />
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {filterTasks("completed").length > 0 ? (
              filterTasks("completed").map(task => (
                <TaskItem key={task.id} task={task} />
              ))
            ) : (
              <EmptyState category="completed" />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
