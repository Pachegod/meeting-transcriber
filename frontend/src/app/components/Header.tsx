import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

interface HeaderProps {
  isLoggedIn?: boolean;
  userName?: string;
}

export default function Header({ isLoggedIn = false, userName }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">Meeting Transcriber</Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/features" className="hover:text-blue-200 transition">Funcionalidades</Link>
            <Link href="/pricing" className="hover:text-blue-200 transition">Preços</Link>
            <Link href="/about" className="hover:text-blue-200 transition">Sobre</Link>
            
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                <div className="relative group">
                  <button className="flex items-center space-x-1 hover:text-blue-200 transition">
                    <span>{userName || 'Usuário'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 hidden group-hover:block">
                    <Link href="/profile" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Meu Perfil</Link>
                    <Link href="/settings" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Configurações</Link>
                    <Link href="/logout" className="block px-4 py-2 text-gray-800 hover:bg-gray-100">Sair</Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login" className="hover:text-blue-200 transition">Entrar</Link>
                <Link href="/register" className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100 transition">
                  Registrar
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white focus:outline-none"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-3 border-t border-blue-500 mt-4">
            <div className="flex flex-col space-y-3">
              <Link href="/features" className="hover:text-blue-200 transition">Funcionalidades</Link>
              <Link href="/pricing" className="hover:text-blue-200 transition">Preços</Link>
              <Link href="/about" className="hover:text-blue-200 transition">Sobre</Link>
              
              {isLoggedIn ? (
                <>
                  <Link href="/dashboard" className="hover:text-blue-200 transition">Dashboard</Link>
                  <Link href="/profile" className="hover:text-blue-200 transition">Meu Perfil</Link>
                  <Link href="/settings" className="hover:text-blue-200 transition">Configurações</Link>
                  <Link href="/logout" className="hover:text-blue-200 transition">Sair</Link>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-blue-200 transition">Entrar</Link>
                  <Link href="/register" className="px-4 py-2 bg-white text-blue-600 rounded hover:bg-gray-100 transition inline-block w-max">
                    Registrar
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
} 