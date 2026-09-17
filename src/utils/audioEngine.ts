/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * FrameForge - Web Audio Synchronization & Waveform Engine
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioBuffer: AudioBuffer | null = null;
  private sourceNode: AudioBufferSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private startTime = 0;
  private pausedAt = 0;
  private isPlaying = false;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Load audio from base64 or blob URL
  async loadAudio(dataUrl: string): Promise<{ duration: number; waveform: number[] }> {
    const ctx = this.getContext();
    const response = await fetch(dataUrl);
    const arrayBuffer = await response.arrayBuffer();
    this.audioBuffer = await ctx.decodeAudioData(arrayBuffer);

    const duration = this.audioBuffer.duration;
    const waveform = this.extractWaveform(this.audioBuffer, 120);

    return { duration, waveform };
  }

  // Compute normalized waveform amplitude peaks
  private extractWaveform(buffer: AudioBuffer, numPeaks = 100): number[] {
    const channelData = buffer.getChannelData(0);
    const blockSize = Math.floor(channelData.length / numPeaks);
    const peaks: number[] = [];

    for (let i = 0; i < numPeaks; i++) {
      const start = i * blockSize;
      let max = 0;
      for (let j = 0; j < blockSize; j += 4) {
        const val = Math.abs(channelData[start + j] || 0);
        if (val > max) max = val;
      }
      peaks.push(Math.min(1, Math.max(0.05, max)));
    }

    return peaks;
  }

  // Play audio synced with frame timeline
  play(offsetSeconds = 0, volume = 1): void {
    if (!this.audioBuffer) return;
    this.stop();

    const ctx = this.getContext();
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = volume;
    this.gainNode.connect(ctx.destination);

    this.sourceNode = ctx.createBufferSource();
    this.sourceNode.buffer = this.audioBuffer;
    this.sourceNode.connect(this.gainNode);

    const safeOffset = Math.max(0, Math.min(offsetSeconds, this.audioBuffer.duration));
    this.startTime = ctx.currentTime - safeOffset;
    this.sourceNode.start(0, safeOffset);
    this.isPlaying = true;
  }

  pause(): void {
    if (!this.isPlaying) return;
    this.stop();
  }

  stop(): void {
    if (this.sourceNode) {
      try {
        this.sourceNode.stop();
        this.sourceNode.disconnect();
      } catch {
        // Ignored if already stopped
      }
      this.sourceNode = null;
    }
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  clear(): void {
    this.stop();
    this.audioBuffer = null;
  }
}

export const audioEngine = new AudioEngine();

export async function processAudioFile(file: File): Promise<{
  id: string;
  name: string;
  dataUrl: string;
  durationSeconds: number;
  duration: number;
  waveform: number[];
  volume: number;
  isMuted: boolean;
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const { duration, waveform } = await audioEngine.loadAudio(dataUrl);
        resolve({
          id: `audio-${Date.now()}`,
          name: file.name,
          dataUrl,
          durationSeconds: duration,
          duration,
          waveform,
          volume: 1,
          isMuted: false,
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Generate synthesized audio effect (boing, pop, laser)
export async function createSynthBeep(type: 'boing' | 'pop' | 'laser'): Promise<{
  id: string;
  name: string;
  dataUrl: string;
  durationSeconds: number;
  duration: number;
  waveform: number[];
  volume: number;
  isMuted: boolean;
}> {
  const sampleRate = 44100;
  const duration = type === 'boing' ? 0.6 : type === 'pop' ? 0.2 : 0.4;
  const offlineCtx = new OfflineAudioContext(1, Math.floor(sampleRate * duration), sampleRate);

  const osc = offlineCtx.createOscillator();
  const gain = offlineCtx.createGain();

  if (type === 'boing') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, 0);
    osc.frequency.exponentialRampToValueAtTime(450, 0.15);
    osc.frequency.exponentialRampToValueAtTime(180, 0.4);
    osc.frequency.exponentialRampToValueAtTime(320, 0.6);
    gain.gain.setValueAtTime(0.8, 0);
    gain.gain.exponentialRampToValueAtTime(0.01, duration);
  } else if (type === 'pop') {
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, 0);
    osc.frequency.exponentialRampToValueAtTime(80, duration);
    gain.gain.setValueAtTime(0.9, 0);
    gain.gain.exponentialRampToValueAtTime(0.01, duration);
  } else {
    // Laser
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, 0);
    osc.frequency.exponentialRampToValueAtTime(100, duration);
    gain.gain.setValueAtTime(0.7, 0);
    gain.gain.exponentialRampToValueAtTime(0.01, duration);
  }

  osc.connect(gain);
  gain.connect(offlineCtx.destination);
  osc.start(0);
  osc.stop(duration);

  const renderedBuffer = await offlineCtx.startRendering();

  // Convert buffer to WAV Data URL
  const wavBlob = bufferToWaveBlob(renderedBuffer);
  const dataUrl = await new Promise<string>((resolve) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.readAsDataURL(wavBlob);
  });

  const { waveform } = await audioEngine.loadAudio(dataUrl);

  return {
    id: `audio-synth-${type}-${Date.now()}`,
    name: `${type.toUpperCase()} Sound FX`,
    dataUrl,
    durationSeconds: duration,
    duration,
    waveform,
    volume: 1,
    isMuted: false,
  };
}

function bufferToWaveBlob(abuffer: AudioBuffer): Blob {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit
  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < abuffer.numberOfChannels; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (pos < length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset] || 0));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

