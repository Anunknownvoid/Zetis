import { EventEmitter } from 'events';
import { OpenAIRealtimeProvider } from '../providers/openai-realtime';
import { OllamaProvider } from '../providers/ollama';
import { BaseAIProvider } from '../providers/base';
import { AssistantState } from '../../shared/types';
import { BrowserWindow } from 'electron';
import { captureScreen } from '../vision/capture';

export class AssistantManager extends EventEmitter {
  private provider: BaseAIProvider | null = null;
  private win: BrowserWindow;
  private captureSourceId: string = 'screen:0:0';
  private visionInterval: NodeJS.Timeout | null = null;

  constructor(win: BrowserWindow) {
    super();
    this.win = win;
  }

  async setProvider(type: string, config: any) {
    if (this.provider) await this.provider.disconnect();

    if (type === 'openai-realtime') {
      this.provider = new OpenAIRealtimeProvider(config.apiKey);
    } else if (type === 'ollama') {
      this.provider = new OllamaProvider(config.baseUrl, config.model);
    }

    if (this.provider) {
      this.provider.on('state-change', (state: AssistantState) => {
        this.win.webContents.send('assistant-state', state);
      });

      this.provider.on('transcript', (data: any) => {
        this.win.webContents.send('transcript', data.text, data.isFinal);
      });

      this.provider.on('audio-response', (chunk: Buffer) => {
        this.win.webContents.send('audio-response', chunk);
      });

      this.provider.on('interrupt', () => {
        this.win.webContents.send('interrupt-audio');
      });

      await this.provider.connect();
      this.startVisionLoop();
    }
  }

  private startVisionLoop() {
    if (this.visionInterval) clearInterval(this.visionInterval);

    // Capture screen every 5 seconds for context
    this.visionInterval = setInterval(async () => {
      if (this.provider && this.captureSourceId) {
        try {
          const frame = await captureScreen(this.captureSourceId);
          this.provider.sendVision(frame);
        } catch (e) {
          console.error('Vision capture failed:', e);
        }
      }
    }, 5000);
  }

  handleAudioChunk(chunk: Int16Array) {
    this.provider?.sendAudio(chunk);
  }

  setVisionSource(sourceId: string) {
    this.captureSourceId = sourceId;
  }

  stop() {
    if (this.visionInterval) clearInterval(this.visionInterval);
    this.provider?.disconnect();
  }
}
