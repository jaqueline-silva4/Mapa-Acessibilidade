
import { NavLink } from 'react-router-dom'
import './Navbar.css'

const links = [
  { label: 'Início', href: '/' },
  { label: 'Instituições', href: '/instituicoes' },
  { label: 'Mapa', href: '/mapa' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'FAQ', href: '/faq' },
]

export default function Navbar() {
  return (
    <nav className="navbar" aria-label="Navegação principal">
      <ul className="navbar-list">
        {links.map((link) => (
          <li key={link.href}>
            <NavLink
              to={link.href}
              end={link.href === '/'}
              className={({ isActive }) =>
                isActive ? 'active' : ''
              }
            >
              {link.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
