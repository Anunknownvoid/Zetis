import { BaseAIProvider } from './base';
import WebSocket from 'ws';

export class OpenAIRealtimeProvider extends BaseAIProvider {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = 'gpt-4o-realtime-preview-2024-10-01') {
    super();
    this.apiKey = apiKey;
    this.model = model;
  }

  async connect(): Promise<void> {
    if (!this.apiKey) {
      console.error('OpenAI API Key is missing');
      this.setState('error');
      return;
    }

    const url = `wss://api.openai.com/v1/realtime?model=${this.model}`;
    this.ws = new WebSocket(url, {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      },
    });

    this.ws.on('open', () => {
      this.setState('idle');
      this.configureSession();
    });

    this.ws.on('message', (data) => {
      const event = JSON.parse(data.toString());
      this.handleEvent(event);
    });

    this.ws.on('close', () => {
      this.setState('idle');
    });

    this.ws.on('error', (err) => {
      this.setState('error');
    });
  }

  private configureSession() {
    const event = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        instructions: 'You are a helpful desktop assistant. You can see the user screen via image descriptions. Be concise.',
        voice: 'alloy',
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
        },
      },
    };
    this.ws?.send(JSON.stringify(event));
  }

  async disconnect(): Promise<void> {
    this.ws?.close();
    this.ws = null;
  }

  sendAudio(chunk: Int16Array): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const base64Audio = Buffer.from(chunk.buffer).toString('base64');
      this.ws.send(JSON.stringify({
        type: 'input_audio_buffer.append',
        audio: base64Audio,
      }));
    }
  }

  sendText(text: string): void {
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

  sendVision(frameBase64: string): void {
    // Inject vision as a conversation item since Realtime API handles vision through multimodal context
    // This is a simplified approach for the current API capabilities
    const cleanBase64 = frameBase64.replace(/^data:image\/[a-z]+;base64,/, '');

    this.ws?.send(JSON.stringify({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: 'I am showing you my screen now.'
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${cleanBase64}`
            }
          }
        ]
      }
    }));
  }

  private handleEvent(event: any) {
    switch (event.type) {
      case 'response.audio_transcript.delta':
        this.emitTranscript(event.delta, false);
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
    }
  }
}
