import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Settings, X, Maximize2, Minimize2 } from 'lucide-react';
import { Waveform } from './Waveform';
import { AssistantState } from '@shared/types';

export const AssistantOrb: React.FC = () => {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const removeStateListener = window.api.onAssistantState((newState: AssistantState) => {
      setState(newState);
    });

    const removeTranscriptListener = window.api.onTranscript((text: string, isFinal: boolean) => {
      if (isFinal) {
        setTranscript(prev => prev + ' ' + text);
      } else {
        // Handle delta
      }
    });

    return () => {
      removeStateListener();
      removeTranscriptListener();
    };
  }, []);

  const toggleListening = () => {
    if (state === 'idle') {
      window.api.startListening();
    } else {
      window.api.stopListening();
    }
  };

  return (
    <div className="relative flex flex-col items-center">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-6 w-[400px] h-[300px] glass rounded-3xl p-6 overflow-hidden flex flex-col"
          >
            <div className="flex justify-between items-center mb-4">
              <span className="text-sm font-medium opacity-50 capitalize">{state}</span>
              <div className="flex gap-2">
                <Settings size={18} className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity" />
                <X size={18} className="opacity-50 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => setIsExpanded(false)} />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto text-lg leading-relaxed">
              {transcript || "How can I help you today?"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className={`relative group cursor-pointer`}
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <motion.div
          className={`w-24 h-24 rounded-full flex items-center justify-center relative overflow-hidden transition-colors ${
            state === 'listening' ? 'bg-primary/20' : state === 'thinking' ? 'bg-accent/20' : 'bg-white/10'
          } glass`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <div className="absolute inset-0 flex items-center justify-center">
             <Waveform
              isListening={state === 'listening'}
              isSpeaking={state === 'speaking'}
              isThinking={state === 'thinking'}
            />
          </div>

          <motion.div
            className="z-10 bg-white rounded-full p-3 shadow-xl"
            animate={{
              scale: state === 'listening' ? [1, 1.2, 1] : 1,
            }}
            transition={{ repeat: Infinity, duration: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleListening();
            }}
          >
            {state === 'listening' ? <Mic size={24} className="text-primary" /> : <MicOff size={24} className="text-gray-400" />}
          </motion.div>

          {/* Animated glow */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/50"
            animate={{
              scale: [1, 1.5],
              opacity: [0.5, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: "easeOut"
            }}
            style={{ display: state === 'listening' ? 'block' : 'none' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};
