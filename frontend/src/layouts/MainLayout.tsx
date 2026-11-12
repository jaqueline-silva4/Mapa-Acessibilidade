import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AccessibilityBar from '../components/AccessibilityBar'
import VLibras from '../components/VLibras'

export type Tema = 'claro' | 'escuro'

const CHAVE_TEMA = 'tema'

// Usa a escolha salva ou, na primeira visita, a preferência do sistema.
function temaInicial(): Tema {
  try {
    const salvo = window.localStorage.getItem(CHAVE_TEMA)
    if (salvo === 'claro' || salvo === 'escuro') return salvo
  } catch {
    // O armazenamento pode estar bloqueado; segue com a preferência do sistema.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'escuro'
    : 'claro'
}

function MainLayout() {
  const [highContrast, setHighContrast] = useState(false)
  const [fontScale, setFontScale] = useState(1)
  const [tema, setTemaEstado] = useState<Tema>(temaInicial)

  // A escolha da pessoa é salva para as próximas visitas.
  function setTema(novoTema: Tema) {
    setTemaEstado(novoTema)

    try {
      window.localStorage.setItem(CHAVE_TEMA, novoTema)
    } catch {
      // Sem armazenamento, o tema vale apenas nesta visita.
    }
  }

  // O atributo fica na raiz para cobrir o fundo da página e os popups do mapa.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', tema)
  }, [tema])

  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-scale',
      String(fontScale)
    )

    return () => {
      document.documentElement.style.removeProperty('--font-scale')
    }
  }, [fontScale])

  return (
    <div
      className={`app-layout ${highContrast ? 'high-contrast' : ''}`}
    >
      
   <a
      className="skip-link"
      href="#conteudo-principal"
      onClick={() => {
        requestAnimationFrame(() => {
          document
            .getElementById('conteudo-principal')
            ?.focus()
        })
      }}
    >
      Pular para o conteúdo principal
    </a>


      <AccessibilityBar
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontScale={fontScale}
        setFontScale={setFontScale}
        tema={tema}
        setTema={setTema}
      />

      <Header />

      <main
        id="conteudo-principal"
        tabIndex={-1}
        className="main-content"
      >
        <Outlet />
      </main>

      <Footer />

      <VLibras />
    </div>
  )
}

export default MainLayout
