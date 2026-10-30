import { BrowserRouter, Routes, Route } from 'react-router-dom'

import MainLayout from './layouts/MainLayout'

import Home from './pages/Home'
import Instituicoes from './pages/Instituicoes'
import Mapa from './pages/Mapa'
import Sobre from './pages/Sobre'
import FAQ from './pages/FAQ'
import Login from './pages/Login'
import Acessibilidade from './pages/Acessibilidade'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/instituicoes" element={<Instituicoes />} />
          <Route path="/mapa" element={<Mapa />} />
          <Route path="/sobre" element={<Sobre />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/login" element={<Login />} />
          <Route path="/acessibilidade" element={<Acessibilidade/>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App