import { VirtualFile } from '../types/game';

const VFS_STORAGE_KEY = 'terrascript_vfs_v7';

export const DEFAULT_FILES: VirtualFile[] = [
  {
    path: 'main.py',
    name: 'main.py',
    language: 'python',
    isEntrypoint: true,
    content: `# ============================================================
# TERRA SCRIPT 3D - SCRIPT PRINCIPAL (PYTHON)
# ============================================================
# SUA PRIMEIRA TAREFA:
# 1. Colha a Fibra Selvagem no terreno chamando farm.harvest().
# 2. Clique no botão de Play (►) na barra superior para executar.
# 3. Junte 20 Fibras para desbloquear sua 1ª Tecnologia
#    na aba 'Pesquisa' (ex: Expansão de Terreno 1x3).
#
# A cada ciclo, o script é executado do início ao fim do arquivo!
# LEIA COM ATENÇÃO a aba GUIA

farm.harvest()
world.move("NORTH")
`
  },
  {
    path: 'main.js',
    name: 'main.js',
    language: 'javascript',
    isEntrypoint: false,
    content: `// ============================================================
// TERRA SCRIPT 3D - SCRIPT PRINCIPAL (JAVASCRIPT)
// ============================================================
// SUA PRIMEIRA TAREFA:
// 1. Colha a Fibra Selvagem no terreno chamando farm.harvest().
// 2. Clique no botão de Play (►) na barra superior para executar.
// 3. Junte 20 Fibras para desbloquear sua 1ª Tecnologia
//    na aba 'Pesquisa' (ex: Expansão de Terreno 1x3).
//
// A cada ciclo, o script é executado do início ao fim do arquivo!
// LEIA COM ATENÇÃO a aba GUIA

farm.harvest();
world.move("NORTH");
`
  },
  {
    path: 'regar.py',
    name: 'regar.py',
    language: 'python',
    isEntrypoint: false,
    content: `# Irrigação
# Comandos de fazenda:
farm.water()
`
  },
  {
    path: 'regar.js',
    name: 'regar.js',
    language: 'javascript',
    isEntrypoint: false,
    content: `// Irrigação
// Comandos de fazenda:
farm.water();
`
  },
  {
    path: 'plantar.py',
    name: 'plantar.py',
    language: 'python',
    isEntrypoint: false,
    content: `# Plantação
# Comandos de fazenda:

world.clear()
farm.plant("WILD_FIBER")
`
  },
  {
    path: 'plantar.js',
    name: 'plantar.js',
    language: 'javascript',
    isEntrypoint: false,
    content: `// Plantação
// Comandos de fazenda:

world.clear();
farm.plant("WILD_FIBER");
`
  }
];

export class VirtualFS {
  private files: Map<string, VirtualFile> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(VFS_STORAGE_KEY);
      if (stored) {
        const parsed: VirtualFile[] = JSON.parse(stored);
        parsed.forEach(f => this.files.set(f.path, f));
        if (this.files.size > 0) return;
      }
    } catch (e) {
      console.warn('Failed to parse VFS from storage, loading defaults:', e);
    }

    DEFAULT_FILES.forEach(f => this.files.set(f.path, f));
    this.saveToStorage();
  }

  public saveToStorage() {
    try {
      const arr = Array.from(this.files.values());
      localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.error('Failed to save VFS to storage:', e);
    }
  }

  public getFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  public getFile(path: string): VirtualFile | undefined {
    return this.files.get(path);
  }

  public setFileContent(path: string, content: string): void {
    const file = this.files.get(path);
    if (file) {
      file.content = content;
      file.modified = false;
      this.saveToStorage();
    }
  }

  public createFile(name: string, language: 'python' | 'javascript'): VirtualFile {
    let path = name.trim();
    if (!path.endsWith('.py') && !path.endsWith('.js')) {
      path += language === 'python' ? '.py' : '.js';
    }
    const newFile: VirtualFile = {
      path,
      name: path,
      language,
      content: language === 'python' ? `# ${path}\n# Comandos de fazenda:\nfarm.harvest()\nworld.move("EAST")\n` : `// ${path}\n// Comandos de fazenda:\nfarm.harvest();\nworld.move("EAST");\n`,
      isEntrypoint: this.files.size === 0
    };
    this.files.set(path, newFile);
    this.saveToStorage();
    return newFile;
  }

  public deleteFile(path: string): void {
    this.files.delete(path);
    this.saveToStorage();
  }

  public renameFile(oldPath: string, newName: string): VirtualFile | false {
    const file = this.files.get(oldPath);
    if (!file) return false;

    let cleanName = newName.trim();
    if (!cleanName) return false;

    // Infer extension if missing
    if (!cleanName.endsWith('.py') && !cleanName.endsWith('.js')) {
      const ext = file.path.endsWith('.js') ? '.js' : '.py';
      cleanName += ext;
    }

    const newPath = cleanName;

    if (newPath === oldPath) return file;

    if (this.files.has(newPath)) {
      return false;
    }

    const language: 'python' | 'javascript' = newPath.endsWith('.js') ? 'javascript' : 'python';

    const renamedFile: VirtualFile = {
      ...file,
      path: newPath,
      name: newPath,
      language
    };

    this.files.delete(oldPath);
    this.files.set(newPath, renamedFile);
    this.saveToStorage();

    return renamedFile;
  }

  public setEntrypoint(path: string): void {
    this.files.forEach(f => {
      f.isEntrypoint = (f.path === path);
    });
    this.saveToStorage();
  }

  public getEntrypoint(): VirtualFile | undefined {
    return Array.from(this.files.values()).find(f => f.isEntrypoint) || Array.from(this.files.values())[0];
  }

  public importScriptFromDisk(filename: string, content: string): VirtualFile {
    let cleanName = filename.trim();
    let lang: 'python' | 'javascript' = 'python';
    if (cleanName.endsWith('.js')) lang = 'javascript';
    else if (!cleanName.endsWith('.py')) {
      cleanName += '.py';
    }

    const existing = this.files.get(cleanName);
    const newFile: VirtualFile = {
      path: cleanName,
      name: cleanName,
      language: lang,
      content: content,
      isEntrypoint: existing ? existing.isEntrypoint : (this.files.size === 0)
    };
    this.files.set(cleanName, newFile);
    this.saveToStorage();
    return newFile;
  }

  public loadFromFiles(filesArray: VirtualFile[]): void {
    if (!Array.isArray(filesArray) || filesArray.length === 0) return;
    this.files.clear();
    filesArray.forEach(f => {
      if (f && f.path && typeof f.content === 'string') {
        this.files.set(f.path, {
          path: f.path,
          name: f.name || f.path,
          language: f.language || (f.path.endsWith('.js') ? 'javascript' : 'python'),
          content: f.content,
          isEntrypoint: !!f.isEntrypoint
        });
      }
    });
    if (!this.getEntrypoint() && this.files.size > 0) {
      const first = Array.from(this.files.values())[0];
      first.isEntrypoint = true;
    }
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.files.clear();
    DEFAULT_FILES.forEach(f => this.files.set(f.path, f));
    this.saveToStorage();
  }
}
