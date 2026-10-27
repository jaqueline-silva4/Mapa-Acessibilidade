
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'
import AccessibilityBar from '../components/AccessibilityBar'

function MainLayout() {
  const [highContrast, setHighContrast] = useState(false)
  const [fontScale, setFontScale] = useState(1)

  return (
    <div
      className={`app-layout ${highContrast ? 'high-contrast' : ''}`}
      style={{ fontSize: `${fontScale * 100}%` }}
    >
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <AccessibilityBar
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontScale={fontScale}
        setFontScale={setFontScale}
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
    </div>
  )
}

export default MainLayout
