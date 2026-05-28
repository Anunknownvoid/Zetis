import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Settings, X, Cpu, Globe } from 'lucide-react';
import { Waveform } from './Waveform';
import { AssistantState } from '@shared/types';

export const AssistantOrb: React.FC = () => {
  const [state, setState] = useState<AssistantState>('idle');
  const [transcript, setTranscript] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [provider, setProvider] = useState<'openai-realtime' | 'ollama'>('openai-realtime');

  useEffect(() => {
    const unsubState = window.api.onAssistantState((newState: AssistantState) => {
      setState(newState);
    });

    const unsubTranscript = window.api.onTranscript((text: string, isFinal: boolean) => {
      if (isFinal) {
        // Clear or finalize
      } else {
        setTranscript(prev => prev + text);
      }
    });

    const unsubResponse = window.api.onAssistantResponse((text: string) => {
       setTranscript(prev => prev + text);
    });

    return () => {
      unsubState();
      unsubTranscript();
      unsubResponse();
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (state === 'idle' || state === 'error') {
      window.api.startListening();
    } else {
      window.api.stopListening();
    }
  }, [state]);

  const toggleProvider = useCallback((newProvider: 'openai-realtime' | 'ollama') => {
    setProvider(newProvider);
    // In a real app, this would send an IPC to change the provider in AssistantManager
  }, []);

  return (
    <div className="relative flex flex-col items-center select-none">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="mb-8 w-[400px] h-[300px] glass rounded-[2.5rem] p-8 overflow-hidden flex flex-col shadow-2xl border border-white/20"
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  state === 'listening' ? 'bg-green-400 shadow-[0_0_10px_rgba(74,222,128,0.5)]' :
                  state === 'thinking' ? 'bg-blue-400 animate-pulse' :
                  state === 'speaking' ? 'bg-purple-400' : 'bg-white/20'
                }`} />
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase opacity-40">{state}</span>
              </div>
              <div className="flex gap-4 items-center">
                <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                   <button
                    onClick={() => toggleProvider('openai-realtime')}
                    className={`p-1.5 rounded-full transition-all ${provider === 'openai-realtime' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
                   >
                     <Globe size={14} />
                   </button>
                   <button
                    onClick={() => toggleProvider('ollama')}
                    className={`p-1.5 rounded-full transition-all ${provider === 'ollama' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
                   >
                     <Cpu size={14} />
                   </button>
                </div>
                <X size={18} className="opacity-30 hover:opacity-100 cursor-pointer transition-opacity" onClick={() => setIsExpanded(false)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
               <p className="text-xl font-light leading-relaxed text-white/90">
                 {transcript || (state === 'listening' ? "I'm listening..." : "How can I help you today?")}
               </p>
            </div>

            <div className="mt-6 flex items-center justify-between opacity-30 hover:opacity-100 transition-opacity">
               <span className="text-[10px] font-medium text-white/50">PRESS M TO MUTE</span>
               <Settings size={16} className="cursor-pointer" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        layout
        className="relative group"
        onClick={() => !isExpanded && setIsExpanded(true)}
      >
        <div className={`w-32 h-32 rounded-full flex items-center justify-center relative glass-heavy transition-all duration-700 ${
          state === 'listening' ? 'scale-110' : ''
        }`}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <Waveform
              isListening={state === 'listening'}
              isSpeaking={state === 'speaking'}
              isThinking={state === 'thinking'}
            />
          </div>

          <motion.div
            className={`z-10 rounded-full p-5 shadow-2xl cursor-pointer transition-all duration-500 ${
              state === 'listening' ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              toggleListening();
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {state === 'listening' ? <Mic size={32} /> : <MicOff size={32} />}
          </motion.div>

          {/* Orbiting ring */}
          <AnimatePresence>
            {(state === 'thinking' || state === 'speaking') && (
              <motion.div
                initial={{ opacity: 0, rotate: 0 }}
                animate={{ opacity: 1, rotate: 360 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-8px] rounded-full border border-white/10 border-t-white/40 border-l-white/40"
              />
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
