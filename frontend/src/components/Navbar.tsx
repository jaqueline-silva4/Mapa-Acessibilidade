import { NavLink } from 'react-router-dom'
import './Navbar.css'

const links = [
  { label: 'Início', href: '/' },
  { label: 'Sobre', href: '/sobre' },
  { label: 'FAQ', href: '/faq' },
]

interface NavbarProps {
  onNavigate?: () => void
}

export default function Navbar({ onNavigate }: NavbarProps) {
  return (
    <nav id="menu-principal" tabIndex={-1} className="navbar" aria-label="Navegação principal">
      <ul className="navbar-list">
        {links.map((link) => (
          <li key={link.href}>
            <NavLink
              to={link.href}
              end={link.href === '/'}
              onClick={onNavigate}
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
