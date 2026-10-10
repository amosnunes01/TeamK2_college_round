import type { VoiceCommand } from '../types';

export type VoiceServiceCallback = (command: VoiceCommand) => void;
export type VoiceTranscriptCallback = (transcript: string, isFinal: boolean) => void;
export type VoiceErrorCallback = (error: string) => void;
export type VoiceStatusCallback = (isListening: boolean) => void;

class VoiceService {
  private recognition: any = null;
  private isListening: boolean = false;
  private isDictationMode: boolean = false;
  private lastCommandTime: number = 0;
  
  private onCommandCallback: VoiceServiceCallback | null = null;
  private onTranscriptCallback: VoiceTranscriptCallback | null = null;
  private onErrorCallback: VoiceErrorCallback | null = null;
  private onStatusCallback: VoiceStatusCallback | null = null;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

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
      // Auto-restart if we didn't explicitly stop
      // but let's just let the UI handle restarts or keep it simple.
    };

    this.recognition.onerror = (event: any) => {
      if (this.onErrorCallback) this.onErrorCallback(event.error);
      this.isListening = false;
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

  public start() {
    if (!this.recognition) {
      if (this.onErrorCallback) this.onErrorCallback('unsupported');
      return;
    }
    if (this.isListening) return;
    try {
      this.recognition.start();
    } catch (e) {
      console.error(e);
    }
  }

  public stop() {
    if (!this.recognition) return;
    if (!this.isListening) return;
    this.recognition.stop();
  }

  public setDictationMode(enabled: boolean) {
    this.isDictationMode = enabled;
  }

  private processTranscript(transcript: string) {
    // Prevent duplicate processing if commands arrive too quickly (within 500ms)
    const now = Date.now();
    if (now - this.lastCommandTime < 500) {
      return;
    }

    if (this.isDictationMode) {
      // In dictation mode, everything is dictation except 'stop dictation' or 'stop typing'
      if (transcript.includes('stop dictation') || transcript.includes('stop typing')) {
        this.emitCommand(transcript, 'stop dictation', 'control');
        this.isDictationMode = false;
      } else {
        this.emitCommand(transcript, transcript, 'dictation');
      }
      return;
    }

    // Command mode parsing
    let parsed = '';
    let type: VoiceCommand['type'] = 'unknown';

    if (transcript.includes('scroll down')) {
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
    } else if (transcript.includes('open home')) {
      parsed = 'open home'; type = 'navigation';
    } else if (transcript.includes('go to settings') || transcript.includes('open settings')) {
      parsed = 'go to settings'; type = 'navigation';
    } else if (transcript.includes('click') || transcript.includes('select')) {
      parsed = 'click'; type = 'action';
    } else if (transcript.includes('confirm')) {
      parsed = 'confirm'; type = 'action';
    } else if (transcript.includes('cancel')) {
      parsed = 'cancel'; type = 'action';
    } else if (transcript.includes('clear text') || transcript.includes('clear input')) {
      parsed = 'clear text'; type = 'action';
    } else if (transcript.includes('pause control')) {
      parsed = 'pause control'; type = 'control';
    } else if (transcript.includes('resume control')) {
      parsed = 'resume control'; type = 'control';
    } else if (transcript.includes('start dictation') || transcript.includes('start typing')) {
      parsed = 'start dictation'; type = 'control';
      this.isDictationMode = true;
    } else if (transcript.includes('start session')) {
      parsed = 'start session'; type = 'control';
    } else if (transcript.includes('stop session')) {
      parsed = 'stop session'; type = 'control';
    }

    if (type !== 'unknown') {
      this.lastCommandTime = now;
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
        confidence: 1, // Web Speech doesn't always give good confidence, assume 1
        timestamp: Date.now(),
        executed: false // App logic sets this
      });
    }
  }
}

export const voiceService = new VoiceService();
