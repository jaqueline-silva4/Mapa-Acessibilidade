
import Navbar from './Navbar'
import './Header.css'

const Header = () => {
  return (
    <header className="header">
      <a
        className="header-brand"
        href="#inicio"
        aria-label="Acessa+ - Início"
      >
        <img
          className="header-logo"
          src="/logo-acessa.png"
          alt="Acessa+"
        />
      </a>

      <Navbar />

      <a className="header-login" href="#login">
        Login
      </a>
    </header>
  )
}

export default Header
