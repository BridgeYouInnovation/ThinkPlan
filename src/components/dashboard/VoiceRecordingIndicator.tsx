
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VoiceRecordingIndicatorProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStop: () => void;
}

export const VoiceRecordingIndicator = ({ 
  isRecording, 
  isProcessing, 
  onStop 
}: VoiceRecordingIndicatorProps) => {
  if (!isRecording && !isProcessing) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-fade-in">
      <div className="bg-white rounded-3xl p-8 mx-4 max-w-sm w-full shadow-2xl">
        <div className="text-center space-y-6">
          {/* Recording Animation */}
          <div className="relative">
            <div className={`w-24 h-24 mx-auto rounded-full flex items-center justify-center transition-all duration-300 ${
              isRecording 
                ? 'bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/30' 
                : 'bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30'
            }`}>
              {/* Glowing ripple effects for recording */}
              {isRecording && (
                <>
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 animate-ping opacity-30"></div>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-r from-purple-300 to-blue-300 animate-ping opacity-20 animation-delay-300"></div>
                  <div className="absolute inset-4 rounded-full bg-gradient-to-r from-purple-200 to-blue-200 animate-ping opacity-10 animation-delay-600"></div>
                </>
              )}
              
              {isProcessing ? (
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Mic className="w-10 h-10 text-white relative z-10 drop-shadow-lg" />
              )}
            </div>
            
            {/* Floating sound waves animation */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex space-x-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-gradient-to-t from-purple-400 to-blue-400 rounded-full animate-pulse opacity-70"
                      style={{
                        height: `${Math.random() * 16 + 8}px`,
                        animationDelay: `${i * 0.15}s`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Text */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isProcessing ? 'Processing...' : 'Listening'}
            </h3>
            <p className="text-gray-600 text-sm">
              {isProcessing 
                ? 'Converting your speech to text...' 
                : 'Speak clearly and tap Done when finished'
              }
            </p>
          </div>

          {/* Action Button */}
          {isRecording && (
            <Button
              onClick={onStop}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-2xl font-medium shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
            >
              <Square className="w-5 h-5 mr-2" />
              Done Recording
            </Button>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <div className="text-center">
              <div className="inline-flex items-center space-x-2 text-purple-600">
                <div className="w-4 h-4 border-2 border-purple-600/30 border-t-purple-600 rounded-full animate-spin"></div>
                <span className="text-sm font-medium">Processing audio...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
