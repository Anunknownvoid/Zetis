import { EventEmitter } from 'events';
import { AssistantState } from '../../shared/types';

export abstract class BaseAIProvider extends EventEmitter {
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendAudio(chunk: Int16Array): void;
  abstract sendText(text: string): void;
  abstract sendVision(frame: string): void; // base64 jpeg

  protected setState(state: AssistantState) {
    this.emit('state-change', state);
  }

  protected emitTranscript(text: string, isFinal: boolean) {
    this.emit('transcript', { text, isFinal });
  }

  protected emitAudioResponse(chunk: Buffer) {
    this.emit('audio-response', chunk);
  }

  protected emitTextResponse(text: string) {
    this.emit('text-response', text);
  }
}
