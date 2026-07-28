import { VirtualFile } from '../types/game';

const VFS_STORAGE_KEY = 'terrascript_vfs_v5';

export const DEFAULT_FILES: VirtualFile[] = [
  {
    path: 'fazenda_multi_drone.py',
    name: 'fazenda_multi_drone.py',
    language: 'python',
    isEntrypoint: true,
    content: `# ============================================================
# TERRA SCRIPT 3D - VARREDURA COMPLETA MULTI-DRONE
# ============================================================
# Script otimizado para os 3 Drones (Claudio, Gepeto, Gemilson)
#
# CARACTERISTICAS DO SCRIPT:
# 1. Identificacao do drone via variavel DRONE_ID (1, 2 ou 3)
# 2. Leitura dinamica das dimensoes da grade (LARGURA x ALTURA)
# 3. Varredura por linhas e colunas com direcoes independentes
# 4. Checagem e colheita da cultura COLHEITA_A (se pronta colhe, senao planta)
# 5. Demonstracao de todos os operadores (+, -, *, /, %, ==, !=, <, >, <=, >=, and, or, not)

# --- CONFIGURACAO DO DRONE ---
# Mude DRONE_ID para 1 (Claudio), 2 (Gepeto) ou 3 (Gemilson)
DRONE_ID = 1

# Cultura a ser gerenciada (WOODY_BUSH, CULTIVATED_ROOT, FRUIT_COLONY, ENERGY_FLOWER)
COLHEITA_A = "ENERGY_FLOWER"

# --- DETECCAO DINAMICA DA GRADE ---
LARGURA = world.width()
ALTURA = world.height()
TOTAL_TILES = LARGURA * ALTURA

print("Iniciando operacao do Drone #" + str(DRONE_ID))
print("Tamanho da matriz detectado: " + str(LARGURA) + "x" + str(ALTURA))

# --- DEMONSTRACAO DE OPERADORES ARITMETICOS E LOGICOS ---
PASSOS_TOTAL = (LARGURA + ALTURA) - 2
METADE_GRADE = TOTAL_TILES / 2
MODULO_X = LARGURA % 2
FATOR_MULT = LARGURA * 2

# Checagem condicional usando operadores relacionais e logicos (if, elif, else)
if DRONE_ID == 1 and not (LARGURA <= 0 or ALTURA <= 0):
    print("Drone Claudio ativo na rota padrao Leste/Sul")
elif DRONE_ID == 2 and (LARGURA > 1 or ALTURA > 1):
    print("Drone Gepeto ativo na rota em zigue-zague")
elif DRONE_ID == 3 and (LARGURA >= 1 and ALTURA >= 1):
    print("Drone Gemilson ativo na rota de varredura continua")
else:
    print("Drone em operacao padrao")

# --- LACO PRINCIPAL DE VARREDURA (while e for) ---
executando = True
passo_atual = 0

while executando:
    # Varredura por linhas (Y) e colunas (X)
    for y in range(0, ALTURA, 1):
        for x in range(0, LARGURA, 1):
            
            # Posicao atual
            pos_x = world.x()
            pos_y = world.y()
            
            # 1. COLHEITA OU PLANTIO
            if farm.can_harvest():
                farm.harvest()
                print("Colheita realizada em (" + str(pos_x) + ", " + str(pos_y) + ")")
            elif not farm.can_harvest() or world.entity() == "EMPTY":
                farm.plant(COLHEITA_A)
            else:
                farm.water()

            # 2. ROTAS PERSONALIZADAS POR DRONE
            if DRONE_ID == 1:
                # Claudio: Varredura sequencial da esquerda para direita
                if pos_x < LARGURA - 1:
                    world.move("EAST")
                elif pos_y < ALTURA - 1:
                    world.move("SOUTH")
                    for retorno in range(0, LARGURA - 1, 1):
                        world.move("WEST")
            
            elif DRONE_ID == 2:
                # Gepeto: Varredura em zigue-zague
                if y % 2 == 0:
                    if pos_x < LARGURA - 1:
                        world.move("EAST")
                    elif pos_y < ALTURA - 1:
                        world.move("SOUTH")
                else:
                    if pos_x > 0:
                        world.move("WEST")
                    elif pos_y < ALTURA - 1:
                        world.move("SOUTH")

            elif DRONE_ID == 3:
                # Gemilson: Varredura continua com contorno
                if world.can_move("EAST"):
                    world.move("EAST")
                elif world.can_move("SOUTH"):
                    world.move("SOUTH")
                else:
                    world.move("NORTH")

            passo_atual = passo_atual + 1

    if passo_atual >= TOTAL_TILES or not (passo_atual != TOTAL_TILES):
        print("Varredura finalizada!")
        executando = False
`
  },
  {
    path: 'main.py',
    name: 'main.py',
    language: 'python',
    isEntrypoint: false,
    content: `# ============================================================
# TERRA SCRIPT 3D - SCRIPT PRINCIPAL (PYTHON)
# ============================================================
# TAREFA INICIAL:
# 1. Colha a Fibra Selvagem no terreno chamando farm.harvest().
# 2. Clique no botão de Play na barra superior para executar.
# 3. Junte Fibras para desbloquear Tecnologias na aba 'Pesquisa'.

farm.harvest()
world.move("EAST")
`
  },
  {
    path: 'main.js',
    name: 'main.js',
    language: 'javascript',
    content: `// ============================================================
// TERRA SCRIPT 3D - SCRIPT PRINCIPAL (JAVASCRIPT)
// ============================================================
// TAREFA INICIAL:
// 1. Colha a Fibra Selvagem no terreno chamando farm.harvest().
// 2. Clique no botão de Play (Play) na barra superior para executar.
// 3. Junte 20 Fibras para desbloquear sua 1a Tecnologia
//    na aba 'Pesquisa' (ex: Expansão de Terreno 1x3 ou Variáveis).
//
// DICA: A cada ciclo, o script é executado do início ao fim do arquivo!

farm.harvest();
world.move("EAST");
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
