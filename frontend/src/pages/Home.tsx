import './Home.css'

function Home() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-content">
        <span className="hero-eyebrow">
          PLATAFORMA DE ACESSIBILIDADE
        </span>

        <h1>
          Acessibilidade
          <br />
          para todos!
        </h1>

        <p>
          Encontre instituições acessíveis, consulte recursos disponíveis
          e ajude a construir ambientes mais inclusivos.
        </p>

        <div className="hero-actions">
          <a className="button button-primary" href="#busca-instituicao">
            <img
              className="search-icon"
              src="/lupa.png"
              alt=""
              aria-hidden="true"
            />
            Buscar instituição
          </a>

          <a className="button button-secondary" href="#sobre">
            Saiba mais
          </a>
        </div>
      </div>

      <div className="hero-image">
        <img
          src="/ilustracao-acessibilidade.png"
          alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
        />
      </div>
    </section>
  )
}

export default Home