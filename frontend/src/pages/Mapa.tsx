import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import { List, Map as MapIcon, MapPin } from 'lucide-react'
import 'leaflet/dist/leaflet.css'

import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

import './Mapa.css'

type InstituicaoMapa = {
  id: number
  name: string
  description: string
  latitude: number
  longitude: number
}

type Estado = 'carregando' | 'erro' | 'pronto'
type Visualizacao = 'mapa' | 'lista'

// Ícone padrão do Leaflet, importado explicitamente para funcionar com o Vite.
const iconePadrao = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

// Centro aproximado de Iguatu/CE, usado como posição inicial do mapa.
const CENTRO_PADRAO: [number, number] = [-6.3593, -39.2988]

// Localizações inválidas não são exibidas no mapa (UC14 - FE03).
function temLocalizacaoValida(instituicao: InstituicaoMapa): boolean {
  const { latitude, longitude } = instituicao
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  )
}

function resumir(texto: string, limite = 140): string {
  const limpo = texto.trim()
  return limpo.length > limite ? `${limpo.slice(0, limite).trimEnd()}…` : limpo
}

// Ajusta o enquadramento do mapa para mostrar todas as instituições.
function AjustarEnquadramento({
  instituicoes,
}: {
  instituicoes: InstituicaoMapa[]
}) {
  const mapa = useMap()

  useEffect(() => {
    if (instituicoes.length === 0) return

    const limites = L.latLngBounds(
      instituicoes.map((i) => [i.latitude, i.longitude] as [number, number])
    )
    mapa.fitBounds(limites, { padding: [40, 40], maxZoom: 16 })
  }, [instituicoes, mapa])

  return null
}

function Mapa() {
  const [instituicoes, setInstituicoes] = useState<InstituicaoMapa[]>([])
  const [estado, setEstado] = useState<Estado>('carregando')
  const [visualizacao, setVisualizacao] = useState<Visualizacao>('mapa')

  // Incrementado para repetir a consulta quando ocorre um erro.
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const controlador = new AbortController()

    fetch('/api/institutions/map', { signal: controlador.signal })
      .then((resposta) => {
        if (!resposta.ok) {
          throw new Error(`Falha ao carregar o mapa (${resposta.status})`)
        }
        return resposta.json() as Promise<InstituicaoMapa[]>
      })
      .then((dados) => {
        setInstituicoes(dados)
        setEstado('pronto')
      })
      .catch((erro: unknown) => {
        if (erro instanceof DOMException && erro.name === 'AbortError') return
        setEstado('erro')
      })

    return () => controlador.abort()
  }, [tentativa])

  const comLocalizacao = useMemo(
    () => instituicoes.filter(temLocalizacaoValida),
    [instituicoes]
  )

  return (
    <section className="mapa-page" aria-labelledby="mapa-titulo">
      <header className="mapa-header">
        <h1 id="mapa-titulo">Mapa de instituições</h1>
        <p>
          Veja onde ficam as instituições cadastradas e escolha uma para
          conhecer os recursos de acessibilidade.
        </p>
      </header>

      <div
        className="mapa-alternar"
        role="group"
        aria-label="Forma de visualização"
      >
        <button
          type="button"
          className="mapa-alternar-botao"
          aria-pressed={visualizacao === 'mapa'}
          onClick={() => setVisualizacao('mapa')}
        >
          <MapIcon aria-hidden="true" size={18} />
          Visualização em mapa
        </button>
        <button
          type="button"
          className="mapa-alternar-botao"
          aria-pressed={visualizacao === 'lista'}
          onClick={() => setVisualizacao('lista')}
        >
          <List aria-hidden="true" size={18} />
          Visualização em lista
        </button>
      </div>

      {estado === 'carregando' && (
        <p className="mapa-mensagem" role="status">
          Carregando instituições…
        </p>
      )}

      {estado === 'erro' && (
        <div className="mapa-mensagem mapa-mensagem-erro" role="alert">
          <p>O mapa não pôde ser carregado. Tente novamente.</p>
          <button
            type="button"
            className="mapa-botao"
            onClick={() => {
              setEstado('carregando')
              setTentativa((n) => n + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && comLocalizacao.length === 0 && (
        <p className="mapa-mensagem" role="status">
          Não há instituições disponíveis para exibição no mapa.
        </p>
      )}

      {estado === 'pronto' &&
        comLocalizacao.length > 0 &&
        visualizacao === 'mapa' && (
          <div className="mapa-container">
            <MapContainer
              center={CENTRO_PADRAO}
              zoom={13}
              scrollWheelZoom
              className="mapa-leaflet"
              aria-label="Mapa com a localização das instituições. Use a visualização em lista para uma alternativa em texto."
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores do OpenStreetMap</a>'
                url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AjustarEnquadramento instituicoes={comLocalizacao} />

              {comLocalizacao.map((instituicao) => (
                <Marker
                  key={instituicao.id}
                  position={[instituicao.latitude, instituicao.longitude]}
                  icon={iconePadrao}
                  title={instituicao.name}
                  alt={`Marcador de ${instituicao.name}`}
                >
                  <Popup>
                    <div className="mapa-popup">
                      <h2>{instituicao.name}</h2>
                      <p>{resumir(instituicao.description)}</p>
                      <Link
                        className="mapa-botao"
                        to={`/instituicao/${instituicao.id}`}
                      >
                        Ver detalhes
                        <span className="sr-only">
                          {' '}
                          de {instituicao.name}
                        </span>
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}

      {estado === 'pronto' &&
        comLocalizacao.length > 0 &&
        visualizacao === 'lista' && (
          <ul className="mapa-lista" aria-label="Instituições cadastradas">
            {comLocalizacao.map((instituicao) => (
              <li key={instituicao.id} className="mapa-lista-item">
                <MapPin aria-hidden="true" size={22} />
                <div>
                  <h2>{instituicao.name}</h2>
                  <p>{resumir(instituicao.description)}</p>
                  <Link
                    className="mapa-botao"
                    to={`/instituicao/${instituicao.id}`}
                  >
                    Ver detalhes
                    <span className="sr-only"> de {instituicao.name}</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
    </section>
  )
}

export default Mapa
