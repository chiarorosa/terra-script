import { GameEngine } from '../engine/GameEngine';
import { VirtualFS } from '../engine/virtualFs';
import { VirtualFile } from '../types/game';
import { computeSaveChecksum, verifySaveChecksum } from './cryptoUtils';

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

// 1. Export Full Game Save JSON (With HMAC-SHA256 Integrity Signature)
export async function exportGameSave(engine: GameEngine) {
  const saveData: Record<string, any> = engine.exportSaveData();
  
  // Compute signature over clean saveData
  const signature = await computeSaveChecksum(saveData);
  saveData.signature = signature;

  const jsonStr = JSON.stringify(saveData, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  triggerFileDownload(`terrascript_save_${dateStr}.json`, jsonStr, 'application/json');
}

// 2. Import Full Game Save JSON from File (Validates Integrity)
export function importGameSave(
  engine: GameEngine, 
  file: File, 
  callback?: (success: boolean, message?: string) => void
) {
  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      const text = e.target?.result as string;
      const parsed = JSON.parse(text);

      // Verify HMAC-SHA256 Signature
      const verification = await verifySaveChecksum(parsed);

      if (verification.isUnsigned) {
        console.warn('Save file has no integrity signature.');
        if (callback) callback(false, 'Arquivo de save não possui assinatura de integridade!');
        return;
      }

      if (!verification.valid) {
        console.error('Save file integrity check failed! File was manually modified or corrupted.');
        if (callback) callback(false, 'Assinatura inválida! O arquivo de Save foi editado ou alterado manualmente.');
        return;
      }

      const ok = engine.importSaveData(parsed);
      if (callback) {
        if (ok) callback(true, 'Save importado e verificado com sucesso!');
        else callback(false, 'Erro interno ao processar dados do save.');
      }
    } catch (err) {
      console.error('Erro ao ler arquivo de save JSON:', err);
      if (callback) callback(false, 'Formato JSON inválido ou arquivo corrompido.');
    }
  };
  reader.readAsText(file);
}

// 3. Download Single Script File (.py or .js)
export function downloadScript(file: VirtualFile) {
  const mime = file.language === 'python' ? 'text/x-python' : 'text/javascript';
  triggerFileDownload(file.name, file.content, mime);
}

// 4. Download All Scripts as JSON Bundle
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

// 5. Import Local Script (.py or .js) from Disk
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
