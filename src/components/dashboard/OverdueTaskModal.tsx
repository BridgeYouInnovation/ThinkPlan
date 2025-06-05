
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Task = Tables<'tasks'>;

interface OverdueTaskModalProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: () => void;
}

export const OverdueTaskModal = ({ task, open, onOpenChange, onTaskUpdated }: OverdueTaskModalProps) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleMarkCompleted = async () => {
    if (!task) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', task.id);

      if (error) throw error;

      toast({
        title: "Task completed!",
        description: "The task has been marked as completed and will be automatically deleted in 24 hours.",
      });

      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleKeepPending = () => {
    onOpenChange(false);
  };

  if (!task) return null;

  const overdueDays = task.due_date 
    ? Math.floor((new Date().getTime() - new Date(task.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <DialogTitle className="text-xl font-bold">Task Overdue</DialogTitle>
          <DialogDescription className="text-gray-600">
            This task has been overdue for {overdueDays} day{overdueDays > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        
        <div className="bg-gray-50 rounded-2xl p-4 my-4">
          <div className="flex items-start space-x-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
              {task.description && (
                <p className="text-gray-600 text-sm mt-1">{task.description}</p>
              )}
              <p className="text-orange-600 text-xs mt-2">
                Due: {new Date(task.due_date!).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleMarkCompleted}
            disabled={isUpdating}
            className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {isUpdating ? "Updating..." : "Yes, Mark as Completed"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleKeepPending}
            disabled={isUpdating}
            className="w-full rounded-2xl"
          >
            Keep as Pending
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-3">
          Completed tasks are automatically deleted after 24 hours
        </p>
      </DialogContent>
    </Dialog>
  );
};
