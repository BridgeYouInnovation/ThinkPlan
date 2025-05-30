
import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthCard } from "@/components/auth/AuthCard";
import { Dashboard } from "@/components/dashboard/Dashboard";

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <AuthCard onAuthSuccess={() => setIsAuthenticated(true)} />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard onLogout={() => setIsAuthenticated(false)} />
      <Toaster />
    </div>
  );
};

export default Index;
