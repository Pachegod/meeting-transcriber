import { api } from '@/lib/api';
import { logger } from '@/lib/logger';

// Tipos
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  platform: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  startTime?: string;
  endTime?: string;
  participants?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  hasTranscription: boolean;
}

export interface CreateMeetingData {
  title: string;
  description?: string;
  platform: string;
  scheduledTime?: string;
  participants?: string[];
}

export interface UpdateMeetingData {
  title?: string;
  description?: string;
  platform?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduledTime?: string;
  participants?: string[];
}

export interface Transcription {
  id: string;
  meetingId: string;
  text: string;
  segments: TranscriptionSegment[];
  summary?: string;
  keywords?: string[];
  sentiment?: string;
  createdAt: string;
}

export interface TranscriptionSegment {
  id: string;
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

// Funções para gerenciar reuniões
export async function fetchMeetings(): Promise<Meeting[]> {
  try {
    logger.info('Buscando lista de reuniões', { context: 'MeetingsService' });
    
    const response = await api.get<Meeting[]>('/meetings');
    
    if (response.error || !response.data) {
      logger.warn('Falha ao buscar reuniões', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status } 
      });
      throw new Error(response.error || 'Erro ao buscar reuniões');
    }
    
    logger.info('Reuniões obtidas com sucesso', { 
      context: 'MeetingsService', 
      data: { count: response.data.length } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar reuniões', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService'
    });
    throw error;
  }
}

export async function fetchMeetingById(id: string): Promise<Meeting> {
  try {
    logger.info('Buscando detalhes da reunião', { context: 'MeetingsService', data: { meetingId: id } });
    
    const response = await api.get<Meeting>(`/meetings/${id}`);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao buscar detalhes da reunião', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status, meetingId: id } 
      });
      throw new Error(response.error || 'Erro ao buscar detalhes da reunião');
    }
    
    logger.info('Detalhes da reunião obtidos com sucesso', { 
      context: 'MeetingsService', 
      data: { meetingId: id } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar detalhes da reunião', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService',
      data: { meetingId: id }
    });
    throw error;
  }
}

export async function createMeeting(data: CreateMeetingData): Promise<Meeting> {
  try {
    logger.info('Criando nova reunião', { context: 'MeetingsService', data: { title: data.title } });
    
    const response = await api.post<Meeting>('/meetings', data);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao criar reunião', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status } 
      });
      throw new Error(response.error || 'Erro ao criar reunião');
    }
    
    logger.info('Reunião criada com sucesso', { 
      context: 'MeetingsService', 
      data: { meetingId: response.data.id } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao criar reunião', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService'
    });
    throw error;
  }
}

export async function updateMeeting(id: string, data: UpdateMeetingData): Promise<Meeting> {
  try {
    logger.info('Atualizando reunião', { context: 'MeetingsService', data: { meetingId: id } });
    
    const response = await api.put<Meeting>(`/meetings/${id}`, data);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao atualizar reunião', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status, meetingId: id } 
      });
      throw new Error(response.error || 'Erro ao atualizar reunião');
    }
    
    logger.info('Reunião atualizada com sucesso', { 
      context: 'MeetingsService', 
      data: { meetingId: id } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao atualizar reunião', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService',
      data: { meetingId: id }
    });
    throw error;
  }
}

export async function deleteMeeting(id: string): Promise<boolean> {
  try {
    logger.info('Excluindo reunião', { context: 'MeetingsService', data: { meetingId: id } });
    
    const response = await api.delete<{ success: boolean }>(`/meetings/${id}`);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao excluir reunião', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status, meetingId: id } 
      });
      throw new Error(response.error || 'Erro ao excluir reunião');
    }
    
    logger.info('Reunião excluída com sucesso', { 
      context: 'MeetingsService', 
      data: { meetingId: id } 
    });
    return response.data.success;
  } catch (error) {
    logger.error('Erro ao excluir reunião', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService',
      data: { meetingId: id }
    });
    throw error;
  }
}

export async function fetchTranscription(meetingId: string): Promise<Transcription | null> {
  try {
    logger.info('Buscando transcrição da reunião', { 
      context: 'MeetingsService', 
      data: { meetingId } 
    });
    
    const response = await api.get<Transcription>(`/meetings/${meetingId}/transcription`);
    
    if (response.status === 404) {
      logger.info('Transcrição não encontrada para a reunião', { 
        context: 'MeetingsService', 
        data: { meetingId } 
      });
      return null;
    }
    
    if (response.error || !response.data) {
      logger.warn('Falha ao buscar transcrição', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status, meetingId } 
      });
      throw new Error(response.error || 'Erro ao buscar transcrição');
    }
    
    logger.info('Transcrição obtida com sucesso', { 
      context: 'MeetingsService', 
      data: { meetingId, segments: response.data.segments?.length } 
    });
    return response.data;
  } catch (error) {
    logger.error('Erro ao buscar transcrição', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService',
      data: { meetingId }
    });
    throw error;
  }
}

export async function exportToRDStation(meetingId: string): Promise<boolean> {
  try {
    logger.info('Exportando reunião para RD Station', { 
      context: 'MeetingsService', 
      data: { meetingId } 
    });
    
    const response = await api.post<{ success: boolean }>(`/meetings/${meetingId}/export/rdstation`);
    
    if (response.error || !response.data) {
      logger.warn('Falha ao exportar para RD Station', { 
        context: 'MeetingsService', 
        data: { error: response.error, status: response.status, meetingId } 
      });
      throw new Error(response.error || 'Erro ao exportar para RD Station');
    }
    
    logger.info('Reunião exportada com sucesso para RD Station', { 
      context: 'MeetingsService', 
      data: { meetingId } 
    });
    return response.data.success;
  } catch (error) {
    logger.error('Erro ao exportar para RD Station', error instanceof Error ? error : new Error(String(error)), {
      context: 'MeetingsService',
      data: { meetingId }
    });
    throw error;
  }
} 