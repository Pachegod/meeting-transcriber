'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, Clock, Users, Mic, FileText, 
  ArrowLeft, Trash2, Edit, ExternalLink, 
  Play, Pause, Square, Upload, Loader2 
} from 'lucide-react';
import { 
  fetchMeetingById, 
  Meeting, 
  deleteMeeting, 
  fetchTranscription, 
  Transcription,
  exportToRDStation 
} from '@/services/meetings';
import { 
  startRecording, 
  pauseRecording, 
  resumeRecording, 
  stopRecording, 
  uploadRecording, 
  getRecordingState, 
  getRecordingUrl,
  checkTranscriptionStatus
} from '@/services/recording';
import { isAuthenticated } from '@/services/auth';
import { logger } from '@/lib/logger';
import { RD_STATION } from '@/config';

export default function MeetingDetailsPage({ params }: { params: { id: string } }) {
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState({
    isRecording: false,
    isPaused: false,
    duration: 0,
    hasRecording: false
  });
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [transcriptionStatus, setTranscriptionStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated()) {
      logger.info('Usuário não autenticado, redirecionando para login', { context: 'MeetingDetailsPage' });
      router.push('/login');
      return;
    }

    loadMeeting();

    // Atualizar o estado da gravação a cada segundo
    const interval = setInterval(() => {
      const state = getRecordingState();
      setRecordingState(state);
      
      if (state.hasRecording) {
        setAudioUrl(getRecordingUrl());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [params.id, router]);

  const loadMeeting = async () => {
    try {
      setIsLoading(true);
      logger.info('Carregando detalhes da reunião', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      
      // Carregar detalhes da reunião
      const meetingData = await fetchMeetingById(params.id);
      setMeeting(meetingData);
      
      // Verificar se há transcrição
      if (meetingData.hasTranscription) {
        try {
          const transcriptionData = await fetchTranscription(params.id);
          setTranscription(transcriptionData);
        } catch (err) {
          logger.warn('Erro ao carregar transcrição', { 
            context: 'MeetingDetailsPage', 
            data: { meetingId: params.id, error: err instanceof Error ? err.message : String(err) } 
          });
        }
      } else {
        // Verificar status da transcrição
        checkTranscriptionStatusPeriodically();
      }
    } catch (err) {
      logger.error('Erro ao carregar detalhes da reunião', err instanceof Error ? err : new Error(String(err)), {
        context: 'MeetingDetailsPage',
        data: { meetingId: params.id }
      });
      setError('Não foi possível carregar os detalhes da reunião. Por favor, tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  };

  const checkTranscriptionStatusPeriodically = async () => {
    if (isCheckingStatus) return;
    
    setIsCheckingStatus(true);
    try {
      const status = await checkTranscriptionStatus(params.id);
      setTranscriptionStatus(status);
      
      if (status === 'completed') {
        // Recarregar a reunião para obter a transcrição
        loadMeeting();
      } else if (status === 'pending' || status === 'processing') {
        // Verificar novamente após 10 segundos
        setTimeout(() => {
          checkTranscriptionStatusPeriodically();
        }, 10000);
      }
    } catch (err) {
      logger.warn('Erro ao verificar status da transcrição', { 
        context: 'MeetingDetailsPage', 
        data: { meetingId: params.id, error: err instanceof Error ? err.message : String(err) } 
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleStartRecording = async () => {
    logger.info('Iniciando gravação', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
    const success = await startRecording();
    
    if (!success) {
      setError('Não foi possível iniciar a gravação. Verifique as permissões do microfone.');
    }
  };

  const handleStopRecording = async () => {
    logger.info('Parando gravação', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
    const success = stopRecording();
    
    if (!success) {
      setError('Não foi possível parar a gravação.');
    }
  };

  const handlePauseResumeRecording = () => {
    if (recordingState.isPaused) {
      logger.info('Retomando gravação', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      resumeRecording();
    } else {
      logger.info('Pausando gravação', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      pauseRecording();
    }
  };

  const handleUploadRecording = async () => {
    if (!recordingState.hasRecording) {
      setError('Não há gravação para enviar.');
      return;
    }
    
    setIsUploading(true);
    try {
      logger.info('Enviando gravação para transcrição', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      const success = await uploadRecording(params.id);
      
      if (success) {
        setAudioUrl(null);
        setTranscriptionStatus('pending');
        checkTranscriptionStatusPeriodically();
      } else {
        setError('Não foi possível enviar a gravação para transcrição.');
      }
    } catch (err) {
      logger.error('Erro ao enviar gravação', err instanceof Error ? err : new Error(String(err)), {
        context: 'MeetingDetailsPage',
        data: { meetingId: params.id }
      });
      setError('Ocorreu um erro ao enviar a gravação. Por favor, tente novamente.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteMeeting = async () => {
    if (!confirm('Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.')) {
      return;
    }
    
    setIsDeleting(true);
    try {
      logger.info('Excluindo reunião', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      await deleteMeeting(params.id);
      
      router.push('/dashboard');
    } catch (err) {
      logger.error('Erro ao excluir reunião', err instanceof Error ? err : new Error(String(err)), {
        context: 'MeetingDetailsPage',
        data: { meetingId: params.id }
      });
      setError('Não foi possível excluir a reunião. Por favor, tente novamente mais tarde.');
      setIsDeleting(false);
    }
  };

  const handleExportToRdStation = async () => {
    if (!meeting?.hasTranscription) {
      setError('É necessário ter uma transcrição para exportar para o RD Station.');
      return;
    }
    
    setIsExporting(true);
    try {
      logger.info('Exportando para RD Station', { context: 'MeetingDetailsPage', data: { meetingId: params.id } });
      const success = await exportToRDStation(params.id);
      
      if (success) {
        alert('Reunião exportada com sucesso para o RD Station!');
      } else {
        setError('Não foi possível exportar para o RD Station.');
      }
    } catch (err) {
      logger.error('Erro ao exportar para RD Station', err instanceof Error ? err : new Error(String(err)), {
        context: 'MeetingDetailsPage',
        data: { meetingId: params.id }
      });
      setError('Ocorreu um erro ao exportar para o RD Station. Por favor, tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  // Função para formatar data
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Não definida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar hora
  const formatTime = (timeString?: string) => {
    if (!timeString) return 'Não definida';
    const date = new Date(timeString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // Função para obter a cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para obter o status formatado
  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Agendada';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluída';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  };

  // Função para formatar a duração da gravação
  const formatRecordingDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Função para formatar o status da transcrição
  const getTranscriptionStatusText = (status: string | null) => {
    if (!status) return 'Não iniciada';
    
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'processing':
        return 'Processando';
      case 'completed':
        return 'Concluída';
      case 'failed':
        return 'Falhou';
      default:
        return status;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para o Dashboard
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Carregando detalhes da reunião...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : meeting ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{meeting.title}</h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{meeting.description || 'Sem descrição'}</p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                meeting.status
              )}`}
            >
              {getStatusText(meeting.status)}
            </span>
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Data
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{meeting.startTime ? formatDate(meeting.startTime) : 'Não definida'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Hora
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{meeting.startTime ? formatTime(meeting.startTime) : 'Não definida'}</dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Participantes
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {meeting.participants && meeting.participants.length > 0
                    ? meeting.participants.join(', ')
                    : 'Nenhum participante'}
                </dd>
              </div>
              
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Plataforma</dt>
                <dd className="mt-1 text-sm text-gray-900">{meeting.platform}</dd>
              </div>
              
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Transcrição
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {meeting.hasTranscription ? (
                    <span className="text-green-600">Disponível</span>
                  ) : transcriptionStatus ? (
                    <div className="flex items-center">
                      <span className="mr-2">{getTranscriptionStatusText(transcriptionStatus)}</span>
                      {(transcriptionStatus === 'pending' || transcriptionStatus === 'processing') && (
                        <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-500">Não disponível</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
          
          {/* Seção de gravação */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Gravação</h3>
            
            {recordingState.isRecording ? (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Gravando...</span>
                  <span className="text-sm font-medium text-red-600">{formatRecordingDuration(recordingState.duration)}</span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePauseResumeRecording}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {recordingState.isPaused ? (
                      <>
                        <Play className="h-3 w-3 mr-1" />
                        Continuar
                      </>
                    ) : (
                      <>
                        <Pause className="h-3 w-3 mr-1" />
                        Pausar
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStopRecording}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <Square className="h-3 w-3 mr-1" />
                    Parar
                  </button>
                </div>
              </div>
            ) : recordingState.hasRecording ? (
              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <div className="mb-2">
                  <span className="text-sm font-medium text-gray-700">Gravação concluída - {formatRecordingDuration(recordingState.duration)}</span>
                </div>
                {audioUrl && (
                  <div className="mb-4">
                    <audio src={audioUrl} controls className="w-full" />
                  </div>
                )}
                <div className="flex space-x-2">
                  <button
                    onClick={handleUploadRecording}
                    disabled={isUploading}
                    className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white ${
                      isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="h-3 w-3 mr-1" />
                        Enviar para transcrição
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleStartRecording}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Mic className="h-3 w-3 mr-1" />
                    Nova gravação
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleStartRecording}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Mic className="h-3 w-3 mr-1" />
                  Iniciar gravação
                </button>
              </div>
            )}
          </div>
          
          {/* Seção de transcrição */}
          {transcription && (
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Transcrição</h3>
              
              {transcription.summary && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Resumo</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-900">{transcription.summary}</p>
                  </div>
                </div>
              )}
              
              {transcription.keywords && transcription.keywords.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Palavras-chave</h4>
                  <div className="flex flex-wrap gap-2">
                    {transcription.keywords.map((keyword, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Conteúdo</h4>
                <div className="bg-gray-50 p-4 rounded-md max-h-96 overflow-y-auto">
                  {transcription.segments.map((segment, index) => (
                    <div key={index} className="mb-4">
                      <div className="flex items-center mb-1">
                        <span className="text-xs font-medium text-gray-500">
                          {new Date(segment.start * 1000).toISOString().substr(11, 8)}
                          {' - '}
                          {new Date(segment.end * 1000).toISOString().substr(11, 8)}
                        </span>
                        {segment.speaker && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-800">
                            {segment.speaker}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-900">{segment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Ações */}
          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-between">
              <div className="flex space-x-2">
                <Link
                  href={`/meetings/${meeting.id}/edit`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Link>
                <button
                  onClick={handleDeleteMeeting}
                  disabled={isDeleting}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    isDeleting ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Excluindo...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </>
                  )}
                </button>
              </div>
              
              {RD_STATION.enabled && meeting.hasTranscription && (
                <button
                  onClick={handleExportToRdStation}
                  disabled={isExporting}
                  className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    isExporting ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Exportar para RD Station
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Reunião não encontrada</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
              <p>A reunião que você está procurando não existe ou foi excluída.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para o Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 