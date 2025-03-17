'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Calendar, Clock, Users, ArrowRight, Loader2 } from 'lucide-react';
import { fetchMeetings, Meeting } from '@/services/meetings';
import { isAuthenticated } from '@/services/auth';
import { logger } from '@/lib/logger';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      try {
        // Verificar se o usuário está autenticado
        if (!isAuthenticated()) {
          logger.info('Usuário não autenticado, redirecionando para login', { context: 'DashboardPage' });
          router.push('/login');
          return;
        }

        // Carregar reuniões
        setIsLoading(true);
        logger.info('Carregando reuniões do usuário', { context: 'DashboardPage' });
        const meetingsData = await fetchMeetings();
        setMeetings(meetingsData);
      } catch (err) {
        logger.error('Erro ao carregar dashboard', err instanceof Error ? err : new Error(String(err)), {
          context: 'DashboardPage'
        });
        setError('Não foi possível carregar suas reuniões. Por favor, tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  // Função para formatar hora
  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/meetings/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Reunião
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-600">Carregando reuniões...</span>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : meetings.length === 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:p-6 text-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Nenhuma reunião encontrada</h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500 mx-auto">
              <p>Você ainda não tem reuniões. Crie uma nova reunião para começar.</p>
            </div>
            <div className="mt-5">
              <Link
                href="/meetings/new"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Reunião
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-lg font-medium text-gray-900 mb-4">Suas Reuniões</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-gray-900 truncate" title={meeting.title}>
                      {meeting.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        meeting.status
                      )}`}
                    >
                      {getStatusText(meeting.status)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-gray-500 line-clamp-2" title={meeting.description || ''}>
                    {meeting.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center mt-2">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{meeting.startTime ? formatDate(meeting.startTime) : 'Data não definida'}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{meeting.startTime ? formatTime(meeting.startTime) : 'Hora não definida'}</span>
                  </div>
                  {meeting.participants && meeting.participants.length > 0 && (
                    <div className="flex items-center mt-1">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{meeting.participants.length} participantes</span>
                    </div>
                  )}
                  <div className="mt-4">
                    <Link
                      href={`/meetings/${meeting.id}`}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ver detalhes
                      <ArrowRight className="ml-1.5 h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
} 