'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { createMeeting } from '@/services/meetings';
import { isAuthenticated } from '@/services/auth';
import { useEffect } from 'react';

export default function NewMeetingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    duration: 30,
    platform: 'Zoom',
    description: '',
    participants: '',
    enableTranscription: true,
    enableSummary: true,
    enableRdStationExport: false,
  });

  useEffect(() => {
    // Verificar se o usuário está autenticado
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setFormData({
        ...formData,
        [name]: target.checked,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Preparar os dados para envio
      const meetingData = {
        ...formData,
        duration: Number(formData.duration),
        participants: formData.participants.split(',').map(p => p.trim()).filter(p => p),
      };

      // Criar a reunião
      await createMeeting(meetingData);
      
      // Redirecionar para o dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Erro ao criar reunião:', err);
      setError('Falha ao criar reunião. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Nova Reunião</CardTitle>
            <CardDescription>Preencha os detalhes para agendar uma nova reunião</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium">
                    Título da Reunião *
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: Reunião de Planejamento Q3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="date" className="text-sm font-medium">
                      Data *
                    </label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      required
                      value={formData.date}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="text-sm font-medium">
                      Horário *
                    </label>
                    <input
                      id="time"
                      name="time"
                      type="time"
                      required
                      value={formData.time}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="duration" className="text-sm font-medium">
                      Duração (minutos) *
                    </label>
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      min="5"
                      max="480"
                      required
                      value={formData.duration}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="platform" className="text-sm font-medium">
                      Plataforma *
                    </label>
                    <select
                      id="platform"
                      name="platform"
                      required
                      value={formData.platform}
                      onChange={handleChange}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="Zoom">Zoom</option>
                      <option value="Google Meet">Google Meet</option>
                      <option value="Microsoft Teams">Microsoft Teams</option>
                      <option value="Skype">Skype</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium">
                    Descrição
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Descreva o objetivo da reunião"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="participants" className="text-sm font-medium">
                    Participantes (separados por vírgula)
                  </label>
                  <input
                    id="participants"
                    name="participants"
                    type="text"
                    value={formData.participants}
                    onChange={handleChange}
                    className="w-full p-2 border rounded-md"
                    placeholder="Ex: joao@email.com, maria@email.com"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center">
                    <input
                      id="enableTranscription"
                      name="enableTranscription"
                      type="checkbox"
                      checked={formData.enableTranscription}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="enableTranscription" className="ml-2 text-sm font-medium">
                      Habilitar transcrição automática
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="enableSummary"
                      name="enableSummary"
                      type="checkbox"
                      checked={formData.enableSummary}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="enableSummary" className="ml-2 text-sm font-medium">
                      Gerar resumo e análise de sentimento
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      id="enableRdStationExport"
                      name="enableRdStationExport"
                      type="checkbox"
                      checked={formData.enableRdStationExport}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="enableRdStationExport" className="ml-2 text-sm font-medium">
                      Exportar para RD Station
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Criando...
                  </>
                ) : (
                  'Criar Reunião'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
} 