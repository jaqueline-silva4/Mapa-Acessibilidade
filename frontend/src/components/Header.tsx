import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Navbar from './Navbar'
import './Header.css'

const Header = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <Link
        className="header-brand"
        to="/"
        aria-label="Acessa+ - Início"
      >
        <img
          className="header-logo"
          src="/logo-acessa.png"
          alt=""
        />
      </Link>

      <Navbar />

      <div className="header-actions">
        {isAuthenticated ? (
          <>
            {isAdmin && (
              <Link className="header-admin-link" to="/admin/instituicoes">
                Painel Admin
              </Link>
            )}
            {user?.role === 'INSTITUTION' && (
              <Link
                className="header-admin-link"
                to="/instituicao/configuracoes"
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
          <Link className="header-login" to="/#contato-home">
            Fale Conosco
          </Link>
        )}
      </div>
    </header>
  )
}

export default Header
