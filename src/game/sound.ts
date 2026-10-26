// Procedural Web Audio Synthesizer with pitch variation (±8%), concurrency guard, and Mute toggle

class SoundManager {
  private ctx: AudioContext | null = null;
  public muted = false;
  public masterVolume = 0.85;
  public musicVolume = 0.65;
  public sfxVolume = 0.85;
  private lastSoundTime = 0;

  // Procedural 136 BPM Cyber-Metal / Industrial Breakbeat Engine
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicFilter: BiquadFilterNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private isMusicPlaying = false;
  private musicTimerId: ReturnType<typeof setInterval> | null = null;
  private currentStep = 0;
  private nextStepTime = 0;
  private musicIntensity = 1;
  private isTimeStopped = false;

  private getEffectiveMusicGain(): number {
    if (this.muted) return 0;
    return 0.2 * this.masterVolume * this.musicVolume;
  }

  private getEffectiveSfxGain(): number {
    if (this.muted) return 0;
    return this.masterVolume * this.sfxVolume;
  }

  public setVolumes(master: number, music: number, sfx: number): void {
    this.masterVolume = Math.max(0, Math.min(1, master));
    this.musicVolume = Math.max(0, Math.min(1, music));
    this.sfxVolume = Math.max(0, Math.min(1, sfx));
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(this.getEffectiveMusicGain(), now, 0.04);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(this.getEffectiveSfxGain(), now, 0.04);
      }
    }
  }

  private getSfxTarget(): AudioNode | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    return this.sfxGain ?? ctx.destination;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    if (this.ctx && !this.musicGain) {
      this.musicFilter = this.ctx.createBiquadFilter();
      this.musicFilter.type = 'lowpass';
      this.musicFilter.frequency.value = 14000;
      this.musicFilter.Q.value = 2.5;

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.getEffectiveMusicGain();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.getEffectiveSfxGain();
      this.sfxGain.connect(this.ctx.destination);

      this.musicFilter.connect(this.musicGain);
      this.musicGain.connect(this.ctx.destination);

      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }

    return this.ctx;
  }

  private pitchJitter(baseFreq: number): number {
    return baseFreq * (1 + (Math.random() * 0.16 - 0.08));
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.musicGain) {
        this.musicGain.gain.setTargetAtTime(this.getEffectiveMusicGain(), now, 0.05);
      }
      if (this.sfxGain) {
        this.sfxGain.gain.setTargetAtTime(this.getEffectiveSfxGain(), now, 0.05);
      }
    }
    return this.muted;
  }

  public startMusic(): void {
    const ctx = this.ensureContext();
    if (!ctx || this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.nextStepTime = ctx.currentTime + 0.05;

    const stepDuration = 60 / 136 / 4;

    this.musicTimerId = setInterval(() => {
      if (!this.ctx || !this.isMusicPlaying) return;
      while (this.nextStepTime < this.ctx.currentTime + 0.12) {
        this.scheduleStep(this.nextStepTime, this.currentStep);
        this.nextStepTime += stepDuration;
        this.currentStep = (this.currentStep + 1) % 64;
      }
    }, 25);
  }

  public stopMusic(): void {
    this.isMusicPlaying = false;
    if (this.musicTimerId) {
      clearInterval(this.musicTimerId);
      this.musicTimerId = null;
    }
  }

  public updateMusicState(intensity: number, isTimeStopped: boolean): void {
    this.musicIntensity = intensity;
    this.isTimeStopped = isTimeStopped;
    if (!this.ctx || !this.musicFilter) return;
    const now = this.ctx.currentTime;
    if (isTimeStopped) {
      this.musicFilter.frequency.setTargetAtTime(320, now, 0.06);
    } else {
      this.musicFilter.frequency.setTargetAtTime(14000, now, 0.08);
    }
  }

  private scheduleStep(time: number, step: number): void {
    if (!this.ctx || !this.musicFilter) return;

    const bar = Math.floor(step / 16) % 4;
    const stepInBar = step % 16;

    // 1. Kick Drum (4-on-the-floor on steps 0, 4, 8, 12)
    if (stepInBar === 0 || stepInBar === 4 || stepInBar === 8 || stepInBar === 12) {
      const kickOsc = this.ctx.createOscillator();
      const kickGain = this.ctx.createGain();
      kickOsc.connect(kickGain);
      kickGain.connect(this.musicFilter);
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(145, time);
      kickOsc.frequency.exponentialRampToValueAtTime(36, time + 0.08);
      kickGain.gain.setValueAtTime(0.36, time);
      kickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);
      kickOsc.start(time);
      kickOsc.stop(time + 0.09);
    }

    // 2. Snare / Industrial Clap (steps 4, 12)
    if ((stepInBar === 4 || stepInBar === 12) && this.noiseBuffer) {
      const snareNoise = this.ctx.createBufferSource();
      snareNoise.buffer = this.noiseBuffer;
      const snareFilter = this.ctx.createBiquadFilter();
      snareFilter.type = 'highpass';
      snareFilter.frequency.setValueAtTime(850, time);
      const snareGain = this.ctx.createGain();
      snareNoise.connect(snareFilter);
      snareFilter.connect(snareGain);
      snareGain.connect(this.musicFilter);

      snareGain.gain.setValueAtTime(0.16, time);
      snareGain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
      snareNoise.start(time);
      snareNoise.stop(time + 0.12);

      const snareTone = this.ctx.createOscillator();
      const toneGain = this.ctx.createGain();
      snareTone.connect(toneGain);
      toneGain.connect(this.musicFilter);
      snareTone.type = 'triangle';
      snareTone.frequency.setValueAtTime(185, time);
      snareTone.frequency.exponentialRampToValueAtTime(70, time + 0.08);
      toneGain.gain.setValueAtTime(0.18, time);
      toneGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      snareTone.start(time);
      snareTone.stop(time + 0.08);
    }

    // 3. Hi-Hat (8th notes or 16th notes when intensity >= 2)
    const playHat = this.musicIntensity >= 2 ? true : stepInBar % 2 === 0;
    if (playHat && this.noiseBuffer) {
      const hat = this.ctx.createBufferSource();
      hat.buffer = this.noiseBuffer;
      const hatFilter = this.ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(6800, time);
      const hatGain = this.ctx.createGain();
      hat.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(this.musicFilter);

      const isAccent = stepInBar === 2 || stepInBar === 6 || stepInBar === 10 || stepInBar === 14;
      hatGain.gain.setValueAtTime(isAccent ? 0.08 : 0.04, time);
      hatGain.gain.exponentialRampToValueAtTime(0.001, time + 0.04);
      hat.start(time);
      hat.stop(time + 0.04);
    }

    // 4. Heavy Cyberpunk Synth Bassline
    const bassFreqs = [
      [73.4, 73.4, 146.8, 73.4, 73.4, 146.8, 73.4, 110.0],
      [87.3, 87.3, 174.6, 87.3, 87.3, 174.6, 87.3, 130.8],
      [98.0, 98.0, 196.0, 98.0, 98.0, 196.0, 98.0, 146.8],
      [116.5, 116.5, 110.0, 110.0, 116.5, 116.5, 110.0, 73.4],
    ];
    const barNotes = bassFreqs[bar] || bassFreqs[0];
    const bassNote = barNotes[stepInBar % barNotes.length];

    if (bassNote && stepInBar % 2 === 0) {
      const bassOsc = this.ctx.createOscillator();
      const bassGain = this.ctx.createGain();
      const bassFilter = this.ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(this.musicIntensity >= 2 ? 1500 : 850, time);
      bassFilter.frequency.exponentialRampToValueAtTime(300, time + 0.14);
      bassFilter.Q.value = 3.5;

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicFilter);

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassNote, time);
      bassGain.gain.setValueAtTime(0.22, time);
      bassGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
      bassOsc.start(time);
      bassOsc.stop(time + 0.15);
    }

    // 5. Blistering Lead Arpeggiator (Intensity >= 2: Style Rank S+ or Boss Fight)
    if (this.musicIntensity >= 2) {
      const arpNotes = [
        293.7, 349.2, 440.0, 587.3, 523.3, 440.0, 349.2, 392.0,
        440.0, 523.3, 587.3, 698.5, 659.3, 587.3, 523.3, 440.0,
      ];
      const noteFreq = arpNotes[stepInBar];
      const leadOsc = this.ctx.createOscillator();
      const leadGain = this.ctx.createGain();
      leadOsc.connect(leadGain);
      leadGain.connect(this.musicFilter);

      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(noteFreq, time);
      leadGain.gain.setValueAtTime(0.08, time);
      leadGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
      leadOsc.start(time);
      leadOsc.stop(time + 0.08);
    }
  }

  public playShoot(weaponId: string): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);

    if (weaponId === 'slingshot') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.pitchJitter(340), now);
      osc.frequency.exponentialRampToValueAtTime(115, now + 0.09);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (weaponId === 'shotgun') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(this.pitchJitter(175), now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.17);
      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.17);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (weaponId === 'nailgun') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(this.pitchJitter(540), now);
      osc.frequency.exponentialRampToValueAtTime(195, now + 0.06);
      gain.gain.setValueAtTime(0.11, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (weaponId === 'acid') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(this.pitchJitter(240), now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.13);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc.start(now);
      osc.stop(now + 0.14);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(this.pitchJitter(780), now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    }
  }

  public playHit(heavy: boolean, blockedByShield = false): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (now - this.lastSoundTime < 0.018) return;
    this.lastSoundTime = now;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);

    if (blockedByShield) {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(this.pitchJitter(680), now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.07);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.start(now);
      osc.stop(now + 0.07);
      return;
    }

    osc.type = heavy ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(this.pitchJitter(heavy ? 145 : 220), now);
    osc.frequency.exponentialRampToValueAtTime(52, now + (heavy ? 0.12 : 0.07));
    gain.gain.setValueAtTime(heavy ? 0.19 : 0.11, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + (heavy ? 0.12 : 0.07));
    osc.start(now);
    osc.stop(now + (heavy ? 0.12 : 0.07));
  }

  public playParry(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [1046.5, 1567.98];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 1.15, now + 0.18);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.start(now);
      osc.stop(now + 0.18);
    });
  }

  public playDash(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(360, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.11);
    gain.gain.setValueAtTime(0.13, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playRankUp(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [587.33, 880, 1174.66];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      gain.gain.setValueAtTime(0.12, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.16);
      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.16);
    });
  }

  public playBossPhase(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const freqs = [92.5, 138.59, 185.0];
    freqs.forEach((f) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.linearRampToValueAtTime(f * 0.82, now + 0.48);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      osc.start(now);
      osc.stop(now + 0.48);
    });
  }

  public playExplosion(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(115, now);
    osc.frequency.exponentialRampToValueAtTime(26, now + 0.34);
    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playUltimateBell(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Deep Sub-Bass Acoustic Shockwave Boom
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.connect(subGain);
    subGain.connect(this.getSfxTarget() ?? ctx.destination);
    sub.type = 'sine';
    sub.frequency.setValueAtTime(190, now);
    sub.frequency.exponentialRampToValueAtTime(34, now + 0.55);
    subGain.gain.setValueAtTime(0.32, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.58);
    sub.start(now);
    sub.stop(now + 0.58);

    // 2. Ceremonial Cast-Bronze School Bell Harmonics + Rapid Clapper Strikes
    const bellHarmonics = [587.33, 880.0, 1174.66, 1760.0, 2349.32];
    bellHarmonics.forEach((f, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.985, now + 1.05);

      // Clapper tremolo modulation so you hear the brass bell rapidly ringing
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.setValueAtTime(18 + idx * 2, now);
      lfoGain.gain.setValueAtTime(0.06, now);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);

      const baseAmp = 0.16 / (1 + idx * 0.35);
      gain.gain.setValueAtTime(baseAmp, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.05);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 1.05);
      osc.stop(now + 1.05);
    });
  }

  public playTelegraph(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(this.pitchJitter(440), now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.22);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playPickup(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      gain.gain.setValueAtTime(0.12, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.09);
      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.09);
    });
  }

  public playBuild(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(330, now + 0.06);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  public playTurretShoot(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(this.pitchJitter(620), now);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playWoodImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(this.pitchJitter(160), now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.08);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  public playChronoTick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.035);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public playPlayerHurt(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(65, now + 0.22);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.start(now);
    osc.stop(now + 0.24);
  }

  public playBellOutcome(victory: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const chord = victory ? [523.25, 659.25, 783.99, 1046.5] : [311.13, 277.18, 233.08, 185.0];
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);
      osc.type = victory ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.15, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.35);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.35);
    });
  }

  // Authentic Soviet electric school bell (ringing at 26 Hz striker tremolo)
  public playSchoolBell(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const freqs = [1760.0, 2093.0, 2489.0];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(this.getSfxTarget() ?? ctx.destination);

      osc.type = i === 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Rapid mechanical striker modulation
      const mod = ctx.createOscillator();
      const modGain = ctx.createGain();
      mod.frequency.setValueAtTime(26, now);
      modGain.gain.setValueAtTime(0.4, now);
      mod.connect(modGain);
      modGain.connect(gain.gain);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.setValueAtTime(0.14, now + 0.85);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

      mod.start(now);
      osc.start(now);
      mod.stop(now + 1.25);
      osc.stop(now + 1.25);
    });
  }

  // Visceral teacher defeat crunch + chalk snap
  public playTeacherDeath(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(this.pitchJitter(210), now);
    osc.frequency.exponentialRampToValueAtTime(32, now + 0.18);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
    osc.start(now);
    osc.stop(now + 0.19);

    // Chalk snap click
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.connect(snapGain);
    snapGain.connect(this.getSfxTarget() ?? ctx.destination);
    snap.type = 'triangle';
    snap.frequency.setValueAtTime(1450, now);
    snap.frequency.exponentialRampToValueAtTime(350, now + 0.04);
    snapGain.gain.setValueAtTime(0.16, now);
    snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);
    snap.start(now);
    snap.stop(now + 0.045);
  }

  public playSandevistan(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Cyberpunk Neural Implant Activation Chord Flash (0.00s - 0.22s)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const sOsc = ctx.createOscillator();
      const sGain = ctx.createGain();
      sOsc.connect(sGain);
      sGain.connect(this.getSfxTarget() ?? ctx.destination);
      sOsc.type = 'sawtooth';
      sOsc.frequency.setValueAtTime(freq, now);
      sOsc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.2);
      sGain.gain.setValueAtTime(0.07 - i * 0.01, now);
      sGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      sOsc.start(now);
      sOsc.stop(now + 0.22);
    });

    // 3. Iconic JoJo Bass-Boosted Time-Stop Dubstep Warble Drop (0.12s - 0.92s)
    const sub = ctx.createOscillator();
    const subFilter = ctx.createBiquadFilter();
    const subGain = ctx.createGain();
    subFilter.type = 'lowpass';
    subFilter.Q.value = 8.5;
    subFilter.frequency.setValueAtTime(980, now + 0.12);
    subFilter.frequency.exponentialRampToValueAtTime(65, now + 0.88);

    sub.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(this.getSfxTarget() ?? ctx.destination);
    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(290, now + 0.12);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.88);
    subGain.gain.setValueAtTime(0.36, now + 0.12);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.92);
    sub.start(now + 0.12);
    sub.stop(now + 0.92);

    // 4. Slowing Mechanical Clock Ticks Grinding to a Halt (0.35s, 0.50s, 0.68s, 0.90s)
    const tickTimes = [0.35, 0.5, 0.68, 0.9];
    const tickFreqs = [1680, 1320, 980, 640];
    tickTimes.forEach((offset, idx) => {
      const tick = ctx.createOscillator();
      const tGain = ctx.createGain();
      tick.connect(tGain);
      tGain.connect(this.getSfxTarget() ?? ctx.destination);
      tick.type = 'triangle';
      tick.frequency.setValueAtTime(tickFreqs[idx], now + offset);
      tick.frequency.exponentialRampToValueAtTime(240, now + offset + 0.06);
      tGain.gain.setValueAtTime(0.22, now + offset);
      tGain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.065);
      tick.start(now + offset);
      tick.stop(now + offset + 0.065);
    });
  }

  public playTimeResume(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(this.getSfxTarget() ?? ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(45, now);
    osc.frequency.exponentialRampToValueAtTime(680, now + 0.38);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playNinjaExecute(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Anime Katana unsheath metallic "SHING!" + rapid omnislash flurries
    const ring = ctx.createOscillator();
    const ringGain = ctx.createGain();
    ring.connect(ringGain);
    ringGain.connect(this.getSfxTarget() ?? ctx.destination);
    ring.type = 'triangle';
    ring.frequency.setValueAtTime(1320, now);
    ring.frequency.exponentialRampToValueAtTime(2640, now + 0.22);
    ringGain.gain.setValueAtTime(0.22, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    ring.start(now);
    ring.stop(now + 0.45);

    for (let i = 0; i < 5; i++) {
      const slash = ctx.createOscillator();
      const sGain = ctx.createGain();
      slash.connect(sGain);
      sGain.connect(this.getSfxTarget() ?? ctx.destination);
      slash.type = 'sawtooth';
      const t = now + 0.08 + i * 0.07;
      slash.frequency.setValueAtTime(920 + i * 140, t);
      slash.frequency.exponentialRampToValueAtTime(180, t + 0.065);
      sGain.gain.setValueAtTime(0.15, t);
      sGain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
      slash.start(t);
      slash.stop(t + 0.07);
    }
  }
}

export const sound = new SoundManager();

