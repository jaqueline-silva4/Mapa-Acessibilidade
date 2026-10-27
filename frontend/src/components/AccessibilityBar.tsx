
import './AccessibilityBar.css'

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
  return (
    <div className="accessibility-bar" aria-label="Recursos de acessibilidade">
      <span className="accessibility-bar-title">
        Acessibilidade
      </span>

      <div className="accessibility-controls">
        <button
          type="button"
          onClick={() => setHighContrast(!highContrast)}
          aria-pressed={highContrast}
        >
          Alto contraste
        </button>

        <button
          type="button"
          onClick={() => setFontScale(Math.min(fontScale + 0.1, 1.5))}
          disabled={fontScale >= 1.5}
          aria-label="Aumentar tamanho do texto"
        >
          A+
        </button>

        <button
          type="button"
          onClick={() => setFontScale(Math.max(fontScale - 0.1, 0.8))}
          disabled={fontScale <= 0.8}
          aria-label="Diminuir tamanho do texto"
        >
          A−
        </button>

        <button
          type="button"
          onClick={() => {
            setFontScale(1)
            setHighContrast(false)
          }}
        >
          Redefinir
        </button>
      </div>
    </div>
  )
}
