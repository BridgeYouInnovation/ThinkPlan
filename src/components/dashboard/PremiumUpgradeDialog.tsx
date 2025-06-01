
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check } from "lucide-react";

interface PremiumUpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PremiumUpgradeDialog = ({ open, onOpenChange }: PremiumUpgradeDialogProps) => {
  const handleUpgrade = () => {
    // TODO: Implement actual upgrade flow
    console.log("Upgrade to premium clicked");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">Upgrade to Premium</DialogTitle>
          <DialogDescription className="text-gray-600">
            Connect your accounts and unlock powerful automation features
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-6">
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Gmail integration & AI analysis</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Calendar sync & scheduling</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Automated task creation</span>
          </div>
          <div className="flex items-center space-x-3">
            <Check className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">Priority support</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            Upgrade to Premium - $9.99/month
          </Button>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
