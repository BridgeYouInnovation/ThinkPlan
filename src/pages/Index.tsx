
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { OnboardingScreen } from "@/components/auth/OnboardingScreen";
import { LoginScreen } from "@/components/auth/LoginScreen";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { Brain } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

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

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setShowLogin(true);
  };

  const handleBackToOnboarding = () => {
    setShowLogin(false);
    setShowOnboarding(true);
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
    if (showOnboarding) {
      return (
        <>
          <OnboardingScreen onComplete={handleOnboardingComplete} />
          <Toaster />
        </>
      );
    }

    if (showLogin) {
      return (
        <>
          <LoginScreen onBack={handleBackToOnboarding} />
          <Toaster />
        </>
      );
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Dashboard onLogout={handleLogout} />
      <Toaster />
    </div>
  );
};

export default Index;
