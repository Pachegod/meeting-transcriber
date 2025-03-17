import Link from 'next/link';
import { ArrowRight, Mic, FileText, BarChart2, ExternalLink } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative z-10 py-16 sm:py-24 md:py-32 lg:max-w-2xl lg:w-full">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
                <span className="block">Transforme suas reuniões</span>
                <span className="block text-blue-200">em insights valiosos</span>
              </h1>
              <p className="mt-6 text-xl text-blue-100 max-w-md mx-auto lg:mx-0">
                Grave, transcreva e analise suas reuniões automaticamente. Integração com RD Station para potencializar suas vendas.
              </p>
              <div className="mt-10 flex justify-center lg:justify-start">
                <div className="rounded-md shadow">
                  <Link
                    href="/register"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10"
                  >
                    Começar agora
                  </Link>
                </div>
                <div className="ml-3 rounded-md shadow">
                  <Link
                    href="/about"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 bg-opacity-60 hover:bg-opacity-70 md:py-4 md:text-lg md:px-10"
                  >
                    Saiba mais
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1469&q=80"
            alt="Pessoas em uma reunião"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Funcionalidades</h2>
            <p className="mt-1 text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight">
              Tudo o que você precisa para suas reuniões
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Nossa plataforma oferece ferramentas completas para tornar suas reuniões mais produtivas e valiosas.
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-12 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8">
              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <Mic className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Gravação Multi-plataforma</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Grave reuniões diretamente do navegador ou integre com Zoom, Google Meet e Microsoft Teams.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <FileText className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Transcrição em Tempo Real</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Transcrição automática e precisa de suas reuniões, com identificação de falantes.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <BarChart2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Análise de Sentimento</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Entenda o tom e o sentimento das conversas para identificar oportunidades e problemas.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Resumos Automáticos</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Geração automática de resumos e pontos-chave das reuniões para fácil compartilhamento.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <ExternalLink className="h-6 w-6 text-blue-600" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Integração com RD Station</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Exporte dados e insights diretamente para o RD Station para alimentar seu funil de vendas.
                  </p>
                </div>
              </div>

              <div className="relative">
                <div className="relative p-6 bg-white rounded-lg shadow">
                  <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-md shadow-lg mb-5">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900">Segurança e Privacidade</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Seus dados são criptografados e protegidos, garantindo a confidencialidade das suas reuniões.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Pronto para transformar suas reuniões?</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Comece a usar o Meeting Transcriber hoje mesmo e descubra como podemos ajudar sua equipe a ser mais produtiva.
          </p>
          <Link
            href="/register"
            className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-700 bg-white hover:bg-blue-50 sm:w-auto"
          >
            Criar conta gratuita
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>
    </div>
  );
} 