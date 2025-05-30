
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Sparkles, Brain, Zap, Target, Users, TrendingUp } from "lucide-react";

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen = ({ onComplete }: OnboardingScreenProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      icon: Brain,
      title: "AI-Powered Planning",
      description: "Transform complex ideas into clear, actionable tasks with our intelligent AI assistant that understands your goals.",
      color: "from-purple-500 to-pink-500",
      bgColor: "bg-purple-50"
    },
    {
      icon: Zap,
      title: "Smart Task Management",
      description: "Organize your workflow with intelligent prioritization and automated scheduling that adapts to your productivity patterns.",
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50"
    },
    {
      icon: Target,
      title: "Goal Achievement",
      description: "Track progress with visual insights and milestone celebrations that keep you motivated and on track.",
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50"
    }
  ];

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const currentSlideData = slides[currentSlide];
  const IconComponent = currentSlideData.icon;

  return (
    <div className="min-h-screen flex items-center justify-center gradient-bg relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse-gentle"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-white/10 blur-3xl animate-pulse-gentle"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/5 blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">ThinkPlan</h1>
          <p className="text-white/80">Your AI productivity companion</p>
        </div>

        {/* Main content card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl mb-8 animate-scale-in">
          {/* Icon and visual */}
          <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${currentSlideData.color} mx-auto mb-6 flex items-center justify-center transform transition-all duration-500 hover:scale-110`}>
            <IconComponent className="w-12 h-12 text-white" />
          </div>

          {/* Content */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {currentSlideData.title}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {currentSlideData.description}
            </p>
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">Team Ready</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <TrendingUp className="w-6 h-6 text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">Analytics</p>
            </div>
            <div className="text-center p-3 rounded-xl bg-gray-50">
              <Zap className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <p className="text-xs text-gray-600 font-medium">Fast Setup</p>
            </div>
          </div>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {slides.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/30'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="text-white/70 hover:text-white hover:bg-white/10 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          <Button
            onClick={nextSlide}
            className="bg-white text-purple-600 hover:bg-white/90 font-semibold px-6 rounded-xl"
          >
            {currentSlide === slides.length - 1 ? (
              "Get Started"
            ) : (
              <>
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </>
            )}
          </Button>
        </div>

        {/* Skip option */}
        <div className="text-center mt-6">
          <button
            onClick={onComplete}
            className="text-white/60 hover:text-white/80 text-sm transition-colors"
          >
            Skip introduction
          </button>
        </div>
      </div>
    </div>
  );
};
