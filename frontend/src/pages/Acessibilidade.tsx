import {
  Keyboard,
  MousePointerClick,
  Type,
  Contrast,
  Sun,
  Image,
  AudioLines,
  Languages,
  Sparkles,
  Mail,
} from 'lucide-react'

import './Acessibilidade.css'

const accessibilityFeatures = [
  {
    icon: Keyboard,
    title: 'Barra de acessibilidade',
    description:
      'No topo de todas as páginas, com atalhos rápidos para conteúdo, menu e rodapé, além dos controles de texto e cores.',
  },
  {
    icon: MousePointerClick,
    title: 'Atalhos de teclado',
    description:
      'Alt + Shift + 1 vai para o conteúdo principal, Alt + Shift + 2 para o menu e Alt + Shift + 3 para o rodapé — sem precisar do mouse.',
  },
  {
    icon: Type,
    title: 'Tamanho do texto ajustável',
    description:
      'Diminua (A−), restaure (A) ou aumente (A+) o texto de 80% a 150%, conforme sua necessidade.',
  },
  {
    icon: Contrast,
    title: 'Alto contraste',
    description:
      'Ative o modo de alto contraste para modificar a aparência do site e facilitar a visualização dos conteúdos.',
  },
  {
    icon: Sun,
    title: 'Tema claro',
    description:
      'Volte à aparência padrão do site a qualquer momento, restaurando o tamanho do texto e desativando o alto contraste.',
  },
  {
    icon: Image,
    title: 'Textos alternativos',
    description:
      'As imagens informativas devem contar com descrições em texto para ajudar pessoas que utilizam leitores de tela.',
  },
  {
    icon: AudioLines,
    title: 'Amigável a leitores de tela',
    description:
      'Utilize a navegação por teclado e os recursos de leitura de tela para acessar os conteúdos do site.',
  },
  {
    icon: Languages,
    title: 'Linguagem simples e clara',
    description:
      'Buscamos apresentar informações de forma objetiva, com textos claros e organização que facilita a compreensão.',
  },
]

function Acessibilidade() {
  return (
    <>
      <section className="accessibility-hero">
        <div className="accessibility-hero-content">
          <span className="accessibility-eyebrow">
            ACESSA+
          </span>

          <h1>Recursos de acessibilidade do site</h1>

          <p>
            Conheça os recursos disponíveis no Acessa+ para facilitar
            sua navegação e tornar sua experiência mais acessível,
            inclusiva e confortável.
          </p>
        </div>

        <div className="accessibility-hero-image">
          <img
            src="/ilustracao-acessibilidade.png"
            alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
          />
        </div>
      </section>

      <section className="accessibility-features">
        <div className="accessibility-features-container">
          <h2>O que você pode usar</h2>

          <div className="accessibility-features-grid">
            {accessibilityFeatures.map((feature) => {
              const Icon = feature.icon

              return (
                <article
                  className="accessibility-feature-card"
                  key={feature.title}
                >
                  <div className="accessibility-feature-icon">
                    <Icon size={28} strokeWidth={2} aria-hidden="true" />
                  </div>

                  <div className="accessibility-feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.description}</p>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>
      
      <section className="accessibility-shortcuts-info">
        <div className="accessibility-shortcuts-content">
          <div className="accessibility-shortcuts-list">
            <h2>Como usar os atalhos</h2>

            <p><strong>Alt + Shift + 1:</strong> ir para o conteúdo principal</p>
            <p><strong>Alt + Shift + 2:</strong> ir para o menu</p>
            <p><strong>Alt + Shift + 3:</strong> ir para o rodapé</p>
            <p><strong>Tab:</strong> percorrer links e botões com foco visível</p>

            <p className="accessibility-shortcuts-note">
              No Windows, use Alt + Shift com a tecla indicada.
              No macOS, o comportamento pode variar conforme o navegador.
            </p>
          </div>

          <aside className="accessibility-shortcuts-tip">
            <h3>Dica rápida</h3>

            <p>
              Todos os controles ficam na barra de acessibilidade no topo
              da página: ajuste o texto com A− / A / A+, ative o alto
              contraste ou volte ao tema claro.
            </p>

            <Sparkles size={30} strokeWidth={1.8} aria-hidden="true" />
          </aside>
        </div>
      </section>

      <section className="accessibility-contact">
        <div className="accessibility-contact-content">
          <h2>Encontrou alguma barreira?</h2>
          <p>Fale conosco e conte o que podemos melhorar para você.</p>
        </div>

        <a
          href="mailto:contato@acessamais.com.br"
          className="accessibility-contact-link"
        >
          <Mail size={20} aria-hidden="true" />
          Falar conosco
        </a>
      </section>
    </>
  )
}

export default Acessibilidade
