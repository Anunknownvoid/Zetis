import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export const tools = {
  executeCommand: async (command: string) => {
    const { stdout, stderr } = await execAsync(command);
    return stdout || stderr;
  },

  getClipboard: async () => {
    const { clipboard } = require('electron');
    return clipboard.readText();
  },

  openUrl: async (url: string) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return 'URL opened';
  }
};
