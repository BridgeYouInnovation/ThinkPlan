
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'tasks'>;

export const TaskList = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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
      today.setHours(23, 59, 59, 999); // End of today
      
      if (dueDate <= today) return 'today';
    }
    
    return 'upcoming';
  };

  const filterTasks = (category: string) => {
    return tasks.filter(task => getTaskCategory(task) === category);
  };

  const TaskItem = ({ task }: { task: Task }) => (
    <div className="flex items-center space-x-3 p-3 border rounded-lg">
      <Checkbox
        checked={task.status === "completed"}
        onCheckedChange={() => toggleTask(task.id, task.status)}
      />
      <div className="flex-1">
        <p className={`${task.status === "completed" ? "line-through text-gray-500" : ""}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-600">{task.description}</p>
        )}
        {task.due_date && (
          <p className="text-sm text-gray-600">
            Due: {new Date(task.due_date).toLocaleDateString()}
          </p>
        )}
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => deleteTask(task.id)}>
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading tasks...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">
              Today ({filterTasks("today").length})
            </TabsTrigger>
            <TabsTrigger value="upcoming">
              Upcoming ({filterTasks("upcoming").length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed ({filterTasks("completed").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="space-y-3">
            {filterTasks("today").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
            {filterTasks("today").length === 0 && (
              <p className="text-gray-500 text-center py-8">No tasks for today</p>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-3">
            {filterTasks("upcoming").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
            {filterTasks("upcoming").length === 0 && (
              <p className="text-gray-500 text-center py-8">No upcoming tasks</p>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-3">
            {filterTasks("completed").map(task => (
              <TaskItem key={task.id} task={task} />
            ))}
            {filterTasks("completed").length === 0 && (
              <p className="text-gray-500 text-center py-8">No completed tasks</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
