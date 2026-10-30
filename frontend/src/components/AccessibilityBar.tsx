import { useEffect } from 'react'
import './AccessibilityBar.css'
import { Link } from 'react-router-dom'

interface AccessibilityBarProps {
  highContrast: boolean
  setHighContrast: (enabled: boolean) => void
  fontScale: number
  setFontScale: (scale: number) => void
}

export default function AccessibilityBar({
  highContrast,
  setHighContrast,
  fontScale,
  setFontScale,
}: AccessibilityBarProps) {
  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      const target = event.target

      // Não executar atalhos enquanto a pessoa digita em campos.
      if (
        target instanceof HTMLElement &&
        (
          target.isContentEditable ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
        )
      ) {
        return
      }

      // Os atalhos exigem Alt + Shift, sem Ctrl ou tecla Windows/Command.
      if (
        !event.altKey ||
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey
      ) {
        return
      }

      // event.code identifica a tecla física, mesmo com Shift pressionado.
      const destinations: Record<string, string> = {
        Digit1: 'conteudo-principal',
        Digit2: 'menu-principal',
        Digit3: 'rodape',
      }

      const destinationId = destinations[event.code]

      if (!destinationId) {
        return
      }

      const destination = document.getElementById(destinationId)

      if (destination) {
        event.preventDefault()
        destination.focus()
        destination.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        })
      }
    }

    document.addEventListener('keydown', handleKeyboardShortcut)

    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcut)
    }
  }, [])

  return (
    <div className="accessibility-bar">
      <nav
        className="accessibility-shortcuts"
        aria-label="Atalhos de navegação"
      >
        <a href="#conteudo-principal">
          Ir para o conteúdo [1]
        </a>

        <a href="#menu-principal">
          Ir para o menu [2]
        </a>

        <a href="#rodape">
          Ir para o rodapé [3]
        </a>
      </nav>

      <div className="accessibility-controls">
        <Link to="/acessibilidade" className="accessibility-bar-title">
            Acessibilidade
        </Link>
        <div
          className="text-controls"
          role="group"
          aria-label="Tamanho do texto"
        >
          <span aria-hidden="true">Texto</span>

          <button
            type="button"
            onClick={() =>
              setFontScale(
                Math.max(Number((fontScale - 0.1).toFixed(1)), 0.8)
              )
            }
            disabled={fontScale <= 0.8}
            aria-label="Diminuir tamanho do texto"
          >
            A−
          </button>

          <button
            type="button"
            onClick={() => setFontScale(1)}
            disabled={fontScale === 1}
            aria-label="Restaurar tamanho normal do texto"
          >
            A
          </button>

          <button
            type="button"
            onClick={() =>
              setFontScale(
                Math.min(Number((fontScale + 0.1).toFixed(1)), 1.5)
              )
            }
            disabled={fontScale >= 1.5}
            aria-label="Aumentar tamanho do texto"
          >
            A+
          </button>
        </div>

        <button
          type="button"
          className="accessibility-toggle"
          onClick={() => setHighContrast(!highContrast)}
          aria-pressed={highContrast}
          aria-label="Alternar alto contraste"
        >
          ◐ Alto contraste
        </button>

        <button
          type="button"
          className="accessibility-toggle"
          onClick={() => {
            setFontScale(1)
            setHighContrast(false)
          }}
          aria-label="Restaurar tamanho do texto e desativar alto contraste"
        >
          ☼ Tema claro
        </button>
      </div>
    </div>
  )
}
