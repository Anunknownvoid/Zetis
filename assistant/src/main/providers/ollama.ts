import { BaseAIProvider } from './base';

export class OllamaProvider extends BaseAIProvider {
  private baseUrl: string;
  private model: string;
  private abortController: AbortController | null = null;
  private currentContext: string = '';

  constructor(baseUrl: string = 'http://localhost:11434', model: string = 'llava') {
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
        throw new Error('Ollama not reachable');
      }
    } catch (e) {
      this.setState('error');
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    this.abortController?.abort();
  }

  sendAudio(chunk: Int16Array): void {
    // Local STT would go here. For now, we assume text or trigger vision.
  }

  async sendText(text: string, images?: string[]): Promise<void> {
    this.setState('thinking');
    this.abortController = new AbortController();

    try {
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        body: JSON.stringify({
          model: this.model,
          prompt: text,
          images: images,
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
          try {
            const json = JSON.parse(line);
            if (json.response) {
              this.emitTextResponse(json.response);
              this.emitTranscript(json.response, false);
            }
            if (json.done) {
              this.emitTranscript('', true);
            }
          } catch (e) {
            console.error('Failed to parse Ollama chunk:', e);
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

  sendVision(frameBase64: string): void {
    const cleanBase64 = frameBase64.replace(/^data:image\/[a-z]+;base64,/, '');
    // In a realtime loop, we might not want to prompt every frame unless asked.
    // This is a placeholder for context-aware vision analysis.
  }
}
