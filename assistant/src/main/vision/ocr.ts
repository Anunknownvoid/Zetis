import { createWorker } from 'tesseract.js';

export async function performOCR(imageBuffer: Buffer | string): Promise<string> {
  // Using Tesseract.js which can be bundled.
  // For a production app, we would pre-bundle the lang data and worker to ensure offline support.
  const worker = await createWorker('eng');
  const { data: { text } } = await worker.recognize(imageBuffer);
  await worker.terminate();
  return text;
}
