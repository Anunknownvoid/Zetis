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
  private nativeEngine: any;
  private visionInterval: NodeJS.Timeout | null = null;
  private captureSourceId: string = 'screen:0:0';
  private isProcessingVision: boolean = false;

  constructor(win: BrowserWindow, nativeEngine: any) {
    super();
    this.win = win;
    this.nativeEngine = nativeEngine;
  }

  async setProvider(type: string, config: any) {
    try {
      if (this.provider) await this.provider.disconnect();

      if (type === 'openai-realtime') {
        this.provider = new OpenAIRealtimeProvider(config.apiKey);
      } else if (type === 'ollama') {
        this.provider = new OllamaProvider(config.baseUrl, config.model);
      }

      if (this.provider) {
        this.provider.on('state-change', (state: AssistantState) => {
          if (!this.win.isDestroyed()) {
            this.win.webContents.send('assistant-state', state);
          }
        });

        this.provider.on('transcript', (data: any) => {
          if (!this.win.isDestroyed()) {
            this.win.webContents.send('transcript', data.text, data.isFinal);
          }
        });

        this.provider.on('audio-response', (chunk: Buffer) => {
          if (!this.win.isDestroyed()) {
            this.win.webContents.send('audio-response', chunk);
          }
        });

        this.provider.on('text-response', (text: string) => {
          if (!this.win.isDestroyed()) {
            this.win.webContents.send('assistant-response', text);
          }
        });

        await this.provider.connect();
        this.startVisionLoop();
      }
    } catch (e) {
      console.error('Failed to set provider:', e);
      if (!this.win.isDestroyed()) {
        this.win.webContents.send('assistant-state', 'error');
      }
    }
  }

  private startVisionLoop() {
    if (this.visionInterval) clearInterval(this.visionInterval);

    this.visionInterval = setInterval(async () => {
      if (!this.provider || this.isProcessingVision) return;

      this.isProcessingVision = true;
      try {
        let frame: string | null = null;

        if (this.nativeEngine) {
          try {
             // Use method name from Rust [napi] definition
             const nativeFrame = this.nativeEngine.getScreenFrame();
             if (nativeFrame && nativeFrame !== 'MOCK_FRAME') {
               frame = nativeFrame;
             }
          } catch (e) {
             // Fallback
          }
        }

        if (!frame) {
          frame = await captureScreen(this.captureSourceId);
        }

        if (frame && this.provider) {
          this.provider.sendVision(frame);
        }
      } catch (e) {
        console.error('Vision loop error:', e);
      } finally {
        this.isProcessingVision = false;
      }
    }, 2000);
  }

  handleAudioChunk(chunk: Int16Array) {
    try {
      this.provider?.sendAudio(chunk);
    } catch (e) {
      console.error('Failed to send audio chunk to provider:', e);
    }
  }

  stop() {
    if (this.visionInterval) {
      clearInterval(this.visionInterval);
      this.visionInterval = null;
    }
    this.provider?.disconnect();
    this.isProcessingVision = false;
  }
}
