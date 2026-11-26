import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Navbar from './Navbar'
import './Header.css'

interface HeaderAccessibilityProps {
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void
  fontScale: number
  setFontScale: (scale: number) => void
  tema: 'claro' | 'escuro'
  setTema: (tema: 'claro' | 'escuro') => void
}

interface HeaderProps {
  accessibility?: HeaderAccessibilityProps
}

const Header = ({ accessibility }: HeaderProps) => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    closeMenu()
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <Link
        className="header-brand"
        to="/"
        aria-label="Acessa+ - Início"
        onClick={closeMenu}
      >
        <img
          className="header-logo"
          src="/logo-acessa.png"
          alt=""
        />
      </Link>

      <button
        type="button"
        className="header-menu-toggle"
        aria-expanded={menuOpen}
        aria-controls="header-mobile-menu"
        aria-label={menuOpen ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {menuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      <div
        id="header-mobile-menu"
        className={`header-menu-panel ${menuOpen ? 'aberto' : ''}`}
      >
        <Navbar onNavigate={closeMenu} />

        <div className="header-actions">
          {isAuthenticated ? (
            <>
              {isAdmin && (
                <Link
                  className="header-admin-link"
                  to="/admin/instituicoes"
                  onClick={closeMenu}
                >
                  Painel Admin
                </Link>
              )}
              {user?.role === 'INSTITUTION' && (
                <Link
                  className="header-admin-link"
                  to="/instituicao/configuracoes"
                  onClick={closeMenu}
                >
                  Minha Instituição
                </Link>
              )}
              <span className="header-user" title={user?.name}>
                {user?.name}
              </span>
              <button
                type="button"
                className="header-login header-logout"
                onClick={handleLogout}
              >
                Sair
              </button>
            </>
          ) : (
              <Link
              className="header-login"
              to="/#contato-home"
              onClick={closeMenu}
            >
              Fale Conosco
            </Link>
          )}
        </div>

        {accessibility && (
          <div
            className="header-mobile-accessibility"
            aria-label="Opções de acessibilidade"
          >
            <div className="header-a11y-topo">
              <span className="header-a11y-titulo">Acessibilidade</span>
              <Link
                className="header-a11y-link"
                to="/acessibilidade"
                onClick={closeMenu}
              >
                Saiba mais
              </Link>
            </div>

            <div className="header-a11y-controles">
              <div className="header-a11y-texto" role="group" aria-label="Tamanho do texto">
                <button
                  type="button"
                  onClick={() =>
                    accessibility.setFontScale(
                      Math.max(0.85, Number((accessibility.fontScale - 0.1).toFixed(2)))
                    )
                  }
                  aria-label="Diminuir tamanho do texto"
                  disabled={accessibility.fontScale <= 0.85}
                >
                  A-
                </button>
                <button
                  type="button"
                  onClick={() => accessibility.setFontScale(1)}
                  aria-label="Restaurar tamanho padrão do texto"
                  disabled={accessibility.fontScale === 1}
                >
                  A
                </button>
                <button
                  type="button"
                  onClick={() =>
                    accessibility.setFontScale(
                      Math.min(1.45, Number((accessibility.fontScale + 0.1).toFixed(2)))
                    )
                  }
                  aria-label="Aumentar tamanho do texto"
                  disabled={accessibility.fontScale >= 1.45}
                >
                  A+
                </button>
              </div>

              <button
                type="button"
                className="header-a11y-toggle"
                aria-pressed={accessibility.highContrast}
                onClick={() =>
                  accessibility.setHighContrast(!accessibility.highContrast)
                }
              >
                Alto contraste
              </button>

              <button
                type="button"
                className="header-a11y-toggle"
                aria-pressed={accessibility.tema === 'escuro'}
                onClick={() =>
                  accessibility.setTema(
                    accessibility.tema === 'claro' ? 'escuro' : 'claro'
                  )
                }
              >
                {accessibility.tema === 'claro' ? 'Tema escuro' : 'Tema claro'}
              </button>
            </div>

            <div className="header-a11y-atalhos">
              <a href="#conteudo-principal" onClick={closeMenu}>
                Ir para o conteúdo
              </a>
              <a href="#rodape" onClick={closeMenu}>
                Ir para o rodapé
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
