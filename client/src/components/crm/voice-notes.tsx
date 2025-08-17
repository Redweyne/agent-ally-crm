import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause,
  Save,
  X,
  Volume2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceNotesProps {
  onSave: (note: string) => void;
  onCancel: () => void;
  initialText?: string;
  placeholder?: string;
}

export default function VoiceNotes({ 
  onSave, 
  onCancel, 
  initialText = "", 
  placeholder = "Tapez vos notes ici ou utilisez la dictée vocale..." 
}: VoiceNotesProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [isSupported, setIsSupported] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setIsSupported(true);
      
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'fr-FR'; // French language
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            setConfidence(confidence);
          } else {
            interimTranscript += transcript;
          }
        }
        
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript + ' ');
        }
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      } catch (error) {
        console.error('Error starting speech recognition:', error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
  };

  const handleSave = () => {
    onSave(transcript.trim());
    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  };

  const clearTranscript = () => {
    setTranscript("");
    setConfidence(0);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notes vocales</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {isSupported && (
          <div className="flex items-center gap-2">
            <Badge variant={isListening ? "default" : "secondary"} className="text-xs">
              {isListening ? "En écoute" : "Prêt"}
            </Badge>
            {confidence > 0 && (
              <Badge variant="outline" className="text-xs">
                Confiance: {Math.round(confidence * 100)}%
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        {isSupported && (
          <div className="flex justify-center gap-4">
            <Button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "h-16 w-16 rounded-full",
                isListening 
                  ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                  : "bg-blue-500 hover:bg-blue-600"
              )}
              size="lg"
            >
              {isListening ? (
                <Square className="w-6 h-6 text-white" />
              ) : (
                <Mic className="w-6 h-6 text-white" />
              )}
            </Button>
            
            {transcript && (
              <Button
                onClick={clearTranscript}
                variant="outline"
                size="lg"
                className="h-16 w-16 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>
            )}
          </div>
        )}

        {!isSupported && (
          <div className="text-center p-4 bg-yellow-50 rounded-lg border">
            <MicOff className="w-8 h-8 mx-auto text-yellow-600 mb-2" />
            <p className="text-sm text-yellow-800">
              La reconnaissance vocale n'est pas disponible sur ce navigateur.
            </p>
          </div>
        )}

        {/* Text Input */}
        <div className="space-y-2">
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="resize-none text-base"
          />
          
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <Volume2 className="w-4 h-4 animate-pulse" />
              <span>Parlez maintenant...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={handleSave}
            disabled={!transcript.trim()}
            className="flex-1"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder
          </Button>
          
          <Button 
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            Annuler
          </Button>
        </div>

        {/* Tips */}
        {isSupported && (
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Appuyez sur le micro pour commencer la dictée</p>
            <p>• Parlez clairement et faites des pauses</p>
            <p>• Vous pouvez modifier le texte manuellement après</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}