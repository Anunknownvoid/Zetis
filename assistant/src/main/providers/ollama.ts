import { BaseAIProvider } from './base';

export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;
  private abortController: AbortController | null = null;

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llama3') {
    super();
    this.baseUrl = baseUrl;
    this.model = model;
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (response.ok) {
        this.setState('idle');
      } else {
        this.setState('error');
      }
    } catch (e) {
      this.setState('error');
    }
  }

  async disconnect(): Promise<void> {
    this.abortController?.abort();
  }

  sendAudio(chunk: Int16Array): void {
    // Local Ollama doesn't support direct PCM streaming yet.
    // We would need a local Whisper instance to transcribe first.
    console.log('Ollama: Audio input received (requires local STT)');
  }

  async sendText(text: string): Promise<void> {
    this.setState('thinking');
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: this.model,
          prompt: text,
          stream: true,
        }),
        signal: this.abortController.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) return;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = new TextDecoder().decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          const json = JSON.parse(line);
          if (json.response) {
            this.emitTextResponse(json.response);
          }
        }
      }
      this.setState('idle');
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.setState('error');
      }
    }
  }

  sendVision(frame: string): void {
    // Ollama supports vision with models like 'llava'
    this.sendTextWithVision('What is in this image?', frame);
  }

  private async sendTextWithVision(text: string, frame: string): Promise<void> {
     // Implementation for multimodal Ollama
  }
}
