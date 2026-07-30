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

    if (this.vinylGainNode && this.ctx) {
      this.vinylGainNode.gain.setValueAtTime(0.012 * vol, this.ctx.currentTime);
    }

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

  // --- MÚSICA DE FUNDO PROCEDURAL (LO-FI TEMA OFICIAL TERRASCRIPT) ---

  private vinylNoiseNode: AudioBufferSourceNode | null = null;
  private vinylGainNode: GainNode | null = null;

  // Acordes da Progressão Emblemática (Cmaj9 -> Am9 -> Fmaj7 -> G11)
  private chordProgression = [
    [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9 (Dó4, Mi4, Sol4, Si4, Ré5)
    [220.00, 261.63, 329.63, 392.00, 523.25], // Am9 (Lá3, Dó4, Mi4, Sol4, Dó5)
    [174.61, 220.00, 261.63, 329.63, 523.25], // Fmaj7 (Fá3, Lá3, Dó4, Mi4, Dó5)
    [196.00, 246.94, 293.66, 349.23, 523.25], // G11 (Sol3, Si3, Ré4, Fá4, Dó5)
  ];

  // Melodia Marcante e Inconfundível do TerraScript (Tema do Claudio)
  // Cada medida possui notas com tempos offset e frequências
  private themeMelody = [
    // Medida 1 (Cmaj9) - Gancho Inicial
    [
      { time: 0.00, freq: 659.25, duration: 0.35, vol: 0.025 }, // E5
      { time: 0.38, freq: 783.99, duration: 0.30, vol: 0.028 }, // G5
      { time: 0.75, freq: 659.25, duration: 0.30, vol: 0.025 }, // E5
      { time: 1.12, freq: 523.25, duration: 0.40, vol: 0.022 }, // C5
      { time: 1.65, freq: 587.33, duration: 0.25, vol: 0.020 }, // D5
      { time: 2.00, freq: 659.25, duration: 0.65, vol: 0.030 }, // E5 (Sustentado)
    ],
    // Medida 2 (Am9) - Resposta
    [
      { time: 0.00, freq: 523.25, duration: 0.35, vol: 0.025 }, // C5
      { time: 0.38, freq: 440.00, duration: 0.35, vol: 0.022 }, // A4
      { time: 0.75, freq: 523.25, duration: 0.35, vol: 0.025 }, // C5
      { time: 1.12, freq: 587.33, duration: 0.35, vol: 0.025 }, // D5
      { time: 1.65, freq: 493.88, duration: 0.70, vol: 0.028 }, // B4 (Pausa dramática)
    ],
    // Medida 3 (Fmaj7) - Crescendo
    [
      { time: 0.00, freq: 440.00, duration: 0.35, vol: 0.022 }, // A4
      { time: 0.38, freq: 523.25, duration: 0.35, vol: 0.025 }, // C5
      { time: 0.75, freq: 659.25, duration: 0.35, vol: 0.028 }, // E5
      { time: 1.12, freq: 783.99, duration: 0.45, vol: 0.032 }, // G5
      { time: 1.65, freq: 698.46, duration: 0.35, vol: 0.026 }, // F5
      { time: 2.10, freq: 659.25, duration: 0.50, vol: 0.028 }, // E5
    ],
    // Medida 4 (G11) - Resolução Clássica
    [
      { time: 0.00, freq: 659.25, duration: 0.35, vol: 0.028 }, // E5
      { time: 0.38, freq: 587.33, duration: 0.35, vol: 0.025 }, // D5
      { time: 0.75, freq: 523.25, duration: 0.45, vol: 0.028 }, // C5
      { time: 1.30, freq: 587.33, duration: 0.30, vol: 0.024 }, // D5
      { time: 1.70, freq: 523.25, duration: 1.00, vol: 0.035 }, // C5 (Resolução Final em Dó)
    ]
  ];

  private currentChordIndex = 0;

  // Gera o buffer sintético de textura vinil/chuva suave
  private createVinylNoiseBuffer(): AudioBuffer | null {
    if (!this.ctx) return null;
    const bufferSize = this.ctx.sampleRate * 3; // Ruído em loop de 3 segundos
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      // Ruído de fundo marrom/rosa para chiado suave
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];

      // Estalidos sutis de vinil
      if (Math.random() < 0.00015) {
        data[i] += (Math.random() - 0.5) * 0.4;
      }
    }
    return buffer;
  }

  private startVinylCrackle() {
    if (!this.ctx || this.vinylNoiseNode) return;
    try {
      const buffer = this.createVinylNoiseBuffer();
      if (!buffer) return;

      this.vinylNoiseNode = this.ctx.createBufferSource();
      this.vinylNoiseNode.buffer = buffer;
      this.vinylNoiseNode.loop = true;

      // Filter to keep noise warm and low-frequency
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1000, this.ctx.currentTime);
      filter.Q.setValueAtTime(0.8, this.ctx.currentTime);

      this.vinylGainNode = this.ctx.createGain();
      // Subtle background noise level scaled by bgmVolume
      this.vinylGainNode.gain.setValueAtTime(0.012 * this.bgmVolume, this.ctx.currentTime);

      this.vinylNoiseNode.connect(filter);
      filter.connect(this.vinylGainNode);
      this.vinylGainNode.connect(this.ctx.destination);

      this.vinylNoiseNode.start();
    } catch (err) {
      console.warn('Could not start vinyl noise background:', err);
    }
  }

  private stopVinylCrackle() {
    if (this.vinylNoiseNode) {
      try {
        this.vinylNoiseNode.stop();
        this.vinylNoiseNode.disconnect();
      } catch (e) {}
      this.vinylNoiseNode = null;
    }
    this.vinylGainNode = null;
  }

  // Tocador de Kick Drum Lo-Fi
  private playLoFiKick(now: number) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.12);

    gain.gain.setValueAtTime(0.18 * this.bgmVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  // Tocador de Snare / Rimshot Lo-Fi
  private playLoFiSnare(now: number) {
    if (!this.ctx) return;
    // Tone component
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);
    oscGain.gain.setValueAtTime(0.08 * this.bgmVolume, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    // Noise component
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06 * this.bgmVolume, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(oscGain);
    oscGain.connect(this.ctx.destination);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
    noise.start(now);
    noise.stop(now + 0.1);
  }

  // Tocador de Hi-Hat Lo-Fi
  private playLoFiHiHat(now: number, vol: number = 0.02) {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(7000, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol * this.bgmVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
    noise.stop(now + 0.035);
  }

  public startBGM() {
    if (this.isBgmMuted || this.bgmVolume === 0 || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.startVinylCrackle();

    // Loop de reprodução a cada medida (~3.0 segundos por compasso = ~80 BPM)
    const playMeasure = () => {
      if (!this.isBgmPlaying || this.isBgmMuted || this.bgmVolume === 0 || !this.ctx) return;

      const now = this.ctx.currentTime;
      const measureIndex = this.currentChordIndex % this.chordProgression.length;
      const currentChord = this.chordProgression[measureIndex];
      const currentMelody = this.themeMelody[measureIndex];
      this.currentChordIndex++;

      // 1. Acordes Teclado Rhodes / Wurlitzer Quente (Símbolo do Tema)
      currentChord.forEach((freq, i) => {
        const oscSine = this.ctx!.createOscillator();
        const oscTri = this.ctx!.createOscillator();
        const chordGain = this.ctx!.createGain();
        const chordFilter = this.ctx!.createBiquadFilter();

        oscSine.type = 'sine';
        oscTri.type = 'triangle';

        // Detune e vibrato sutil para sensação de fita cassete / vinil
        const detuneAmt = (Math.random() - 0.5) * 8;
        oscSine.detune.setValueAtTime(detuneAmt, now);
        oscTri.detune.setValueAtTime(detuneAmt, now);

        const strumDelay = i * 0.04;
        oscSine.frequency.setValueAtTime(freq, now + strumDelay);
        oscTri.frequency.setValueAtTime(freq, now + strumDelay);

        chordFilter.type = 'lowpass';
        chordFilter.frequency.setValueAtTime(750, now);

        chordGain.gain.setValueAtTime(0.0001, now + strumDelay);
        chordGain.gain.linearRampToValueAtTime(0.024 * this.bgmVolume, now + strumDelay + 0.25);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.9);

        oscSine.connect(chordFilter);
        oscTri.connect(chordFilter);
        chordFilter.connect(chordGain);
        chordGain.connect(this.ctx!.destination);

        oscSine.start(now + strumDelay);
        oscTri.start(now + strumDelay);
        oscSine.stop(now + 2.9);
        oscTri.stop(now + 2.9);
      });

      // 2. Sub-Baixo Profundo (Walking Bass)
      const rootFreq = currentChord[0] / 2;
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(rootFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(220, now);

      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.045 * this.bgmVolume, now + 0.12);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + 2.8);

      // 3. Batida de Bateria Lo-Fi Hip Hop (Kick, Snare, Hi-Hats)
      // Kick no beat 1 (0.0s) e beat 3.5 (2.25s)
      this.playLoFiKick(now);
      this.playLoFiKick(now + 2.25);

      // Snare no beat 2 (0.75s) e beat 4 (2.25s)
      this.playLoFiSnare(now + 0.75);
      this.playLoFiSnare(now + 2.25);

      // Hi-hats em colcheias (a cada 0.375s)
      for (let h = 0; h < 8; h++) {
        const hatTime = now + h * 0.375;
        const vol = h % 2 === 0 ? 0.022 : 0.012; // Swing de acentos
        this.playLoFiHiHat(hatTime, vol);
      }

      // 4. Melodia Líder Inconfundível ("Tema de TerraScript")
      currentMelody.forEach((note) => {
        const melOsc = this.ctx!.createOscillator();
        const melGain = this.ctx!.createGain();
        const melFilter = this.ctx!.createBiquadFilter();

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(note.freq, now + note.time);

        // Vibrato leve para calor de sintonia
        melOsc.detune.setValueAtTime(3, now + note.time);
        melOsc.detune.linearRampToValueAtTime(-3, now + note.time + note.duration);

        melFilter.type = 'lowpass';
        melFilter.frequency.setValueAtTime(1600, now + note.time);

        melGain.gain.setValueAtTime(0.0001, now + note.time);
        melGain.gain.linearRampToValueAtTime(note.vol * this.bgmVolume, now + note.time + 0.06);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

        melOsc.connect(melFilter);
        melFilter.connect(melGain);
        melGain.connect(this.ctx!.destination);

        melOsc.start(now + note.time);
        melOsc.stop(now + note.time + note.duration);
      });

      // Agenda o próximo compasso (3.0s = exatamente 80 BPM)
      this.bgmIntervalId = window.setTimeout(playMeasure, 2950);
    };

    playMeasure();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    this.stopVinylCrackle();
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
