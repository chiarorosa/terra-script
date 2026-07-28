// Gerenciador de Efeitos Sonoros e Música de Fundo Procedural via Web Audio API
// Desenvolvido para TerraScript 3D v1.5

class AudioManager {
  private ctx: AudioContext | null = null;
  private isSfxMuted: boolean = false;
  private isBgmMuted: boolean = false;
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
    this.isBgmMuted = localStorage.getItem('terrascript_bgm_muted') === 'true';
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
    return this.isBgmMuted;
  }

  public setBgmMuted(muted: boolean) {
    this.isBgmMuted = muted;
    localStorage.setItem('terrascript_bgm_muted', String(muted));
    if (muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
  }

  public toggleSfx(): boolean {
    this.setSfxMuted(!this.isSfxMuted);
    return this.isSfxMuted;
  }

  public toggleBgm(): boolean {
    this.setBgmMuted(!this.isBgmMuted);
    return this.isBgmMuted;
  }

  // --- EFEITOS SONOROS (SFX) ---

  public playClick() {
    if (this.isSfxMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
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

    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
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

    gain.gain.setValueAtTime(0.12, now);
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

      gain.gain.setValueAtTime(0.1, now + idx * 0.05);
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

      gain.gain.setValueAtTime(0.1, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.25);
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

    gain.gain.setValueAtTime(0.08, now);
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

      gain.gain.setValueAtTime(0.08, now + idx * 0.06);
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

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  // --- MÚSICA DE FUNDO PROCEDURAL (LO-FI IMERSIVO) ---

  private vinylNoiseNode: AudioBufferSourceNode | null = null;
  private vinylGainNode: GainNode | null = null;

  // Progressão de acordes Lo-Fi exclusiva de TerraScript 3D (Cmaj7 -> Am7 -> Fmaj7 -> G7)
  private chordProgression = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7 (Dó4, Mi4, Sol4, Si4)
    [220.00, 261.63, 329.63, 392.00], // Am7 (Lá3, Dó4, Mi4, Sol4)
    [174.61, 220.00, 261.63, 329.63], // Fmaj7 (Fá3, Lá3, Dó4, Mi4)
    [196.00, 246.94, 293.66, 349.23], // G7 (Sol3, Si3, Ré4, Fá4)
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
      // Subtle background noise level
      this.vinylGainNode.gain.setValueAtTime(0.012, this.ctx.currentTime);

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

  public startBGM() {
    if (this.isBgmMuted || this.isBgmPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isBgmPlaying = true;
    this.startVinylCrackle();

    // Measure loop running every bar (approx 3.2 seconds per chord measure)
    const playMeasure = () => {
      if (!this.isBgmPlaying || this.isBgmMuted || !this.ctx) return;

      const now = this.ctx.currentTime;
      const currentChord = this.chordProgression[this.currentChordIndex % this.chordProgression.length];
      this.currentChordIndex++;

      // 1. Play Soft Warm Rhodes Chord (Sine + Triangle blend with lowpass)
      currentChord.forEach((freq, i) => {
        const oscSine = this.ctx!.createOscillator();
        const oscTri = this.ctx!.createOscillator();
        const chordGain = this.ctx!.createGain();
        const chordFilter = this.ctx!.createBiquadFilter();

        oscSine.type = 'sine';
        oscTri.type = 'triangle';
        oscSine.frequency.setValueAtTime(freq, now + i * 0.03); // micro strum delay
        oscTri.frequency.setValueAtTime(freq, now + i * 0.03);

        chordFilter.type = 'lowpass';
        chordFilter.frequency.setValueAtTime(650, now); // Warm lowpass for lo-fi feel

        // Soft swell envelope
        chordGain.gain.setValueAtTime(0.0001, now + i * 0.03);
        chordGain.gain.linearRampToValueAtTime(0.022, now + i * 0.03 + 0.3);
        chordGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.1);

        oscSine.connect(chordFilter);
        oscTri.connect(chordFilter);
        chordFilter.connect(chordGain);
        chordGain.connect(this.ctx!.destination);

        oscSine.start(now + i * 0.03);
        oscTri.start(now + i * 0.03);
        oscSine.stop(now + 3.1);
        oscTri.stop(now + 3.1);
      });

      // 2. Play Sub-Bass Note (root frequency halved)
      const rootFreq = currentChord[0] / 2;
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();

      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(rootFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(200, now);

      bassGain.gain.setValueAtTime(0.0001, now);
      bassGain.gain.linearRampToValueAtTime(0.04, now + 0.15);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + 2.8);

      // 3. Play Random Pentatonic Melodic Leads over the measure (2 to 3 gentle notes)
      const numMelodyNotes = Math.floor(Math.random() * 3) + 1;
      for (let m = 0; m < numMelodyNotes; m++) {
        const offset = Math.random() * 2.2 + 0.4; // scatter through the measure
        const noteFreq = currentChord[Math.floor(Math.random() * currentChord.length)] * 2; // octave up

        const melOsc = this.ctx.createOscillator();
        const melGain = this.ctx.createGain();
        const melFilter = this.ctx.createBiquadFilter();

        melOsc.type = 'sine';
        melOsc.frequency.setValueAtTime(noteFreq, now + offset);

        melFilter.type = 'lowpass';
        melFilter.frequency.setValueAtTime(1400, now + offset);

        melGain.gain.setValueAtTime(0.0001, now + offset);
        melGain.gain.linearRampToValueAtTime(0.018, now + offset + 0.08);
        melGain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 0.9);

        melOsc.connect(melFilter);
        melFilter.connect(melGain);
        melGain.connect(this.ctx.destination);

        melOsc.start(now + offset);
        melOsc.stop(now + offset + 0.9);
      }

      // Schedule next measure (3.2s = ~75 BPM)
      this.bgmIntervalId = window.setTimeout(playMeasure, 3100);
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
