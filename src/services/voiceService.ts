import type { VoiceCommand } from '../types';

export type VoiceServiceCallback = (command: VoiceCommand) => void;
export type VoiceTranscriptCallback = (transcript: string, isFinal: boolean) => void;
export type VoiceErrorCallback = (error: string) => void;
export type VoiceStatusCallback = (isListening: boolean) => void;

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isStarting: boolean = false;
  private shouldBeListening: boolean = false;
  private isDictationMode: boolean = false;
  private lastCommandTime: number = 0;
  private lastCommandParsed: string = '';
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  
  private onCommandCallback: VoiceServiceCallback | null = null;
  private onTranscriptCallback: VoiceTranscriptCallback | null = null;
  private onErrorCallback: VoiceErrorCallback | null = null;
  private onStatusCallback: VoiceStatusCallback | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isListening = true;
        if (this.onStatusCallback) this.onStatusCallback(true);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this.onStatusCallback) this.onStatusCallback(false);

        // Auto-recover if speech recognition was interrupted while session is still active
        if (this.shouldBeListening) {
          if (this.restartTimer) clearTimeout(this.restartTimer);
          this.restartTimer = setTimeout(() => {
            if (this.shouldBeListening && !this.isListening) {
              try {
                this.recognition?.start();
              } catch {
                // Ignore if already starting
              }
            }
          }, 300);
        }
      };

      this.recognition.onerror = (event: any) => {
        const error = event.error;
        if (error === 'no-speech' || error === 'aborted') {
          return;
        }

        this.shouldBeListening = false;
        this.isListening = false;
        this.isDictationMode = false;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        if (this.onErrorCallback) this.onErrorCallback(error);
        if (this.onStatusCallback) this.onStatusCallback(false);
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (this.onTranscriptCallback) {
          this.onTranscriptCallback(finalTranscript || interimTranscript, !!finalTranscript);
        }

        if (finalTranscript) {
          this.processTranscript(finalTranscript.trim().toLowerCase());
        }
      };
    } catch (e) {
      console.error('Failed to initialize SpeechRecognition:', e);
    }
  }

  public setCallbacks(
    onCommand: VoiceServiceCallback,
    onTranscript: VoiceTranscriptCallback,
    onError: VoiceErrorCallback,
    onStatus: VoiceStatusCallback
  ) {
    this.onCommandCallback = onCommand;
    this.onTranscriptCallback = onTranscript;
    this.onErrorCallback = onError;
    this.onStatusCallback = onStatus;
  }

  /**
   * Starts speech recognition with explicit microphone permission request on first use.
   */
  public async start(): Promise<boolean> {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (this.onErrorCallback) this.onErrorCallback('unsupported');
      return false;
    }

    if (this.isListening || this.shouldBeListening || this.isStarting) return true;

    if (!this.recognition) {
      this.initRecognition();
    }
    if (!this.recognition) {
      if (this.onErrorCallback) this.onErrorCallback('unsupported');
      return false;
    }

    this.isStarting = true;
    this.shouldBeListening = true;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Cleanly release probe tracks
        testStream.getTracks().forEach((track) => track.stop());
      }
      if (!this.shouldBeListening) return false;
      this.recognition.start();
      return true;
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'unknown';
      const stillRequested = this.shouldBeListening;
      this.shouldBeListening = false;
      this.isListening = false;
      if (stillRequested && this.onErrorCallback) {
        this.onErrorCallback(errorName === 'NotAllowedError' ? 'not-allowed' : errorName);
      }
      if (this.onStatusCallback) this.onStatusCallback(false);
      return false;
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Completely stops speech recognition and releases resources.
   */
  public stop() {
    this.shouldBeListening = false;
    this.isListening = false;
    this.isDictationMode = false;

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    if (!this.recognition) return;

    try {
      this.recognition.stop();
    } catch {
      // Ignore if already stopped
    }

    if (this.onStatusCallback) {
      this.onStatusCallback(false);
    }
  }

  public setDictationMode(enabled: boolean) {
    this.isDictationMode = enabled;
  }

  private processTranscript(transcript: string) {
    const now = Date.now();

    if (this.isDictationMode) {
      if (transcript.includes('stop dictation') || transcript.includes('stop typing')) {
        this.emitCommand(transcript, 'stop dictation', 'control');
        this.isDictationMode = false;
      } else {
        this.emitCommand(transcript, transcript, 'dictation');
      }
      return;
    }

    // Command mode parsing with priority matching
    let parsed = '';
    let type: VoiceCommand['type'] = 'unknown';

    if (transcript.includes('start session')) {
      parsed = 'start session'; type = 'control';
    } else if (transcript.includes('stop session')) {
      parsed = 'stop session'; type = 'control';
    } else if (transcript.includes('start listening')) {
      parsed = 'start listening'; type = 'control';
    } else if (transcript.includes('stop listening')) {
      parsed = 'stop listening'; type = 'control';
    } else if (transcript.includes('pause control')) {
      parsed = 'pause control'; type = 'control';
    } else if (transcript.includes('resume control')) {
      parsed = 'resume control'; type = 'control';
    } else if (transcript.includes('enable light mode') || transcript === 'light mode') {
      parsed = 'enable light mode'; type = 'control';
    } else if (transcript.includes('enable dark mode') || transcript === 'dark mode') {
      parsed = 'enable dark mode'; type = 'control';
    } else if (transcript.includes('start dictation') || transcript.includes('start typing')) {
      parsed = 'start dictation'; type = 'control';
      this.isDictationMode = true;
    } else if (transcript.includes('scroll down')) {
      parsed = 'scroll down'; type = 'navigation';
    } else if (transcript.includes('scroll up')) {
      parsed = 'scroll up'; type = 'navigation';
    } else if (transcript.includes('scroll to top')) {
      parsed = 'scroll to top'; type = 'navigation';
    } else if (transcript.includes('scroll to bottom')) {
      parsed = 'scroll to bottom'; type = 'navigation';
    } else if (transcript.includes('go back')) {
      parsed = 'go back'; type = 'navigation';
    } else if (transcript.includes('go forward')) {
      parsed = 'go forward'; type = 'navigation';
    } else if (transcript.includes('go home') || transcript.includes('open home')) {
      parsed = 'open home'; type = 'navigation';
    } else if (transcript.includes('reload') || transcript.includes('refresh')) {
      parsed = 'reload'; type = 'navigation';
    } else if (transcript.includes('go to browse') || transcript.includes('open browse')) {
      parsed = 'go to browse'; type = 'navigation';
    } else if (transcript.includes('go to settings') || transcript.includes('open settings')) {
      parsed = 'go to settings'; type = 'navigation';
    } else if (transcript.includes('select')) {
      parsed = 'select'; type = 'action';
    } else if (transcript.includes('click')) {
      parsed = 'click'; type = 'action';
    } else if (transcript.includes('confirm')) {
      parsed = 'confirm'; type = 'action';
    } else if (transcript.includes('cancel')) {
      parsed = 'cancel'; type = 'action';
    } else if (transcript.includes('clear text') || transcript.includes('clear input')) {
      parsed = 'clear text'; type = 'action';
    }

    if (type !== 'unknown') {
      // Deduplicate identical commands received within 600ms
      if (now - this.lastCommandTime < 600 && this.lastCommandParsed === parsed) {
        return;
      }
      this.lastCommandTime = now;
      this.lastCommandParsed = parsed;
      this.emitCommand(transcript, parsed, type);
    } else {
      // Ignored ambient speech
      this.emitCommand(transcript, 'unrecognized', 'unknown');
    }
  }

  private emitCommand(raw: string, parsed: string, type: VoiceCommand['type']) {
    if (this.onCommandCallback) {
      this.onCommandCallback({
        raw,
        parsed,
        type,
        confidence: 1,
        timestamp: Date.now(),
        executed: false,
      });
    }
  }
}

export const voiceService = new VoiceService();
