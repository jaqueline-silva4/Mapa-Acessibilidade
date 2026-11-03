import { Link } from "react-router-dom";
import {
  Accessibility,
  Brain,
  Ear,
  Eye,
  Heart,
  MonitorSmartphone,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./Sobre.css";

type Valor = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

type Estatistica = {
  valor: string;
  rotulo: string;
};

type TipoAcessibilidade = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

type RecursoSite = {
  atalho: string;
  descricao: string;
};

const valores: Valor[] = [
  {
    titulo: "Missão",
    descricao:
      "Facilitar o acesso a informações sobre acessibilidade em instituições da sua cidade.",
    icone: Target,
  },
  {
    titulo: "Comunidade",
    descricao:
      "Usuários avaliam e compartilham experiências reais para ajudar outras pessoas.",
    icone: Users,
  },
  {
    titulo: "Inclusão",
    descricao:
      "Acreditamos que todo espaço deve ser pensado para todas as pessoas.",
    icone: Heart,
  },
];

const estatisticas: Estatistica[] = [
  { valor: "120+", rotulo: "Instituições" },
  { valor: "5", rotulo: "Tipos de acessibilidade" },
  { valor: "2 mil", rotulo: "Avaliações" },
  { valor: "30", rotulo: "Cidades" },
];

const tiposAcessibilidade: TipoAcessibilidade[] = [
  {
    titulo: "Física",
    descricao: "Rampas, banheiros adaptados, rotas acessíveis e elevadores.",
    icone: Accessibility,
  },
  {
    titulo: "Visual",
    descricao: "Piso tátil, Braille, audiodescrição e contraste visual.",
    icone: Eye,
  },
  {
    titulo: "Auditiva",
    descricao: "Legendas, intérprete de Libras e alertas visuais.",
    icone: Ear,
  },
  {
    titulo: "Digital",
    descricao: "Leitores de tela, navegação por teclado e textos alternativos.",
    icone: MonitorSmartphone,
  },
  {
    titulo: "Cognitiva",
    descricao: "Linguagem simples, design previsível e ícones universais.",
    icone: Brain,
  },
];

const recursosSite: RecursoSite[] = [
  { atalho: "Alt + 1", descricao: "ir para o conteúdo principal" },
  { atalho: "Alt + 2", descricao: "ir para o menu" },
  { atalho: "Alt + 3", descricao: "ir para o rodapé" },
  {
    atalho: "A- / A / A+",
    descricao: "diminuir, restaurar ou aumentar o tamanho do texto",
  },
  {
    atalho: "Alto contraste",
    descricao: "fundo preto com texto em branco e amarelo",
  },
  { atalho: "Tema claro", descricao: "volta às cores padrão do site" },
];

function Sobre() {
  return (
    <>
      <section className="sobre-destaque" aria-labelledby="sobre-titulo">
        <div className="sobre-destaque-layout">
          <div className="sobre-destaque-conteudo">
            <span className="sobre-destaque-rotulo">SOBRE NÓS</span>

            <h1 id="sobre-titulo">Construindo um mundo mais acessível</h1>

            <p>
              O Acessa+ nasceu para ajudar pessoas a encontrarem lugares
              preparados para recebê-las.
            </p>
          </div>

          <div className="sobre-destaque-imagem">
            <img
              src="/ilustracao-acessibilidade.png"
              alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
            />
          </div>
        </div>
      </section>

      <div className="sobre-pagina">
        <div className="sobre-layout">
          <section aria-label="Nossos valores">
            <ul className="sobre-valores">
              {valores.map(({ titulo, descricao, icone: Icone }) => (
                <li className="sobre-valor" key={titulo}>
                  <span className="sobre-valor-icone">
                    <Icone size={20} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h2>{titulo}</h2>
                  <p>{descricao}</p>
                </li>
              ))}
            </ul>
          </section>

          <section aria-label="Acessa+ em números">
            <dl className="sobre-numeros">
              {estatisticas.map(({ valor, rotulo }) => (
                <div className="sobre-numero" key={rotulo}>
                  <dt>{rotulo}</dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="sobre-tipos-titulo">
            <h2 className="sobre-tipos-titulo" id="sobre-tipos-titulo">
              O que avaliamos
            </h2>

            <ul className="sobre-tipos">
              {tiposAcessibilidade.map(
                ({ titulo, descricao, icone: Icone }) => (
                  <li className="sobre-tipo" key={titulo}>
                    <Icone size={18} strokeWidth={1.8} aria-hidden="true" />
                    <h3>{titulo}</h3>
                    <p>{descricao}</p>
                  </li>
                ),
              )}
            </ul>
          </section>

          <section
            className="sobre-recursos"
            aria-labelledby="sobre-recursos-titulo"
          >
            <h2 id="sobre-recursos-titulo">
              Recursos de acessibilidade do site
            </h2>

            <ul className="sobre-recursos-lista">
              {recursosSite.map(({ atalho, descricao }) => (
                <li key={atalho}>
                  <strong>{atalho}:</strong> {descricao}
                </li>
              ))}
            </ul>

            <p className="sobre-recursos-nota">
              Suas preferências ficam salvas neste navegador.
            </p>

            <Link className="sobre-recursos-link" to="/acessibilidade">
              Ver página completa de acessibilidade
            </Link>
          </section>

          <section
            className="sobre-chamada"
            aria-labelledby="sobre-chamada-titulo"
          >
            <div>
              <h2 id="sobre-chamada-titulo">Faça parte dessa mudança!</h2>
              <p>Encontre e avalie instituições na sua cidade.</p>
            </div>

            <Link className="sobre-botao-chamada" to="/instituicoes">
              Ver instituições
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

export default Sobre;
