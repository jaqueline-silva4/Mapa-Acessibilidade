
import "./FAQ.css";

import { useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

import {
  Mail,
  Star,
  MapPin,
  Building2,
  UserPlus,
  Accessibility,
  Headphones,
  ChevronDown,
  Settings,
  Layers,
  CirclePlus,
  Search,
} from "lucide-react";

type Categoria =
  | "Sistema"
  | "Avaliações"
  | "Mapa"
  | "Instituições"
  | "Cadastro"
  | "Acessibilidade";

type Pergunta = {
  id: number;
  categoria: Categoria;
  pergunta: string;
  resposta: string;
};

type IconeProps = {
  nome: string;
  tamanho?: number;
};

const perguntas: Pergunta[] = [
  {
    id: 1,
    categoria: "Sistema",
    pergunta: "O que é o Acessa+?",
    resposta:
      "Uma plataforma para encontrar instituições acessíveis, consultar seus recursos e contribuir para a construção de ambientes mais inclusivos.",
  },
  {
    id: 2,
    categoria: "Cadastro",
    pergunta: "Preciso criar conta para usar?",
    resposta:
      "Não. Qualquer pessoa pode buscar instituições, visualizar o mapa de localização, consultar recursos de acessibilidade e enviar mensagens pelo Fale Conosco sem precisar criar conta. O acesso por login é exclusivo para administradores e responsáveis pelas instituições cadastradas.",
  },
  {
    id: 3,
    categoria: "Avaliações",
    pergunta: "Como avalio uma instituição?",
    resposta:
      "Acesse a página pública da instituição desejada e consulte as avaliações e recursos de acessibilidade disponíveis. O sistema exibe a média de 0 a 5 estrelas e comentários sobre a acessibilidade do local.",
  },
  {
    id: 4,
    categoria: "Mapa",
    pergunta: "Como encontro locais perto de mim?",
    resposta:
      "Na página inicial você pode filtrar as instituições cadastradas por nome, estado ou cidade e explorar o Mapa de instituições interativo para ver onde cada espaço está localizado.",
  },
  {
    id: 5,
    categoria: "Instituições",
    pergunta: "Como cadastro minha instituição?",
    resposta:
      "Acesse a página Solicitar cadastro (pelo botão 'Quero cadastrar minha instituição' na página inicial) e informe os dados da sua instituição. Nossa equipe administrativa analisará o pedido e enviará as credenciais de acesso.",
  },
  {
    id: 6,
    categoria: "Acessibilidade",
    pergunta: "Quais tipos de acessibilidade são avaliados?",
    resposta:
      "Física, visual, auditiva, digital e cognitiva.",
  },
];

const categorias: { nome: Categoria; icone: string }[] = [
  { nome: "Sistema", icone: "sistema" },
  { nome: "Avaliações", icone: "avaliacoes" },
  { nome: "Mapa", icone: "mapa" },
  { nome: "Instituições", icone: "instituicoes" },
  { nome: "Cadastro", icone: "cadastro" },
  { nome: "Acessibilidade", icone: "acessibilidade" },
];

const icones: Record<string, LucideIcon> = {
  todas: Layers,
  sistema: Settings,
  avaliacoes: Star,
  mapa: MapPin,
  instituicoes: Building2,
  cadastro: UserPlus,
  acessibilidade: Accessibility,
  suporte: Headphones,
  email: Mail,
};

function Icone({ nome, tamanho = 18 }: IconeProps) {
  const ComponenteIcone = icones[nome] ?? CirclePlus;

  return (
    <ComponenteIcone
      size={tamanho}
      strokeWidth={1.8}
      aria-hidden="true"
    />
  );
}

function FAQ() {
  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState<Categoria | "Todas">("Todas");
  const [busca, setBusca] = useState("");
  const [perguntaAberta, setPerguntaAberta] = useState<number | null>(1);

  const termoBusca = busca.trim().toLowerCase();

  const perguntasFiltradas = perguntas.filter((item) => {
    const matchCategoria =
      categoriaSelecionada === "Todas" ||
      item.categoria === categoriaSelecionada;
    const matchBusca =
      termoBusca === "" ||
      item.pergunta.toLowerCase().includes(termoBusca) ||
      item.resposta.toLowerCase().includes(termoBusca);
    return matchCategoria && matchBusca;
  });

  const quantidadePorCategoria = (categoria: Categoria | "Todas") => {
    if (categoria === "Todas") {
      return perguntas.length;
    }

    return perguntas.filter((item) => item.categoria === categoria).length;
  };

  const selecionarCategoria = (categoria: Categoria | "Todas") => {
    setCategoriaSelecionada(categoria);
    setPerguntaAberta(null);
  };

  const alternarPergunta = (id: number) => {
    setPerguntaAberta((atual) => (atual === id ? null : id));
  };

  return (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>

      <section className="faq-destaque" aria-labelledby="faq-titulo">
        <div className="faq-destaque-layout">
          <div className="faq-destaque-conteudo">
            <span className="faq-destaque-rotulo">
              PERGUNTAS MAIS FREQUENTES
            </span>

            <h1 id="faq-titulo">Como podemos te ajudar?</h1>

            <p>
              Respostas para dúvidas sobre o sistema, cadastro,
              instituições e muito mais.
            </p>
          </div>

          <div className="faq-destaque-imagem">
            <img
              src="/ilustracao-acessibilidade.png"
              alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
            />
          </div>
        </div>
      </section>

      <main id="conteudo-principal" tabIndex={-1}>
        <section
          className="faq-pagina"
          aria-labelledby="faq-categorias-titulo"
        >
          <div className="faq-layout">
            <aside
              className="faq-sidebar"
              aria-label="Categorias de perguntas"
            >
              <h2 id="faq-categorias-titulo">Categorias</h2>

              <nav
                className="faq-categorias"
                aria-label="Filtrar perguntas"
              >
                <button
                  type="button"
                  className={`faq-categoria ${
                    categoriaSelecionada === "Todas" ? "ativa" : ""
                  }`}
                  onClick={() => selecionarCategoria("Todas")}
                  aria-pressed={categoriaSelecionada === "Todas"}
                >
                  <Icone nome="todas" />
                  <span>Todas</span>
                  <span className="faq-contador">
                    {String(
                      quantidadePorCategoria("Todas"),
                    ).padStart(2, "0")}
                  </span>
                </button>

                {categorias.map((categoria) => (
                  <button
                    type="button"
                    key={categoria.nome}
                    className={`faq-categoria ${
                      categoriaSelecionada === categoria.nome
                        ? "ativa"
                        : ""
                    }`}
                    onClick={() =>
                      selecionarCategoria(categoria.nome)
                    }
                    aria-pressed={
                      categoriaSelecionada === categoria.nome
                    }
                  >
                    <Icone nome={categoria.icone} />

                    <span>{categoria.nome}</span>

                    <span className="faq-contador">
                      {String(
                        quantidadePorCategoria(categoria.nome),
                      ).padStart(2, "0")}
                    </span>
                  </button>
                ))}
              </nav>

              <div className="faq-suporte">
                <span className="faq-suporte-icone">
                  <Icone nome="suporte" tamanho={24} />
                </span>

                <h2>Ainda precisa de ajuda?</h2>

                <p>Fale com o nosso suporte.</p>

                <Link className="faq-botao-suporte" to="/#contato-home">
                  <Icone nome="email" />
                  <span>Fale conosco</span>
                </Link>
              </div>
            </aside>

            <div
              className="faq-lista"
              aria-label="Perguntas frequentes"
            >
              <div className="faq-busca">
                <Search size={16} strokeWidth={1.8} aria-hidden="true" />
                <label htmlFor="faq-busca-input" className="faq-somente-leitor">
                  Buscar pergunta no FAQ
                </label>
                <input
                  id="faq-busca-input"
                  type="search"
                  placeholder="Buscar pergunta ou palavra-chave..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
              {perguntasFiltradas.map((item) => {
                const aberta = perguntaAberta === item.id;
                const respostaId = `faq-resposta-${item.id}`;

                return (
                  <article
                    className={`faq-item ${aberta ? "aberta" : ""}`}
                    key={item.id}
                  >
                    <h2 className="faq-pergunta-titulo">
                      <button
                        type="button"
                        className={`faq-pergunta ${
                          aberta ? "aberta" : ""
                        }`}
                        aria-expanded={aberta}
                        aria-controls={respostaId}
                        onClick={() => alternarPergunta(item.id)}
                      >
                        <span>{item.pergunta}</span>

                        <ChevronDown
                          size={18}
                          strokeWidth={1.8}
                          className="faq-seta"
                          aria-hidden="true"
                        />
                      </button>
                    </h2>

                    {aberta && (
                      <div
                        className="faq-resposta"
                        id={respostaId}
                      >
                        <p>{item.resposta}</p>
                      </div>
                    )}
                  </article>
                );
              })}

              {perguntasFiltradas.length === 0 && (
                <p className="faq-vazio">
                  Nenhuma pergunta encontrada nesta categoria.
                </p>
              )}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}

export default FAQ;
