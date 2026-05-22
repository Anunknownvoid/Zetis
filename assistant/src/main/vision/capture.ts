import { desktopCapturer } from 'electron';

export async function getSources() {
  return await desktopCapturer.getSources({ types: ['window', 'screen'] });
}

export async function captureScreen(sourceId: string): Promise<string> {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 1280, height: 720 }
  });
  const source = sources.find(s => s.id === sourceId) || sources[0];
  return source.thumbnail.toDataURL('image/jpeg', 0.8);
}
