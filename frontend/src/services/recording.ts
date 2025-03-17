import { api } from '@/lib/api';
import { logger } from '@/lib/logger';
import { MAX_RECORDING_DURATION } from '@/config';

interface RecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  startTime: number | null;
  pausedTime: number;
  timer: NodeJS.Timeout | null;
}

// Estado inicial da gravação
const initialState: RecordingState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioBlob: null,
  mediaRecorder: null,
  audioChunks: [],
  startTime: null,
  pausedTime: 0,
  timer: null,
};

// Estado atual da gravação
let state: RecordingState = { ...initialState };

/**
 * Inicia a gravação de áudio
 */
export async function startRecording(): Promise<boolean> {
  try {
    logger.info('Iniciando gravação de áudio', { context: 'RecordingService' });
    
    // Verifica se já está gravando
    if (state.isRecording) {
      logger.warn('Tentativa de iniciar gravação quando já está gravando', { context: 'RecordingService' });
      return false;
    }
    
    // Solicita permissão para acessar o microfone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Reseta o estado
    state = { ...initialState };
    
    // Configura o MediaRecorder
    const mediaRecorder = new MediaRecorder(stream);
    state.mediaRecorder = mediaRecorder;
    state.isRecording = true;
    state.startTime = Date.now();
    
    // Configura os eventos do MediaRecorder
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        state.audioChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      // Cria o blob de áudio quando a gravação parar
      const audioBlob = new Blob(state.audioChunks, { type: 'audio/webm' });
      state.audioBlob = audioBlob;
      
      // Libera os recursos do stream
      stream.getTracks().forEach(track => track.stop());
      
      logger.info('Gravação finalizada', { 
        context: 'RecordingService',
        data: { duration: state.duration, size: audioBlob.size }
      });
    };
    
    // Inicia a gravação
    mediaRecorder.start(1000); // Coleta dados a cada segundo
    
    // Configura um timer para atualizar a duração
    state.timer = setInterval(() => {
      if (!state.isPaused) {
        state.duration = Math.floor((Date.now() - (state.startTime || 0) - state.pausedTime) / 1000);
        
        // Verifica se atingiu o tempo máximo de gravação
        if (state.duration >= MAX_RECORDING_DURATION) {
          logger.warn('Tempo máximo de gravação atingido', { 
            context: 'RecordingService',
            data: { maxDuration: MAX_RECORDING_DURATION }
          });
          stopRecording();
        }
      }
    }, 1000);
    
    logger.info('Gravação iniciada com sucesso', { context: 'RecordingService' });
    return true;
  } catch (error) {
    logger.error('Erro ao iniciar gravação', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService'
    });
    return false;
  }
}

/**
 * Pausa a gravação em andamento
 */
export function pauseRecording(): boolean {
  try {
    logger.info('Pausando gravação', { context: 'RecordingService' });
    
    if (!state.isRecording || state.isPaused || !state.mediaRecorder) {
      logger.warn('Tentativa de pausar gravação inválida', { 
        context: 'RecordingService',
        data: { isRecording: state.isRecording, isPaused: state.isPaused }
      });
      return false;
    }
    
    state.mediaRecorder.pause();
    state.isPaused = true;
    state.pausedTime = Date.now() - (state.startTime || 0) - (state.duration * 1000);
    
    logger.info('Gravação pausada com sucesso', { context: 'RecordingService' });
    return true;
  } catch (error) {
    logger.error('Erro ao pausar gravação', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService'
    });
    return false;
  }
}

/**
 * Retoma a gravação pausada
 */
export function resumeRecording(): boolean {
  try {
    logger.info('Retomando gravação', { context: 'RecordingService' });
    
    if (!state.isRecording || !state.isPaused || !state.mediaRecorder) {
      logger.warn('Tentativa de retomar gravação inválida', { 
        context: 'RecordingService',
        data: { isRecording: state.isRecording, isPaused: state.isPaused }
      });
      return false;
    }
    
    state.mediaRecorder.resume();
    state.isPaused = false;
    
    logger.info('Gravação retomada com sucesso', { context: 'RecordingService' });
    return true;
  } catch (error) {
    logger.error('Erro ao retomar gravação', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService'
    });
    return false;
  }
}

