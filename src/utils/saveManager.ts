import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { VirtualFile } from '../types/game';

// Trigger browser download for text/json/script files
export function triggerFileDownload(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 1. Download Single Script File (.py or .js)
export function downloadScript(file: VirtualFile) {
  const mime = file.language === 'python' ? 'text/x-python' : 'text/javascript';
  triggerFileDownload(file.name, file.content, mime);
}

// 2. Download All Scripts as JSON Bundle
export function downloadAllScriptsBundle(vfs: VirtualFS) {
  const scripts = vfs.getFiles();
  const dateStr = new Date().toISOString().slice(0, 10);
  const bundle = {
    appName: 'TerraScript 3D Scripts',
    exportedAt: new Date().toISOString(),
    files: scripts
  };
  triggerFileDownload(`terrascript_scripts_${dateStr}.json`, JSON.stringify(bundle, null, 2), 'application/json');
}

// 3. Import Local Script (.py or .js) from Disk
export function importLocalScriptFile(vfs: VirtualFS, file: File, callback?: (importedPath: string) => void) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const text = e.target?.result as string;
      const created = vfs.importScriptFromDisk(file.name, text);
      if (callback) callback(created.path);
    } catch (err) {
      console.error('Erro ao importar script local:', err);
    }
  };
  reader.readAsText(file);
}

