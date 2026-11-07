import { useState } from "react";
import type { LucideIcon } from "lucide-react";

import {
  Accessibility,
  Brain,
  Building2,
  Ear,
  Eye,
  MapPin,
  Monitor,
  Search,
  Star,
} from "lucide-react";

import "./Instituicoes.css";

type Categoria = "Física" | "Visual" | "Auditiva" | "Digital" | "Cognitiva";

type Instituicao = {
  id: number;
  nome: string;
  cidade: string;
  uf: string;
  setor: string;
  nota: number;
  categorias: Categoria[];
};

const instituicoes: Instituicao[] = [
  {
    id: 1,
    nome: "IFCE Campus Iguatu",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Educação",
    nota: 4.0,
    categorias: ["Física", "Visual", "Auditiva"],
  },
  {
    id: 2,
    nome: "Biblioteca Municipal",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Cultura",
    nota: 4.5,
    categorias: ["Física", "Digital"],
  },
  {
    id: 3,
    nome: "Hospital Regional",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Saúde",
    nota: 3.8,
    categorias: ["Física", "Auditiva", "Cognitiva"],
  },
  {
    id: 4,
    nome: "Centro de Formação Profissional",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Educação",
    nota: 4.2,
    categorias: ["Física", "Visual"],
  },
  {
    id: 5,
    nome: "Prefeitura Municipal",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Serviço público",
    nota: 3.5,
    categorias: ["Física", "Cognitiva"],
  },
  {
    id: 6,
    nome: "Museu da Cidade",
    cidade: "Iguatu",
    uf: "CE",
    setor: "Cultura",
    nota: 4.5,
    categorias: ["Visual", "Auditiva", "Digital"],
  },
];

const categorias: Categoria[] = [
  "Física",
  "Visual",
  "Auditiva",
  "Digital",
  "Cognitiva",
];

const iconesCategoria: Record<Categoria, LucideIcon> = {
  Física: Accessibility,
  Visual: Eye,
  Auditiva: Ear,
  Digital: Monitor,
  Cognitiva: Brain,
};

function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatarNota(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}

function Instituicoes() {
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<
    Categoria | "Todas"
  >("Todas");
  const buscaNormalizada = normalizarTexto(busca);

  const instituicoesFiltradas = instituicoes.filter((instituicao) => {
    const correspondeCategoria =
      categoriaSelecionada === "Todas" ||
      instituicao.categorias.includes(categoriaSelecionada);

    const correspondeBusca =
      buscaNormalizada === "" ||
      normalizarTexto(instituicao.nome).includes(buscaNormalizada) ||
      normalizarTexto(instituicao.cidade).includes(buscaNormalizada);

    return correspondeCategoria && correspondeBusca;
  });

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
              Veja avaliações e quais tipos de acessibilidade cada instituição
              oferece.
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
      <section className="instituicao-pagina">
        <div className="instituicao-container">
          <div className="instituicao-filtros" role="search">
            <div className="instituicao-busca">
              <Search size={16} strokeWidth={1.8} aria-hidden="true" />

              <label
                htmlFor="instituicao-busca"
                className="instituicao-somente-leitor"
              >
                Buscar instituição por nome ou cidade
              </label>

              <input
                id="instituicao-busca"
                type="search"
                placeholder="Buscar instituição"
                autoComplete="off"
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
              />
            </div>

            <div
              className="instituicao-categorias"
              role="group"
              aria-label="Filtrar por tipo de acessibilidade"
            >
              <button
                type="button"
                className={`instituicao-categoria ${
                  categoriaSelecionada === "Todas" ? "ativa" : ""
                }`}
                onClick={() => setCategoriaSelecionada("Todas")}
                aria-pressed={categoriaSelecionada === "Todas"}
              >
                Todas
              </button>

              {categorias.map((categoria) => (
                <button
                  type="button"
                  key={categoria}
                  className={`instituicao-categoria ${
                    categoriaSelecionada === categoria ? "ativa" : ""
                  }`}
                  onClick={() => setCategoriaSelecionada(categoria)}
                  aria-pressed={categoriaSelecionada === categoria}
                >
                  {categoria}
                </button>
              ))}
            </div>
          </div>

          <p className="instituicao-resultado" role="status">
            {instituicoesFiltradas.length === 1
              ? "1 instituição encontrada"
              : `${instituicoesFiltradas.length} instituições encontradas`}
          </p>

          {instituicoesFiltradas.length > 0 ? (
            <ul className="instituicao-lista" aria-label="Instituições">
              {instituicoesFiltradas.map((instituicao) => (
                <li key={instituicao.id}>
                  <article className="instituicao-cartao">
                    <header className="instituicao-cartao-topo">
                      <span className="instituicao-cartao-icone">
                        <Building2
                          size={20}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
                      </span>

                      <span
                        className="instituicao-cartao-nota"
                        aria-label={`Nota ${formatarNota(instituicao.nota)} de 5`}
                      >
                        {formatarNota(instituicao.nota)}
                        <Star
                          size={16}
                          fill="currentColor"
                          strokeWidth={0}
                          aria-hidden="true"
                        />
                      </span>
                    </header>

                    <h2 className="instituicao-cartao-nome">
                      {instituicao.nome}
                    </h2>

                    <p className="instituicao-cartao-local">
                      <MapPin size={12} strokeWidth={1.8} aria-hidden="true" />
                      <span>
                        {instituicao.cidade} - {instituicao.uf} ·{" "}
                        {instituicao.setor}
                      </span>
                    </p>

                    <ul
                      className="instituicao-cartao-tags"
                      aria-label="Tipos de acessibilidade oferecidos"
                    >
                      {instituicao.categorias.map((categoria) => {
                        const Icone = iconesCategoria[categoria];

                        return (
                          <li className="instituicao-tag" key={categoria}>
                            <Icone
                              size={11}
                              strokeWidth={1.8}
                              aria-hidden="true"
                            />
                            {categoria}
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                </li>
              ))}
            </ul>
          ) : (
            <p className="instituicao-vazio">
              Nenhuma instituição encontrada. Tente outro nome ou escolha outro
              tipo de acessibilidade.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
export default Instituicoes;
