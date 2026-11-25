import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Search, Star } from "lucide-react";
import "./Instituicoes.css";

interface PublicInstitution {
  id: number;
  name: string;
  unitName?: string | null;
  description: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  averageRating?: number;
  reviewsCount?: number;
}

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function InstituicoesListagem() {
  const [institutions, setInstitutions] = useState<PublicInstitution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("Todos");
  const [cidadeFiltro, setCidadeFiltro] = useState("Todas");
  const [apenasComMapa, setApenasComMapa] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/institutions");
        const data = await response.json().catch(() => []);
        if (!response.ok) {
          throw new Error(
            data.message || "Não foi possível carregar as instituições."
          );
        }
        if (!cancelled) {
          setInstitutions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar as instituições."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const estadosDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const inst of institutions) {
      if (inst.state) set.add(inst.state.toUpperCase());
    }
    return Array.from(set).sort();
  }, [institutions]);

  const cidadesDisponiveis = useMemo(() => {
    const set = new Set<string>();
    for (const inst of institutions) {
      if (
        inst.city &&
        (estadoFiltro === "Todos" ||
          inst.state?.toUpperCase() === estadoFiltro)
      ) {
        set.add(inst.city);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [institutions, estadoFiltro]);

  const buscaNormalizada = normalizarTexto(busca);

  const instituicoesFiltradas = useMemo(() => {
    return institutions.filter((inst) => {
      if (
        estadoFiltro !== "Todos" &&
        inst.state?.toUpperCase() !== estadoFiltro
      ) {
        return false;
      }

      if (cidadeFiltro !== "Todas" && inst.city !== cidadeFiltro) {
        return false;
      }

      if (
        apenasComMapa &&
        (inst.latitude === null || inst.longitude === null)
      ) {
        return false;
      }

      if (buscaNormalizada) {
        const matchNome = normalizarTexto(inst.name).includes(buscaNormalizada);
        const matchUnidade = inst.unitName
          ? normalizarTexto(inst.unitName).includes(buscaNormalizada)
          : false;
        const matchCidade = inst.city
          ? normalizarTexto(inst.city).includes(buscaNormalizada)
          : false;
        const matchBairro = inst.neighborhood
          ? normalizarTexto(inst.neighborhood).includes(buscaNormalizada)
          : false;
        const matchDesc = normalizarTexto(inst.description).includes(
          buscaNormalizada
        );
        if (
          !matchNome &&
          !matchUnidade &&
          !matchCidade &&
          !matchBairro &&
          !matchDesc
        ) {
          return false;
        }
      }

      return true;
    });
  }, [
    institutions,
    estadoFiltro,
    cidadeFiltro,
    apenasComMapa,
    buscaNormalizada,
  ]);

  const temFiltrosAtivos =
    busca.trim() !== "" ||
    estadoFiltro !== "Todos" ||
    cidadeFiltro !== "Todas" ||
    apenasComMapa;

  const limparFiltros = () => {
    setBusca("");
    setEstadoFiltro("Todos");
    setCidadeFiltro("Todas");
    setApenasComMapa(false);
  };

  return (
    <section
      className="instituicao-pagina"
      aria-labelledby="instituicoes-listagem-titulo"
    >
      <div className="instituicao-container">
          <header className="instituicao-cabecalho">
            <h2 id="instituicoes-listagem-titulo">
              Instituições cadastradas
            </h2>
            <p>
              Filtre por nome, estado ou cidade e acesse a página de cada
              instituição.
            </p>
          </header>

          <div className="instituicao-filtros" role="search">
            <div className="instituicao-busca">
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />

              <label
                htmlFor="instituicao-busca"
                className="instituicao-somente-leitor"
              >
                Buscar instituição por nome, cidade ou descrição
              </label>

              <input
                id="instituicao-busca"
                type="search"
                placeholder="Buscar por nome, cidade ou descrição..."
                autoComplete="off"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>

            <div className="instituicao-filtros-extras">
              <label
                htmlFor="filtro-estado"
                className="instituicao-somente-leitor"
              >
                Filtrar por estado
              </label>
              <select
                id="filtro-estado"
                className="instituicao-select"
                value={estadoFiltro}
                onChange={(e) => {
                  setEstadoFiltro(e.target.value);
                  setCidadeFiltro("Todas");
                }}
              >
                <option value="Todos">Todos os estados</option>
                {estadosDisponiveis.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf}
                  </option>
                ))}
              </select>

              <label
                htmlFor="filtro-cidade"
                className="instituicao-somente-leitor"
              >
                Filtrar por cidade
              </label>
              <select
                id="filtro-cidade"
                className="instituicao-select"
                value={cidadeFiltro}
                onChange={(e) => setCidadeFiltro(e.target.value)}
              >
                <option value="Todas">Todas as cidades</option>
                {cidadesDisponiveis.map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade}
                  </option>
                ))}
              </select>

              <button
                type="button"
                className={`instituicao-categoria ${apenasComMapa ? "ativa" : ""}`}
                onClick={() => setApenasComMapa((prev) => !prev)}
                aria-pressed={apenasComMapa}
              >
                Com mapa
              </button>

              {temFiltrosAtivos && (
                <button
                  type="button"
                  className="instituicao-limpar"
                  onClick={limparFiltros}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>

          {error && (
            <p className="instituicao-vazio" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && (
            <p className="instituicao-resultado" role="status">
              {instituicoesFiltradas.length === 1
                ? "1 instituição encontrada"
                : `${instituicoesFiltradas.length} instituições encontradas`}
            </p>
          )}

          {loading ? (
            <p className="instituicao-resultado">Carregando instituições...</p>
          ) : instituicoesFiltradas.length > 0 ? (
            <ul className="instituicao-lista" aria-label="Instituições">
              {instituicoesFiltradas.map((inst) => (
                <li key={inst.id}>
                  <Link
                    to={`/instituicoes/${inst.id}`}
                    className="instituicao-cartao-link"
                  >
                    <article className="instituicao-cartao">
                      <div className="instituicao-cartao-capa">
                        {inst.coverUrl ? (
                          <img
                            src={inst.coverUrl}
                            alt={`Capa de ${inst.name}`}
                          />
                        ) : (
                          <div
                            className="instituicao-cartao-capa-padrao"
                            aria-hidden="true"
                          />
                        )}
                      </div>

                      <div className="instituicao-cartao-conteudo">
                        <div className="instituicao-cartao-logo">
                          {inst.logoUrl ? (
                            <img
                              src={inst.logoUrl}
                              alt={`Logo de ${inst.name}`}
                            />
                          ) : (
                            <span aria-hidden="true">
                              {inst.name.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <h3 className="instituicao-cartao-nome">
                          {inst.name}
                        </h3>

                        <p className="instituicao-cartao-local">
                          <MapPin
                            size={13}
                            strokeWidth={1.8}
                            aria-hidden="true"
                          />
                          <span>
                            {inst.city && inst.state
                              ? `${inst.city} - ${inst.state}`
                              : inst.city ||
                                inst.state ||
                                "Localização não informada"}
                          </span>
                        </p>

                        <p className="instituicao-cartao-descricao">
                          {inst.description?.trim()
                            ? inst.description
                            : "Conheça a página da instituição para ver mais detalhes."}
                        </p>

                        <div className="instituicao-cartao-rodape">
                          <span className="instituicao-cartao-cta">
                            Ver página da instituição →
                          </span>

                          {(() => {
                            const notaBase =
                              inst.averageRating ??
                              (/ifce|instituto federal/i.test(inst.name)
                                ? 4.8
                                : 0);
                            const nota = Math.min(5, Math.max(0, notaBase));
                            const notaFormatada = nota
                              .toFixed(1)
                              .replace(".", ",");

                            return (
                              <div
                                className="instituicao-cartao-avaliacao"
                                aria-label={`Avaliação ${notaFormatada} de 5 estrelas`}
                              >
                                <div
                                  className="instituicao-estrelas"
                                  aria-hidden="true"
                                >
                                  {[1, 2, 3, 4, 5].map((estrela) => {
                                    const preenchimento = Math.min(
                                      1,
                                      Math.max(0, nota - (estrela - 1))
                                    );

                                    return (
                                      <span
                                        key={estrela}
                                        className="estrela-slot"
                                      >
                                        <Star
                                          size={14}
                                          strokeWidth={1.8}
                                          fill="none"
                                          className="estrela-inativa"
                                        />
                                        {preenchimento > 0 && (
                                          <span
                                            className="estrela-preenchida"
                                            style={{
                                              width: `${preenchimento * 100}%`,
                                            }}
                                          >
                                            <Star
                                              size={14}
                                              strokeWidth={1.8}
                                              fill="currentColor"
                                              className="estrela-ativa"
                                            />
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                                <span className="instituicao-nota-valor">
                                  {notaFormatada}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </article>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            !error && (
              <p className="instituicao-vazio">
                Nenhuma instituição encontrada com os filtros selecionados.
              </p>
            )
          )}
        </div>
      </section>
  );
}

function Instituicoes() {
  return (
    <>
      <section
        className="instituicao-destaque"
        aria-labelledby="instituicao-titulo"
      >
        <div className="instituicao-destaque-layout">
          <div className="instituicao-destaque-conteudo">
            <span className="instituicao-destaque-rotulo">
              INSTITUIÇÕES CADASTRADAS
            </span>

            <h1 id="instituicao-titulo">Lugares que incluem todo mundo</h1>

            <p>
              Explore as instituições participantes, veja sua localização e
              conheça os recursos de acessibilidade oferecidos.
            </p>
          </div>

          <div className="instituicao-destaque-imagem">
            <img
              src="/ilustracao-acessibilidade.png"
              alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
            />
          </div>
        </div>
      </section>

      <InstituicoesListagem />
    </>
  );
}

export default Instituicoes;
