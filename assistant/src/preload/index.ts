import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

const api = {
  sendAudioChunk: (chunk: Int16Array) => ipcRenderer.send('audio-chunk', chunk),
  startListening: () => ipcRenderer.send('start-listening'),
  stopListening: () => ipcRenderer.send('stop-listening'),
  setCaptureSource: (sourceId: string) => ipcRenderer.send('set-capture-source', sourceId),

  onAssistantState: (callback: (state: any) => void) => {
    const subscription = (_event: any, state: any) => callback(state)
    ipcRenderer.on('assistant-state', subscription)
    return () => ipcRenderer.removeListener('assistant-state', subscription)
  },

  onTranscript: (callback: (text: string, isFinal: boolean) => void) => {
    const subscription = (_event: any, text: string, isFinal: boolean) => callback(text, isFinal)
    ipcRenderer.on('transcript', subscription)
    return () => ipcRenderer.removeListener('transcript', subscription)
  },

  onAudioResponse: (callback: (chunk: ArrayBuffer) => void) => {
    const subscription = (_event: any, chunk: ArrayBuffer) => callback(chunk)
    ipcRenderer.on('audio-response', subscription)
    return () => ipcRenderer.removeListener('audio-response', subscription)
  },

  onAssistantResponse: (callback: (text: string) => void) => {
    const subscription = (_event: any, text: string) => callback(text)
    ipcRenderer.on('assistant-response', subscription)
    return () => ipcRenderer.removeListener('assistant-response', subscription)
  }
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in window)
  window.electron = electronAPI
  // @ts-ignore (define in window)
  window.api = api
}
