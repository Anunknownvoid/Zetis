import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isListening: boolean;
  isSpeaking: boolean;
  isThinking: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isListening, isSpeaking, isThinking }) => {
  const bars = Array.from({ length: 20 });

  return (
    <div className="flex items-center justify-center gap-1 h-12">
      {bars.map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 bg-primary rounded-full ${isThinking ? 'bg-accent' : ''}`}
          animate={{
            height: isListening || isSpeaking ? [10, 40, 10] : isThinking ? [20, 25, 20] : 4,
            opacity: isListening || isSpeaking || isThinking ? 1 : 0.3,
          }}
          transition={{
            duration: isThinking ? 1 : 0.5,
            repeat: Infinity,
            delay: i * 0.05,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};
