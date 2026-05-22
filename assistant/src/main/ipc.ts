import { ipcMain } from 'electron'

export function setupIPC(assistantManager: any) {
  ipcMain.on('audio-chunk', (_event, chunk: Int16Array) => {
    assistantManager.handleAudioChunk(chunk)
  })

  ipcMain.on('start-listening', () => {
    assistantManager.startConversation()
  })

  ipcMain.on('stop-listening', () => {
    assistantManager.stopConversation()
  })

  ipcMain.on('set-capture-source', (_event, sourceId: string) => {
    assistantManager.setVisionSource(sourceId)
  })
}
