
import { useState, useRef } from 'react';
import { VoiceRecorder, convertBlobToBase64 } from '@/utils/VoiceRecorder';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recorderRef = useRef<VoiceRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      if (!recorderRef.current) {
        recorderRef.current = new VoiceRecorder();
      }
      
      await recorderRef.current.startRecording();
      setIsRecording(true);
      
      toast({
        title: "🎤 Recording started",
        description: "Speak your idea clearly...",
      });
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access microphone. Please check permissions.",
      });
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recorderRef.current || !isRecording) {
      return null;
    }

    try {
      setIsRecording(false);
      setIsProcessing(true);
      
      toast({
        title: "🔄 Processing...",
        description: "Converting speech to text...",
      });

      const audioBlob = await recorderRef.current.stopRecording();
      const base64Audio = await convertBlobToBase64(audioBlob);

      // Send to Supabase Edge Function for transcription
      const { data, error } = await supabase.functions.invoke('voice-to-text', {
        body: { audio: base64Audio }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Transcription failed');
      }

      toast({
        title: "✨ Speech converted!",
        description: "Your voice has been converted to text.",
      });

      return data.text;
    } catch (error) {
      console.error('Error processing recording:', error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Failed to convert speech to text. Please try again.",
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
  };
};
