import { VirtualFile } from '../types/game';

const VFS_STORAGE_KEY = 'terrascript_vfs_v9';

export const DEFAULT_FILES: VirtualFile[] = [
  {
    path: 'guia/main.py',
    name: 'main.py',
    folder: 'guia',
    readOnly: true,
    language: 'python',
    isEntrypoint: true,
    content: `# ============================================================
# SUA PRIMEIRA TAREFA:
# 1. Colha a Fibras no terreno chamando farm.harvest().
# 2. Clique no botão de Play (►) na barra superior para executar.
# 3. Junte Fibras para desbloquear sua 1ª Tecnologia
#    na aba 'Pesquisa' (ex: Expansão de Terreno 1x3).
#
# A cada ciclo, o script é executado do início ao fim do arquivo!
# LEIA COM ATENÇÃO a aba GUIA

farm.harvest()
world.move("FORWARD")
`
  },
  {
    path: 'guia/main.js',
    name: 'main.js',
    folder: 'guia',
    readOnly: true,
    language: 'javascript',
    isEntrypoint: false,
    content: `// ============================================================
// SUA PRIMEIRA TAREFA:
// 1. Colha a Fibras no terreno chamando farm.harvest().
// 2. Clique no botão de Play (►) na barra superior para executar.
// 3. Junte Fibras para desbloquear sua 1ª Tecnologia
//    na aba 'Pesquisa' (ex: Expansão de Terreno 1x3).
//
// A cada ciclo, o script é executado do início ao fim do arquivo!
// LEIA COM ATENÇÃO a aba GUIA

farm.harvest();
world.move("FORWARD");
`
  },
  {
    path: 'guia/regar.py',
    name: 'regar.py',
    folder: 'guia',
    readOnly: true,
    language: 'python',
    isEntrypoint: false,
    content: `# Irrigação
# Comandos de fazenda:
farm.water()
`
  },
  {
    path: 'guia/regar.js',
    name: 'regar.js',
    folder: 'guia',
    readOnly: true,
    language: 'javascript',
    isEntrypoint: false,
    content: `// Irrigação
// Comandos de fazenda:
farm.water();
`
  },
  {
    path: 'guia/plantar.py',
    name: 'plantar.py',
    folder: 'guia',
    readOnly: true,
    language: 'python',
    isEntrypoint: false,
    content: `# Plantação
# Comandos de fazenda:

world.clear()
farm.plant("WILD_FIBER")
`
  },
  {
    path: 'guia/plantar.js',
    name: 'plantar.js',
    folder: 'guia',
    readOnly: true,
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
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.loadFromStorage();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(fn => {
      try {
        fn();
      } catch (e) {
        console.error('Error in VFS listener:', e);
      }
    });
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(VFS_STORAGE_KEY) || localStorage.getItem('terrascript_vfs_v8');
      if (stored) {
        const parsed: VirtualFile[] = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach(f => {
            let path = f.path || '';
            let name = f.name || path;
            let folder = f.folder;
            let readOnly = f.readOnly;

            // Fix/sanitize language if corrupted
            const validLang: 'python' | 'javascript' = (f.language === 'python' || f.language === 'javascript')
              ? f.language
              : (path.endsWith('.js') ? 'javascript' : 'python');

            // Sanitize paths from old broken imports with comunidad/
            if (path.startsWith('fazenda/comunidade/')) {
              path = path.replace('fazenda/comunidade/', 'fazenda/');
              name = path.split('/').pop() || name;
            } else if (path.startsWith('comunidade/')) {
              path = path.replace('comunidade/', 'fazenda/');
              name = path.split('/').pop() || name;
            }

            // Migrate legacy flat paths
            if (!path.startsWith('guia/') && !path.startsWith('fazenda/')) {
              const isDefault = ['main.py', 'main.js', 'regar.py', 'regar.js', 'plantar.py', 'plantar.js'].includes(path);
              if (isDefault) {
                folder = 'guia';
                readOnly = true;
                path = `guia/${path}`;
                name = path.split('/').pop() || name;
              } else {
                folder = 'fazenda';
                readOnly = false;
                path = `fazenda/${path}`;
                name = path.split('/').pop() || name;
              }
            } else if (path.startsWith('guia/')) {
              folder = 'guia';
              readOnly = true;
              name = path.split('/').pop() || name;
            } else if (path.startsWith('fazenda/')) {
              folder = 'fazenda';
              readOnly = false;
              name = path.split('/').pop() || name;
            }

            this.files.set(path, {
              ...f,
              path,
              name: name || path,
              folder: folder || (path.startsWith('guia/') ? 'guia' : 'fazenda'),
              readOnly: readOnly ?? path.startsWith('guia/'),
              language: validLang
            });
          });

          // Ensure default guia files are present
          DEFAULT_FILES.forEach(df => {
            if (!this.files.has(df.path)) {
              this.files.set(df.path, { ...df });
            }
          });

          this.saveToStorage();
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse VFS from storage, loading defaults:', e);
    }

    DEFAULT_FILES.forEach(f => this.files.set(f.path, { ...f }));
    this.saveToStorage();
  }

  public saveToStorage() {
    try {
      const arr = Array.from(this.files.values());
      localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(arr));
      this.notifyListeners();
    } catch (e) {
      console.error('Failed to save VFS to storage:', e);
    }
  }

  public getFiles(): VirtualFile[] {
    return Array.from(this.files.values());
  }

  public getFile(path: string): VirtualFile | undefined {
    // Try exact path first
    if (this.files.has(path)) return this.files.get(path);
    // If passed flat filename e.g. "main.py", try matching ending or folder
    const all = Array.from(this.files.values());
    return all.find(f => f.path === path || f.name === path || f.path === `guia/${path}` || f.path === `fazenda/${path}`);
  }

  public setFileContent(path: string, content: string): void {
    const file = this.getFile(path);
    if (file) {
      file.content = content;
      file.modified = false;
      this.saveToStorage();
    }
  }

  public createFile(name: string, language: 'python' | 'javascript'): VirtualFile {
    let clean = name.trim().replace(/^\/+/, '');
    if (clean.startsWith('fazenda/')) {
      clean = clean.substring('fazenda/'.length);
    } else if (clean.startsWith('guia/')) {
      clean = clean.substring('guia/'.length);
    }

    if (!clean.endsWith('.py') && !clean.endsWith('.js')) {
      clean += language === 'python' ? '.py' : '.js';
    }

    const path = `fazenda/${clean}`;
    const newFile: VirtualFile = {
      path,
      name: clean,
      folder: 'fazenda',
      readOnly: false,
      language,
      content: language === 'python' 
        ? `# ${clean}\n# Comandos de fazenda:\nfarm.harvest()\nworld.move("RIGHT")\n` 
        : `// ${clean}\n// Comandos de fazenda:\nfarm.harvest();\nworld.move("RIGHT");\n`,
      isEntrypoint: false
    };
    this.files.set(path, newFile);
    this.saveToStorage();
    return newFile;
  }

  public deleteFile(path: string): void {
    const file = this.getFile(path);
    if (file) {
      if (file.readOnly || file.folder === 'guia' || file.path.startsWith('guia/')) {
        return; // Protection rule: /guia files cannot be deleted
      }
      this.files.delete(file.path);
      this.saveToStorage();
    }
  }

  public renameFile(oldPath: string, newName: string): VirtualFile | false {
    const file = this.getFile(oldPath);
    if (!file) return false;
    if (file.readOnly || file.folder === 'guia' || file.path.startsWith('guia/')) {
      return false; // Protection rule: /guia files cannot be renamed
    }

    let cleanName = newName.trim().replace(/^\/+/, '');
    if (cleanName.startsWith('fazenda/')) {
      cleanName = cleanName.substring('fazenda/'.length);
    }

    if (!cleanName) return false;

    if (!cleanName.endsWith('.py') && !cleanName.endsWith('.js')) {
      const ext = file.path.endsWith('.js') ? '.js' : '.py';
      cleanName += ext;
    }

    const newPath = `fazenda/${cleanName}`;

    if (newPath === file.path) return file;

    if (this.files.has(newPath)) {
      return false;
    }

    const language: 'python' | 'javascript' = newPath.endsWith('.js') ? 'javascript' : 'python';

    const renamedFile: VirtualFile = {
      ...file,
      path: newPath,
      name: cleanName,
      folder: 'fazenda',
      language
    };

    this.files.delete(file.path);
    this.files.set(newPath, renamedFile);
    this.saveToStorage();

    return renamedFile;
  }

  public setEntrypoint(path: string): void {
    const targetFile = this.getFile(path);
    const targetPath = targetFile ? targetFile.path : path;

    this.files.forEach(f => {
      f.isEntrypoint = (f.path === targetPath);
    });
    this.saveToStorage();
  }

  public getEntrypoint(): VirtualFile | undefined {
    return Array.from(this.files.values()).find(f => f.isEntrypoint) || 
           this.files.get('guia/main.py') || 
           Array.from(this.files.values())[0];
  }

  public importScriptFromDisk(filename: string, content: string): VirtualFile {
    let cleanName = filename.trim().replace(/^\/+/, '');
    if (cleanName.startsWith('fazenda/')) cleanName = cleanName.substring('fazenda/'.length);
    if (cleanName.startsWith('guia/')) cleanName = cleanName.substring('guia/'.length);

    let lang: 'python' | 'javascript' = 'python';
    if (cleanName.endsWith('.js')) lang = 'javascript';
    else if (!cleanName.endsWith('.py')) {
      cleanName += '.py';
    }

    const path = `fazenda/${cleanName}`;
    const existing = this.files.get(path);

    const newFile: VirtualFile = {
      path,
      name: cleanName,
      folder: 'fazenda',
      readOnly: false,
      language: lang,
      content: content,
      isEntrypoint: existing ? existing.isEntrypoint : false
    };
    this.files.set(path, newFile);
    this.saveToStorage();
    return newFile;
  }

  public loadFromFiles(filesArray: VirtualFile[]): void {
    if (!Array.isArray(filesArray) || filesArray.length === 0) return;
    this.files.clear();
    filesArray.forEach(f => {
      if (f && f.path && typeof f.content === 'string') {
        let path = f.path;
        let name = f.name || path;
        let folder = f.folder;
        let readOnly = f.readOnly;

        const validLang: 'python' | 'javascript' = (f.language === 'python' || f.language === 'javascript')
          ? f.language
          : (path.endsWith('.js') ? 'javascript' : 'python');

        if (path.startsWith('fazenda/comunidade/')) {
          path = path.replace('fazenda/comunidade/', 'fazenda/');
          name = path.split('/').pop() || name;
        } else if (path.startsWith('comunidade/')) {
          path = path.replace('comunidade/', 'fazenda/');
          name = path.split('/').pop() || name;
        }

        if (!path.startsWith('guia/') && !path.startsWith('fazenda/')) {
          const isDefault = ['main.py', 'main.js', 'regar.py', 'regar.js', 'plantar.py', 'plantar.js'].includes(path);
          folder = isDefault ? 'guia' : 'fazenda';
          readOnly = isDefault;
          path = `${folder}/${path}`;
          name = path.split('/').pop() || name;
        }

        this.files.set(path, {
          path,
          name: name || path,
          folder: folder || (path.startsWith('guia/') ? 'guia' : 'fazenda'),
          readOnly: readOnly ?? path.startsWith('guia/'),
          language: validLang,
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

  public resetGuiaFiles(): void {
    DEFAULT_FILES.forEach(df => {
      this.files.set(df.path, { ...df });
    });
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.files.clear();
    DEFAULT_FILES.forEach(f => this.files.set(f.path, { ...f }));
    this.saveToStorage();
  }
}

