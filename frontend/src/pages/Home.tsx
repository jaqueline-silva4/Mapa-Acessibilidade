
import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Search } from 'lucide-react'

import './Home.css'

type InstituicaoBusca = {
  id: number
  name: string
  description: string
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}

type EstadoBusca = 'inicial' | 'carregando' | 'erro' | 'pronto'

const ATRASO_BUSCA_MS = 300

function resumir(texto: string, limite = 120): string {
  const limpo = texto.trim()

  return limpo.length > limite
    ? `${limpo.slice(0, limite).trimEnd()}…`
    : limpo
}

function Home() {
  const [busca, setBusca] = useState('')
  const [termo, setTermo] = useState('')
  const [avisoCampoVazio, setAvisoCampoVazio] = useState(false)
  const [estado, setEstado] = useState<EstadoBusca>('inicial')
  const [resultados, setResultados] = useState<InstituicaoBusca[]>([])
  const [tentativa, setTentativa] = useState(0)

  // Atualiza o termo pesquisado depois que a pessoa para de digitar.
  useEffect(() => {
    const temporizador = window.setTimeout(
      () => setTermo(busca.trim()),
      ATRASO_BUSCA_MS
    )

    return () => window.clearTimeout(temporizador)
  }, [busca])

  // Consulta as instituições que correspondem ao termo informado.
  useEffect(() => {
    if (termo === '') return

    const controlador = new AbortController()

    fetch(`/api/institutions?search=${encodeURIComponent(termo)}`, {
      signal: controlador.signal,
    })
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(`Falha na busca (${resposta.status})`)
        }

        return resposta.json() as Promise<InstituicaoBusca[]>
      })
      .then((dados) => {
        setResultados(dados)
        setEstado('pronto')
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === 'AbortError') {
          return
        }

        setEstado('erro')
      })

    return () => controlador.abort()
  }, [termo, tentativa])

  function aoDigitar(valor: string) {
    setBusca(valor)
    setAvisoCampoVazio(false)

    if (valor.trim() === '') {
      setTermo('')
      setEstado('inicial')
      setResultados([])
    } else {
      setEstado('carregando')
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    if (busca.trim() === '') {
      setAvisoCampoVazio(true)
      return
    }

    setAvisoCampoVazio(false)
    setTermo(busca.trim())
  }

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
            <a
              className="button button-primary"
              href="#busca-instituicao"
            >
              <img
                className="search-icon"
                src="/lupa.png"
                alt=""
                aria-hidden="true"
              />
              Buscar instituição
            </a>

            <Link className="button button-secondary" to="/mapa">
              Ver no mapa
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

      <section
        className="home-busca"
        id="busca-instituicao"
        tabIndex={-1}
        aria-labelledby="home-busca-titulo"
      >
        <div className="home-busca-container">
          <h2 id="home-busca-titulo">
            Busque uma instituição
          </h2>

          <p className="home-busca-texto">
            Digite o nome ou a cidade para ver as instituições e os recursos de
            acessibilidade que elas oferecem.
          </p>

          <form
            className="home-busca-form"
            role="search"
            onSubmit={aoEnviar}
            noValidate
          >
            <label
              htmlFor="home-busca-campo"
              className="home-busca-rotulo"
            >
              Nome ou cidade da instituição
            </label>

            <div className="home-busca-linha">
              <input
                id="home-busca-campo"
                type="search"
                autoComplete="off"
                placeholder="Ex.: Biblioteca Municipal"
                value={busca}
                onChange={(evento) => aoDigitar(evento.target.value)}
                aria-invalid={avisoCampoVazio}
                aria-describedby={
                  avisoCampoVazio ? 'home-busca-aviso' : undefined
                }
              />

              <button
                type="submit"
                className="button button-primary"
                aria-label="Buscar instituição"
              >
                <Search aria-hidden="true" size={18} />
                Buscar
              </button>
            </div>

            {avisoCampoVazio && (
              <p
                id="home-busca-aviso"
                className="home-busca-aviso"
                role="alert"
              >
                Informe o nome da instituição que deseja encontrar.
              </p>
            )}
          </form>

          <div
            className="home-busca-resultados"
            aria-live="polite"
          >
            {estado === 'carregando' && (
              <ul
                className="home-busca-lista"
                aria-label="Carregando resultados"
              >
                {[0, 1, 2].map((item) => (
                  <li
                    key={item}
                    className="home-cartao home-cartao-esqueleto"
                    aria-hidden="true"
                  />
                ))}
              </ul>
            )}

            {estado === 'carregando' && (
              <p className="home-busca-status" role="status">
                Buscando instituições…
              </p>
            )}

            {estado === 'erro' && (
              <div
                className="home-busca-status home-busca-erro"
                role="alert"
              >
                <p>Não foi possível buscar as instituições agora.</p>

                <button
                  type="button"
                  className="button button-secondary"
                  onClick={() => {
                    setEstado('carregando')
                    setTentativa((n) => n + 1)
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}

            {estado === 'pronto' && resultados.length === 0 && (
              <p className="home-busca-status" role="status">
                Nenhuma instituição encontrada.
              </p>
            )}

            {estado === 'pronto' && resultados.length > 0 && (
              <>
                <p className="home-busca-status" role="status">
                  {resultados.length === 1
                    ? '1 instituição encontrada'
                    : `${resultados.length} instituições encontradas`}
                </p>

                <ul
                  className="home-busca-lista"
                  aria-label="Instituições encontradas"
                >
                  {resultados.map((instituicao) => (
                    <li key={instituicao.id}>
                      <article className="home-cartao">
                        <Building2 aria-hidden="true" size={22} />

                        <h3>{instituicao.name}</h3>

                        <p className="home-cartao-local">
                          <MapPin aria-hidden="true" size={14} />

                          <span>
                            {instituicao.street}, {instituicao.number} -{' '}
                            {instituicao.neighborhood}, {instituicao.city} -{' '}
                            {instituicao.state}
                          </span>
                        </p>

                        <p>{resumir(instituicao.description)}</p>

                        <Link
                          className="button button-primary"
                          to={`/instituicao/${instituicao.id}`}
                        >
                          Ver detalhes
                          <span className="home-somente-leitor">
                            {' '}
                            de {instituicao.name}
                          </span>
                        </Link>
                      </article>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </section>
    </>
  )
}

export default Home
