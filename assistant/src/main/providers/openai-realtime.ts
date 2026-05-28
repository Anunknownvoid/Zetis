import { BaseAIProvider } from './base';
import WebSocket from 'ws';

export class OpenAIRealtimeProvider extends BaseAIProvider {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private isConnected: boolean = false;

  constructor(apiKey: string, model: string = 'gpt-4o-realtime-preview-2024-10-01') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      this.setState('error');
      throw new Error('OpenAI API key missing');
    }

    const url = `wss://api.openai.com/v1/realtime?model=${this.model}`;
    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    return new Promise((resolve, reject) => {
      this.ws!.on('open', () => {
        this.isConnected = true;
        this.configureSession();
        this.setState('idle');
        resolve();
      });

      this.ws!.on('message', (data) => {
        try {
          const event = JSON.parse(data.toString());
          this.handleEvent(event);
        } catch (e) {
          console.error('Failed to parse OpenAI event:', e);
        }
      });

      this.ws!.on('error', (err) => {
        this.setState('error');
        reject(err);
      });

      this.ws!.on('close', () => {
        this.isConnected = false;
        this.setState('idle');
      });
    });
  }

  private configureSession() {
    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are Astra, a helpful multimodal AI assistant. You can see the user screen. Be concise and conversational.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };
    this.ws?.send(JSON.stringify(event));
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
    this.isConnected = false;
  }

  sendAudio(chunk: Int16Array): void {
    if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
      const base64Audio = Buffer.from(chunk.buffer).toString('base64');
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }));
    }
  }

  sendText(text: string): void {
    if (this.isConnected) {
      this.ws?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [{ type: 'input_text', text }],
        },
      }));
      this.ws?.send(JSON.stringify({ type: 'response.create' }));
    }
  }

  sendVision(frameBase64: string): void {
    if (this.isConnected) {
      const cleanBase64 = frameBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      this.ws?.send(JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${cleanBase64}` } }
          ],
        },
      }));
    }
  }

  private handleEvent(event: any) {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        this.emitTranscript(event.delta, false);
        break;
      case 'response.audio_transcript.done':
        this.emitTranscript('', true);
        break;
      case 'response.audio.delta':
        this.emitAudioResponse(Buffer.from(event.delta, 'base64'));
        break;
      case 'input_audio_buffer.speech_started':
        this.setState('listening');
        this.emit('interrupt');
        break;
      case 'input_audio_buffer.speech_stopped':
        this.setState('thinking');
        break;
      case 'response.done':
        this.setState('idle');
        break;
      case 'error':
        console.error('OpenAI Realtime Error:', event.error);
        this.setState('error');
        break;
    }
  }
}
