
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { AuthCard } from "@/components/auth/AuthCard";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Sparkles, Brain, Zap } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <div className="text-center animate-fade-in">
          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full bg-white/20 animate-ping"></div>
              <div className="relative w-16 h-16 rounded-full bg-white/30 backdrop-blur-sm flex items-center justify-center">
                <Brain className="w-8 h-8 text-white animate-pulse-gentle" />
              </div>
            </div>
          </div>
          <p className="text-white/90 text-lg font-medium">Loading your workspace...</p>
          <p className="text-white/70 text-sm mt-2">Preparing your ideas</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
        </div>
        
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left side - Hero content */}
            <div className="text-center lg:text-left animate-fade-in">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-white">ThinkPlan</h1>
              </div>
              
              <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
                Transform Ideas into
                <span className="block bg-gradient-to-r from-yellow-300 to-pink-300 bg-clip-text text-transparent">
                  Actionable Plans
                </span>
              </h2>
              
              <p className="text-xl text-white/80 mb-8 leading-relaxed">
                Your AI-powered productivity companion that breaks down complex ideas into manageable tasks, 
                analyzes messages, and keeps you organized with intelligent insights.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Brain className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white/90 font-medium">Smart Planning</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Zap className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white/90 font-medium">AI Insights</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Sparkles className="w-8 h-8 text-white mx-auto mb-2" />
                  <p className="text-white/90 font-medium">Effortless Flow</p>
                </div>
              </div>
            </div>
            
            {/* Right side - Auth card */}
            <div className="animate-slide-up">
              <AuthCard onAuthSuccess={() => {}} />
            </div>
          </div>
        </div>
        
        <Toaster />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard onLogout={handleLogout} />
      <Toaster />
    </div>
  );
};

export default Index;
