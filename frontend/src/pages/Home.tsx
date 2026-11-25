import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Globe, Building2, MapPin } from 'lucide-react'
import { InstituicoesListagem } from './Instituicoes'
import Mapa from './Mapa'
import { ContatoFormulario, ContatoMotivos } from './Contato'

import './Home.css'

function Home() {
  const { hash } = useLocation()

  useEffect(() => {
    if (!hash) return
    const target = document.getElementById(hash.slice(1))
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [hash])

  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('.home-reveal')
    if (elements.length === 0) return

    if (!('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('is-visible'))
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    )

    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return (
    <>
      <section
        className="hero"
        id="inicio"
        aria-labelledby="hero-titulo"
      >
        <div className="hero-content">
          <span className="hero-eyebrow">
            PLATAFORMA DE ACESSIBILIDADE
          </span>

          <h1 id="hero-titulo">
            Acessibilidade
            <br />
            para todos!
          </h1>

          <p>
            Encontre instituições acessíveis, consulte recursos disponíveis e
            ajude a construir ambientes mais inclusivos.
          </p>

          <div className="hero-actions">
            <Link className="button button-primary" to="/sobre">
              Sobre nós
            </Link>
          </div>
        </div>

        <div className="hero-image">
          <img
            src="/ilustracao-acessibilidade.png"
            alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
          />
        </div>
      </section>

      <div id="instituicoes-home" className="home-reveal" tabIndex={-1}>
        <InstituicoesListagem />
      </div>

      <div id="mapa-home" className="home-mapa-secao home-reveal" tabIndex={-1}>
        <div className="home-mapa-container">
          <Mapa embedded />
        </div>
      </div>

      <section
        id="contato-home"
        className="home-contato-secao home-reveal"
        aria-label="Fale conosco"
      >
        <div className="home-contato-container">
          <ContatoMotivos />
          <ContatoFormulario />
        </div>
      </section>

      <section
        id="seja-parceiro"
        className="home-promo-secao home-reveal"
        aria-labelledby="home-promo-titulo"
      >
        <div className="home-promo-container">
          <div className="home-promo-conteudo">
            <span className="home-promo-eyebrow">PARA INSTITUIÇÕES</span>

            <h2 id="home-promo-titulo">
              Traga sua instituição para o Acessa+
            </h2>

            <p>
              Tenha uma página exclusiva para apresentar a estrutura de
              acessibilidade da sua instituição, aparecer no mapa da cidade e
              fortalecer a inclusão.
            </p>

            <div className="home-promo-acoes">
              <Link className="home-promo-botao" to="/solicitar-cadastro">
                Quero cadastrar minha instituição
              </Link>
            </div>
          </div>

          <ul
            className="home-promo-destaques"
            aria-label="Benefícios para instituições"
          >
            <li className="home-promo-item">
              <span className="home-promo-icone" aria-hidden="true">
                <Building2 size={20} />
              </span>
              <div>
                <h3>Página pública dedicada</h3>
                <p>
                  Divulgue capa, logo, descrição e recursos de acessibilidade.
                </p>
              </div>
            </li>

            <li className="home-promo-item">
              <span className="home-promo-icone" aria-hidden="true">
                <Globe size={20} />
              </span>
              <div>
                <h3>Link público exclusivo</h3>
                <p>
                  Compartilhe a página oficial da sua instituição no Acessa+ com
                  toda a comunidade.
                </p>
              </div>
            </li>

            <li className="home-promo-item">
              <span className="home-promo-icone" aria-hidden="true">
                <MapPin size={20} />
              </span>
              <div>
                <h3>Presença no mapa e avaliações</h3>
                <p>
                  Facilite a localização pelo Google Maps e receba feedback real.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </section>
    </>
  )
}

export default Home
