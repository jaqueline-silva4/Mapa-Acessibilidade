import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Compass,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import "./Sobre.css";

type PublicoAlvo = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

type PilarSistema = {
  titulo: string;
  descricao: string;
  icone: LucideIcon;
};

const publicosAlvo: PublicoAlvo[] = [
  {
    titulo: "Pessoas com deficiência",
    descricao:
      "Consultam previamente os recursos de acessibilidade das instituições, localizam espaços no mapa e compartilham avaliações reais.",
    icone: Users,
  },
  {
    titulo: "Instituições",
    descricao:
      "Divulgam sua estrutura física e digital, gerenciam pontos de apoio, endereço, localização no mapa e informações de perfil.",
    icone: Building2,
  },
  {
    titulo: "Administradores",
    descricao:
      "Realizam o cadastro inicial das instituições, emitem credenciais de acesso e moderam avaliações e solicitações de contato.",
    icone: ShieldCheck,
  },
];

const pilaresSistema: PilarSistema[] = [
  {
    titulo: "Busca e Filtros",
    descricao:
      "Pesquisa rápida de instituições cadastradas por nome, estado e cidade.",
    icone: Compass,
  },
  {
    titulo: "Mapa Interativo",
    descricao:
      "Visualização geográfica das instituições participantes e suas rotas.",
    icone: MapPin,
  },
  {
    titulo: "Avaliações",
    descricao:
      "Notas e comentários sobre as condições reais de acessibilidade.",
    icone: Star,
  },
  {
    titulo: "Canal de Contato",
    descricao:
      "Envio de dúvidas, sugestões de novas instituições e feedbacks.",
    icone: MessageSquareText,
  },
];

const objetivosSistema: string[] = [
  "Disponibilizar informações claras sobre instalações e recursos de acessibilidade antes da visita.",
  "Reduzir barreiras e promover maior independência para pessoas com diferentes necessidades de acessibilidade.",
  "Permitir que instituições atualizem seus dados, fotos e pontos de acessibilidade de forma autônoma.",
  "Oferecer uma interface acessível seguindo as diretrizes WCAG 2.1 nível AA, com suporte a leitores de tela e VLibras.",
];

function Sobre() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>(".sobre-reveal");
    if (elements.length === 0) return;

    if (!("IntersectionObserver" in window)) {
      elements.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section className="sobre-destaque" aria-labelledby="sobre-titulo">
        <div className="sobre-destaque-layout">
          <div className="sobre-destaque-conteudo">
            <span className="sobre-destaque-rotulo">SOBRE O SISTEMA</span>

            <h1 id="sobre-titulo">O que é o Acessa+</h1>

            <p>
              Uma plataforma web concebida como ferramenta de inclusão para
              pessoas com deficiência consultarem e avaliarem a acessibilidade
              de instituições.
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
          <section
            className="sobre-recursos sobre-reveal"
            aria-labelledby="sobre-proposito-titulo"
          >
            <h2 id="sobre-proposito-titulo">
              Propósito e problema que o sistema resolve
            </h2>

            <p className="sobre-proposito-texto">
              A falta de informações prévias sobre adaptações e recursos de
              acessibilidade faz com que muitas pessoas com deficiência deixem
              de frequentar determinados espaços. O <strong>Acessa+</strong>{" "}
              conecta usuários e instituições em um ambiente intuitivo e
              acessível, reunindo informações confiáveis sobre estrutura física,
              atendimento e experiências compartilhadas pela comunidade.
            </p>

            <ul className="sobre-recursos-lista">
              {objetivosSistema.map((objetivo) => (
                <li key={objetivo}>{objetivo}</li>
              ))}
            </ul>
          </section>

          <section
            className="sobre-reveal"
            aria-labelledby="sobre-publico-titulo"
          >
            <h2 className="sobre-tipos-titulo" id="sobre-publico-titulo">
              Para quem o sistema foi desenvolvido
            </h2>

            <ul className="sobre-valores">
              {publicosAlvo.map(({ titulo, descricao, icone: Icone }) => (
                <li className="sobre-valor" key={titulo}>
                  <span className="sobre-valor-icone">
                    <Icone size={20} strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  <h3>{titulo}</h3>
                  <p>{descricao}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="sobre-reveal"
            aria-labelledby="sobre-pilares-titulo"
          >
            <h2 className="sobre-tipos-titulo" id="sobre-pilares-titulo">
              Principais funcionalidades da plataforma
            </h2>

            <ul className="sobre-pilares">
              {pilaresSistema.map(({ titulo, descricao, icone: Icone }) => (
                <li className="sobre-tipo" key={titulo}>
                  <Icone size={20} strokeWidth={1.8} aria-hidden="true" />
                  <h3>{titulo}</h3>
                  <p>{descricao}</p>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="sobre-chamada sobre-reveal"
            aria-labelledby="sobre-chamada-titulo"
          >
            <div>
              <h2 id="sobre-chamada-titulo">Explore o Acessa+</h2>
              <p>
                Projeto desenvolvido na disciplina de Tecnologia e Educação para
                promover ambientes mais inclusivos.
              </p>
            </div>

            <Link className="sobre-botao-chamada" to="/#instituicoes-home">
              Ver instituições
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}

export default Sobre;
