export class SpeechService {
  private recognition: SpeechRecognition | null = null;
  private isSupported: boolean;
  private isRecording: boolean = false;

  constructor() {
    this.isSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    
    if (this.isSupported) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
  }

  isAvailable(): boolean {
    return this.isSupported && this.recognition !== null;
  }

  startRecording(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not available'));
        return;
      }
      if (this.isRecording) {
        reject(new Error('Recording already in progress'));
        return;
      }
      this.isRecording = true;
      let finalTranscript = '';
      let timeoutId: NodeJS.Timeout;
      let silenceTimeoutId: NodeJS.Timeout;
      let stoppedBySilence = false;

      const onResult = (event: SpeechRecognitionEvent) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // Reset silence timeout on each speech input
        clearTimeout(silenceTimeoutId);
        silenceTimeoutId = setTimeout(() => {
          stoppedBySilence = true;
          this.stopRecording();
        }, 3000); // Stop after 3 seconds of silence
      };

      const onEnd = () => {
        clearTimeout(timeoutId);
        clearTimeout(silenceTimeoutId);
        this.recognition?.removeEventListener('result', onResult);
        this.recognition?.removeEventListener('end', onEnd);
        this.recognition?.removeEventListener('error', onError);
        this.isRecording = false;
        if (stoppedBySilence) {
          resolve(finalTranscript.trim() ? finalTranscript.trim() : '[No speech detected: stopped by silence]');
        } else {
          resolve(finalTranscript.trim() || '[No speech detected]');
        }
      };

      const onError = (event: SpeechRecognitionErrorEvent) => {
        clearTimeout(timeoutId);
        clearTimeout(silenceTimeoutId);
        this.recognition?.removeEventListener('result', onResult);
        this.recognition?.removeEventListener('end', onEnd);
        this.recognition?.removeEventListener('error', onError);
        this.isRecording = false;
        let message = 'Speech recognition error.';
        if (event.error === 'not-allowed') {
          message = 'Microphone access denied. Please allow microphone permissions.';
        } else if (event.error === 'no-speech') {
          message = 'No speech detected. Please try again.';
        } else if (event.error === 'audio-capture') {
          message = 'No microphone found. Please check your device.';
        }
        reject(new Error(message));
      };

      this.recognition.addEventListener('result', onResult);
      this.recognition.addEventListener('end', onEnd);
      this.recognition.addEventListener('error', onError);

      try {
        this.recognition.start();
        
        // Auto-stop after 30 seconds maximum
        timeoutId = setTimeout(() => {
          this.stopRecording();
        }, 30000);
        // Also start silence timeout
        silenceTimeoutId = setTimeout(() => {
          stoppedBySilence = true;
          this.stopRecording();
        }, 3000);
      } catch (error) {
        this.isRecording = false;
        reject(error);
      }
    });
  }

  stopRecording() {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
      this.isRecording = false;
    }
  }
}

// Extend the Window interface to include speech recognition
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}