/**
 * Finaliza a gravação em andamento
 */
export function stopRecording(): boolean {
  try {
    logger.info('Finalizando gravação', { context: 'RecordingService' });
    
    if (!state.isRecording || !state.mediaRecorder) {
      logger.warn('Tentativa de parar gravação inválida', { 
        context: 'RecordingService',
        data: { isRecording: state.isRecording }
      });
      return false;
    }
    
    // Limpa o timer
    if (state.timer) {
      clearInterval(state.timer);
      state.timer = null;
    }
    
    // Para a gravação
    state.mediaRecorder.stop();
    state.isRecording = false;
    state.isPaused = false;
    
    return true;
  } catch (error) {
    logger.error('Erro ao parar gravação', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService'
    });
    return false;
  }
}

/**
 * Envia o áudio gravado para transcrição
 */
export async function uploadRecording(meetingId: string): Promise<boolean> {
  try {
    logger.info('Enviando gravação para transcrição', { 
      context: 'RecordingService',
      data: { meetingId }
    });
    
    if (!state.audioBlob) {
      logger.warn('Tentativa de enviar gravação sem áudio', { 
        context: 'RecordingService',
        data: { meetingId }
      });
      return false;
    }
    
    // Cria um FormData para enviar o arquivo
    const formData = new FormData();
    formData.append('audio', state.audioBlob, 'recording.webm');
    
    const response = await api.post<{ success: boolean }>(`/meetings/${meetingId}/transcribe`, formData);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao enviar gravação para transcrição', { 
        context: 'RecordingService',
        data: { error: response.error, status: response.status, meetingId }
      });
      return false;
    }
    
    logger.info('Gravação enviada com sucesso para transcrição', { 
      context: 'RecordingService',
      data: { meetingId }
    });
    
    // Reseta o estado após o envio bem-sucedido
    state = { ...initialState };
    
    return true;
  } catch (error) {
    logger.error('Erro ao enviar gravação', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService',
      data: { meetingId }
    });
    return false;
  }
}

/**
 * Verifica o status da transcrição
 */
export async function checkTranscriptionStatus(meetingId: string): Promise<'pending' | 'processing' | 'completed' | 'failed'> {
  try {
    logger.info('Verificando status da transcrição', { 
      context: 'RecordingService',
      data: { meetingId }
    });
    
    const response = await api.get<{ status: 'pending' | 'processing' | 'completed' | 'failed' }>(`/meetings/${meetingId}/transcription/status`);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao verificar status da transcrição', { 
        context: 'RecordingService',
        data: { error: response.error, status: response.status, meetingId }
      });
      return 'failed';
    }
    
    logger.info(`Status da transcrição: ${response.data.status}`, { 
      context: 'RecordingService',
      data: { meetingId, status: response.data.status }
    });
    
    return response.data.status;
  } catch (error) {
    logger.error('Erro ao verificar status da transcrição', error instanceof Error ? error : new Error(String(error)), {
      context: 'RecordingService',
      data: { meetingId }
    });
    return 'failed';
  }
}

/**
 * Obtém o estado atual da gravação
 */
export function getRecordingState(): {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  hasRecording: boolean;
} {
  return {
    isRecording: state.isRecording,
    isPaused: state.isPaused,
    duration: state.duration,
    hasRecording: !!state.audioBlob,
  };
}

/**
 * Obtém o áudio gravado como URL
 */
export function getRecordingUrl(): string | null {
  if (!state.audioBlob) return null;
  return URL.createObjectURL(state.audioBlob);
}

/**
 * Reseta o estado da gravação
 */
export function resetRecording(): void {
  // Limpa o timer se existir
  if (state.timer) {
    clearInterval(state.timer);
  }
  
  // Para o MediaRecorder se estiver ativo
  if (state.mediaRecorder && state.isRecording) {
    state.mediaRecorder.stop();
  }
  
  // Reseta o estado
  state = { ...initialState };
  
  logger.info('Estado da gravação resetado', { context: 'RecordingService' });
} 