
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'tasks'>;

export const useOverdueTasks = () => {
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [currentOverdueTask, setCurrentOverdueTask] = useState<Task | null>(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);

  const fetchOverdueTasks = async () => {
    try {
      // Calculate tomorrow's date to check if task is overdue by at least one day
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('status', 'pending')
        .not('due_date', 'is', null)
        .lt('due_date', tomorrow.toISOString())
        .order('due_date', { ascending: true });

      if (error) throw error;

      const tasks = data || [];
      setOverdueTasks(tasks);

      // Show modal for the first overdue task if we have any
      if (tasks.length > 0 && !currentOverdueTask) {
        setCurrentOverdueTask(tasks[0]);
        setShowOverdueModal(true);
      }
    } catch (error) {
      console.error('Error fetching overdue tasks:', error);
    }
  };

  const handleTaskUpdated = () => {
    // Remove the current task from overdue list
    const remainingTasks = overdueTasks.filter(task => task.id !== currentOverdueTask?.id);
    setOverdueTasks(remainingTasks);
    
    // Show next overdue task if any
    if (remainingTasks.length > 0) {
      setCurrentOverdueTask(remainingTasks[0]);
      setShowOverdueModal(true);
    } else {
      setCurrentOverdueTask(null);
      setShowOverdueModal(false);
    }
  };

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Move to next overdue task or close completely
      const currentIndex = overdueTasks.findIndex(task => task.id === currentOverdueTask?.id);
      const nextTasks = overdueTasks.slice(currentIndex + 1);
      
      if (nextTasks.length > 0) {
        setCurrentOverdueTask(nextTasks[0]);
        setShowOverdueModal(true);
      } else {
        setCurrentOverdueTask(null);
        setShowOverdueModal(false);
      }
    }
  };

  useEffect(() => {
    fetchOverdueTasks();
    
    // Check for overdue tasks every 5 minutes
    const interval = setInterval(fetchOverdueTasks, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    overdueTasks,
    currentOverdueTask,
    showOverdueModal,
    handleTaskUpdated,
    handleModalClose,
    refreshOverdueTasks: fetchOverdueTasks
  };
};
