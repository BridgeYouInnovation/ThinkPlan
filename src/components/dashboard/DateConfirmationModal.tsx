
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, X } from "lucide-react";

interface DateConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (dateInput: string) => void;
  pendingTasks: any[];
  isLoading?: boolean;
}

export const DateConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  pendingTasks,
  isLoading = false 
}: DateConfirmationModalProps) => {
  const [dateInput, setDateInput] = useState("");

  const handleConfirm = () => {
    if (!dateInput.trim()) return;
    onConfirm(dateInput.trim());
  };

  if (!isOpen) return null;

  const tasksWithQuestions = pendingTasks.filter(task => task.needs_user_input);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">📅 When would you like to do these?</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div className="bg-blue-50 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Tasks needing timing:</span>
            </div>
            <div className="space-y-3">
              {tasksWithQuestions.map((task, index) => (
                <div key={index} className="bg-white rounded-xl p-3">
                  <h4 className="font-medium text-gray-900 text-sm">{task.title}</h4>
                  {task.timeline_question && (
                    <p className="text-blue-700 text-sm mt-1">{task.timeline_question}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Tell me when you'd like to work on these:
            </label>
            <Textarea
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
              placeholder="For example: 'Tomorrow morning', 'Next week', 'This Friday', 'Start today, finish by weekend', etc."
              rows={4}
              className="rounded-2xl resize-none"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-2xl"
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!dateInput.trim() || isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                <span>Setting dates...</span>
              </div>
            ) : (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Set Dates
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
