
import { BrowserRouter, Routes, Route } from 'react-router-dom'

import { AuthProvider } from './contexts/AuthContext'
import MainLayout from './layouts/MainLayout'
import VLibras from './components/VLibras'

import Home from './pages/Home'
import Instituicoes from './pages/Instituicoes'
import Mapa from './pages/Mapa'
import Sobre from './pages/Sobre'
import FAQ from './pages/FAQ'
import Login from './pages/Login'
import Acessibilidade from './pages/Acessibilidade'
import Contato from './pages/Contato'
import AdminInstituicoes from './pages/AdminInstituicoes'
import InstituicaoConfiguracoes from './pages/InstituicaoConfiguracoes'
import InstituicaoPublica from './pages/InstituicaoPublica'
import SolicitarCadastro from './pages/SolicitarCadastro'

import './App.css'

function App() {
  return (
    <AuthProvider>
      <VLibras />
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/instituicoes" element={<Instituicoes />} />
            <Route path="/mapa" element={<Mapa />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/acessibilidade" element={<Acessibilidade />} />
            <Route path="/contato" element={<Contato />} />
            <Route
              path="/solicitar-cadastro"
              element={<SolicitarCadastro />}
            />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/admin/instituicoes" element={<AdminInstituicoes />} />
          <Route path="/instituicoes/:id" element={<InstituicaoPublica />} />
          <Route
            path="/instituicao/configuracoes"
            element={<InstituicaoConfiguracoes />}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
