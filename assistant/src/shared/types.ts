export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

export interface AIConfig {
  provider: 'openai-realtime' | 'ollama' | 'anthropic' | 'gemini';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface VoiceEvent {
  type: 'transcript' | 'audio' | 'state-change';
  data: any;
}

export interface VisionResult {
  text: string;
  description: string;
  timestamp: number;
}

export interface IPCExposedAPI {
  sendAudioChunk: (chunk: Int16Array) => void;
  startListening: () => void;
  stopListening: () => void;
  setCaptureSource: (sourceId: string) => void;
  onAssistantState: (callback: (state: AssistantState) => void) => void;
  onTranscript: (callback: (text: string, isFinal: boolean) => void) => void;
  onAudioResponse: (callback: (chunk: ArrayBuffer) => void) => void;
  onAssistantResponse: (callback: (text: string) => void) => void;
}
