// Gerenciador de Efeitos Sonoros e Música de Fundo Procedural via Web Audio API
// Desenvolvido para TerraScript 3D v1.5

class AudioManager {
  private ctx: AudioContext | null = null;
  private isSfxMuted: boolean = false;
  private isBgmMuted: boolean = false;
  private bgmVolume: number = 1.0; // 1.0 = 100%, 0.5 = 50%, 0.0 = Muted
  private isBgmPlaying: boolean = false;
  private bgmIntervalId: number | null = null;
  private currentNoteIndex: number = 0;

  // Frequências da Escala Pentatônica de Dó Maior / Sol Maior para BGM de fazenda lo-fi
  private bgmNotes = [
    261.63, // C4
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
  ];

  constructor() {
    this.isSfxMuted = localStorage.getItem('terrascript_sfx_muted') === 'true';
    const storedVol = localStorage.getItem('terrascript_bgm_volume');
    if (storedVol !== null) {
      const parsed = parseFloat(storedVol);
      this.bgmVolume = isNaN(parsed) ? 1.0 : parsed;
    } else {
      this.bgmVolume = localStorage.getItem('terrascript_bgm_muted') === 'true' ? 0.0 : 1.0;
    }
    this.isBgmMuted = this.bgmVolume === 0;
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Mute Getters & Setters
  public getSfxMuted(): boolean {
    return this.isSfxMuted;
  }

  public setSfxMuted(muted: boolean) {
    this.isSfxMuted = muted;
    localStorage.setItem('terrascript_sfx_muted', String(muted));
  }

  public getBgmMuted(): boolean {
    return this.bgmVolume === 0;
  }

  public getBgmVolume(): number {
    return this.bgmVolume;
  }

  public setBgmVolume(vol: number) {
    this.bgmVolume = vol;
    this.isBgmMuted = vol === 0;
    localStorage.setItem('terrascript_bgm_volume', String(vol));
    localStorage.setItem('terrascript_bgm_muted', String(vol === 0));

    if (vol === 0) {
      this.stopBGM();
    } else if (!this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public cycleBgmVolume(): number {
    if (this.bgmVolume === 1.0) {
      this.setBgmVolume(0.5);
    } else if (this.bgmVolume === 0.5) {
      this.setBgmVolume(0.0);
    } else {
      this.setBgmVolume(1.0);
    }
    return this.bgmVolume;
  }

  public setBgmMuted(muted: boolean) {
    this.setBgmVolume(muted ? 0.0 : 1.0);
  }

  public toggleSfx(): boolean {
    this.setSfxMuted(!this.isSfxMuted);
    return this.isSfxMuted;
  }

  public toggleBgm(): boolean {
    this.cycleBgmVolume();
    return this.isBgmMuted;
  }

  // --- EFEITOS SONOROS (SFX) ---
  // Volume sutil e reduzido para efeitos agradáveis e suaves

  public playClick() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  public playMove() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  public playPlant() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playHarvest() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Dual pitch chime for joyful harvest
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.06, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.18);
    });
  }

  public playResearch() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);

      gain.gain.setValueAtTime(0.06, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.25);
    });
  }

  public playLevelUp() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.07, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.25);
    });
  }

  public playExecute() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playSuccess() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      gain.gain.setValueAtTime(0.05, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  public playError() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(100, now + 0.2);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- MÚSICA DE FUNDO PROCEDURAL (TEMA OFICIAL TERRASCRIPT 100% ORIGINAL & SEM ESTALOS) ---

  private sharedNoiseBuffer: AudioBuffer | null = null;
  private masterBgmGain: GainNode | null = null;
  private masterBgmFilter: BiquadFilterNode | null = null;

  private getOrCreateNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    if (!this.sharedNoiseBuffer) {
      const sampleRate = this.ctx.sampleRate;
      const bufferSize = sampleRate * 1.0; // 1 segundo de ruído rosa/branco pré-gerado
      this.sharedNoiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const data = this.sharedNoiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.5;
      }
    }
    return this.sharedNoiseBuffer;
  }

  private getBgmDestination(): AudioNode {
    if (!this.ctx) throw new Error("AudioContext não inicializado");
    if (!this.masterBgmGain) {
      this.masterBgmGain = this.ctx.createGain();
      this.masterBgmGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

      // Filtro Lowpass Global para suavizar todas as frequências e eliminar qualquer aspereza
      this.masterBgmFilter = this.ctx.createBiquadFilter();
      this.masterBgmFilter.type = 'lowpass';
      this.masterBgmFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      this.masterBgmFilter.Q.setValueAtTime(0.7, this.ctx.currentTime);

      this.masterBgmFilter.connect(this.masterBgmGain);
      this.masterBgmGain.connect(this.ctx.destination);
    }
    return this.masterBgmFilter;
  }

  // Toca uma nota melódica principal (Melodia Flautada 16-bit Aconchegante) SEM ESTALOS
  private playTerraLeadNote(freq: number, startTime: number, duration: number, vol: number = 0.032) {
    if (!this.ctx || this.isBgmMuted || this.bgmVolume === 0) return;
    
    const targetNode = this.getBgmDestination();
    const oscSine = this.ctx.createOscillator();
    const oscTri = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    oscSine.type = 'sine';
    oscTri.type = 'triangle';

    oscSine.frequency.setValueAtTime(freq, startTime);
    oscTri.frequency.setValueAtTime(freq, startTime);

    const attack = 0.015;  // 15ms de ramp up suave para eliminar clique inicial
    const release = 0.035; // 35ms de ramp down suave para eliminar clique final
    const endTime = startTime + duration;
    const targetVol = vol * this.bgmVolume;

    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(targetVol, startTime + attack);
    noteGain.gain.setValueAtTime(targetVol, Math.max(startTime + attack, endTime - release));
    noteGain.gain.linearRampToValueAtTime(0, endTime);

    oscSine.connect(noteGain);
    oscTri.connect(noteGain);
    noteGain.connect(targetNode);

    oscSine.start(startTime);
    oscTri.start(startTime);

    oscSine.stop(endTime + 0.02);
    oscTri.stop(endTime + 0.02);
  }

  // Toca uma nota de baixo aveludado (NES/SNES Bass) SEM ESTALOS
  private playTerraBassNote(freq: number, startTime: number, duration: number, vol: number = 0.038) {
    if (!this.ctx || this.isBgmMuted || this.bgmVolume === 0) return;

    const targetNode = this.getBgmDestination();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    const attack = 0.012;
    const release = 0.04;
    const endTime = startTime + duration;
    const targetVol = vol * this.bgmVolume;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(targetVol, startTime + attack);
    gain.gain.setValueAtTime(targetVol, Math.max(startTime + attack, endTime - release));
    gain.gain.linearRampToValueAtTime(0, endTime);

    osc.connect(gain);
    gain.connect(targetNode);

    osc.start(startTime);
    osc.stop(endTime + 0.02);
  }

  // Percussão Suave (Hi-Hat / Snare Chiptune) usando buffer reutilizado e envelope de ganho suave
  private playTerraPercussion(startTime: number, isSnare: boolean = false, vol: number = 0.010) {
    if (!this.ctx || this.isBgmMuted || this.bgmVolume === 0) return;

    const noiseBuffer = this.getOrCreateNoiseBuffer();
    if (!noiseBuffer) return;

    const targetNode = this.getBgmDestination();
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = isSnare ? 'bandpass' : 'highpass';
    filter.frequency.setValueAtTime(isSnare ? 1800 : 5500, startTime);

    const gain = this.ctx.createGain();
    const duration = isSnare ? 0.06 : 0.025;
    const attack = 0.004;
    const endTime = startTime + duration;
    const targetVol = vol * this.bgmVolume;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(targetVol, startTime + attack);
    gain.gain.linearRampToValueAtTime(0, endTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(targetNode);

    noise.start(startTime);
    noise.stop(endTime + 0.01);
  }

  // Melodia do Tema Original "TerraScript: Vale da Automação" (4 Compassos Cativantes)
  private terraTheme = [
    // Compasso 1 (Dó Maior - "Vale dos Brotos")
    {
      melody: [
        { time: 0.00, freq: 523.25, dur: 0.20 }, // C5
        { time: 0.25, freq: 659.25, dur: 0.20 }, // E5
        { time: 0.50, freq: 783.99, dur: 0.32 }, // G5
        { time: 0.90, freq: 698.46, dur: 0.18 }, // F5
        { time: 1.15, freq: 659.25, dur: 0.18 }, // E5
        { time: 1.40, freq: 587.33, dur: 0.32 }, // D5
      ],
      bass: [
        { time: 0.00, freq: 130.81, dur: 0.22 }, // C3
        { time: 0.45, freq: 164.81, dur: 0.22 }, // E3
        { time: 0.90, freq: 196.00, dur: 0.22 }, // G3
        { time: 1.35, freq: 164.81, dur: 0.22 }, // E3
      ]
    },
    // Compasso 2 (Lá Menor - "Linhas de Código")
    {
      melody: [
        { time: 0.00, freq: 523.25, dur: 0.20 }, // C5
        { time: 0.25, freq: 659.25, dur: 0.20 }, // E5
        { time: 0.50, freq: 880.00, dur: 0.35 }, // A5 (Clímax Inspirador)
        { time: 0.90, freq: 783.99, dur: 0.18 }, // G5
        { time: 1.15, freq: 659.25, dur: 0.18 }, // E5
        { time: 1.40, freq: 523.25, dur: 0.32 }, // C5
      ],
      bass: [
        { time: 0.00, freq: 110.00, dur: 0.22 }, // A2
        { time: 0.45, freq: 130.81, dur: 0.22 }, // C3
        { time: 0.90, freq: 164.81, dur: 0.22 }, // E3
        { time: 1.35, freq: 130.81, dur: 0.22 }, // C3
      ]
    },
    // Compasso 3 (Fá Maior - "Colheita Automatizada")
    {
      melody: [
        { time: 0.00, freq: 698.46, dur: 0.20 }, // F5
        { time: 0.25, freq: 880.00, dur: 0.20 }, // A5
        { time: 0.50, freq: 783.99, dur: 0.22 }, // G5
        { time: 0.80, freq: 698.46, dur: 0.22 }, // F5
        { time: 1.10, freq: 659.25, dur: 0.22 }, // E5
        { time: 1.40, freq: 587.33, dur: 0.32 }, // D5
      ],
      bass: [
        { time: 0.00, freq: 87.31,  dur: 0.22 }, // F2
        { time: 0.45, freq: 110.00, dur: 0.22 }, // A2
        { time: 0.90, freq: 130.81, dur: 0.22 }, // C3
        { time: 1.35, freq: 110.00, dur: 0.22 }, // A2
      ]
    },
    // Compasso 4 (Sol Maior - "Horizonte Verde")
    {
      melody: [
        { time: 0.00, freq: 587.33, dur: 0.18 }, // D5
        { time: 0.25, freq: 739.99, dur: 0.18 }, // F#5
        { time: 0.50, freq: 783.99, dur: 0.30 }, // G5
        { time: 0.90, freq: 987.77, dur: 0.22 }, // B5
        { time: 1.20, freq: 1046.50, dur: 0.50 }, // C6 (Resolução Brilhante e Aconchegante)
      ],
      bass: [
        { time: 0.00, freq: 98.00,  dur: 0.22 }, // G2
        { time: 0.45, freq: 123.47, dur: 0.22 }, // B2
        { time: 0.90, freq: 146.83, dur: 0.22 }, // D3
        { time: 1.35, freq: 98.00,  dur: 0.22 }, // G2
      ]
    }
  ];

  private currentChordIndex = 0;

  public startBGM() {
    if (this.isBgmMuted || this.bgmVolume === 0 || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;

    // Loop de reprodução a cada medida (~1.8s por compasso = ~107 BPM Tempo Relaxante)
    const playMeasure = () => {
      if (!this.isBgmPlaying || this.isBgmMuted || this.bgmVolume === 0 || !this.ctx) return;

      const now = this.ctx.currentTime;
      const measureIndex = this.currentChordIndex % this.terraTheme.length;
      const currentMeasure = this.terraTheme[measureIndex];
      this.currentChordIndex++;

      // 1. Melodia Líder Flautada 16-bit
      currentMeasure.melody.forEach((note) => {
        this.playTerraLeadNote(note.freq, now + note.time, note.dur, 0.035);
      });

      // 2. Linha de Baixo Aconchegante
      currentMeasure.bass.forEach((note) => {
        this.playTerraBassNote(note.freq, now + note.time, note.dur, 0.040);
      });

      // 3. Batida de Bateria Leve e Sem Estalos (Hi-Hat / Snare)
      const hatStep = 0.225;
      for (let h = 0; h < 8; h++) {
        const hTime = now + h * hatStep;
        const isSnare = (h === 2 || h === 6);
        this.playTerraPercussion(hTime, isSnare, isSnare ? 0.018 : 0.008);
      }

      // Agenda o próximo compasso em exatamente 1.8s
      this.bgmIntervalId = window.setTimeout(playMeasure, 1780);
    };

    playMeasure();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmIntervalId !== null) {
      clearTimeout(this.bgmIntervalId);
      this.bgmIntervalId = null;
    }
  }

  public toggleAudioOnUserGesture() {
    this.initCtx();
    if (!this.isBgmMuted && !this.isBgmPlaying) {
      this.startBGM();
    }
  }
}

export const audioManager = new AudioManager();
