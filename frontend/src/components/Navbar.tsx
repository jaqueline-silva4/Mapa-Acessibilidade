
import { useState } from 'react'
import './Navbar.css'

const Navbar = () => {
  const [activeLink, setActiveLink] = useState('#inicio')

  const links = [
    { label: 'Início', href: '#inicio' },
    { label: 'Instituições', href: '#instituicoes' },
    { label: 'Mapa', href: '#mapa' },
    { label: 'Sobre', href: '#sobre' },
    { label: 'FAQ', href: '#faq' },
  ]

  return (
    <nav className="navbar" aria-label="Navegação principal">
      <ul className="navbar-list">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className={activeLink === link.href ? 'active' : ''}
              aria-current={activeLink === link.href ? 'location' : undefined}
              onClick={() => setActiveLink(link.href)}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default Navbar
