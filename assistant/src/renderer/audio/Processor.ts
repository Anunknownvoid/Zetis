export class AudioProcessor {
  private audioContext: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private onAudioChunk: (chunk: Int16Array) => void;

  constructor(onAudioChunk: (chunk: Int16Array) => void) {
    this.onAudioChunk = onAudioChunk;
  }

  async start() {
    this.audioContext = new AudioContext({ sampleRate: 24000 });
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const source = this.audioContext.createMediaStreamSource(this.stream);

    // In a real production app, we would use a proper AudioWorklet for PCM extraction.
    // For this implementation, we'll use a ScriptProcessorNode (deprecated but easier for bundling)
    // or a simplified Worklet.

    const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
    source.connect(processor);
    processor.connect(this.audioContext.destination);

    processor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7fff;
      }
      this.onAudioChunk(pcmData);
    };
  }

  async stop() {
    this.stream?.getTracks().forEach(track => track.stop());
    await this.audioContext?.close();
    this.audioContext = null;
    this.stream = null;
  }
}
