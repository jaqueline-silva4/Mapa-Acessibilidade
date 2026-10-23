
import './Footer.css'

const Footer = () => {
  return (
    <footer className="footer" id="sobre">
      <div className="footer-content">
        <div className="footer-brand">
          <a className="footer-brand-name" href="#inicio" aria-label="Acessa+ - Início">
            <img className="accessibility-icon" src="/cadeira-de-rodas.png" alt="" aria-hidden="true" />
            <span>Acessa+</span>
          </a>

          <p>
            Acessibilidade para todos.
          </p>
        </div>

        <div className="footer-links">
          <h2>Navegação</h2>
          <a href="#inicio">Início</a>
          <a href="#instituicoes">Instituições</a>
          <a href="#mapa">Mapa</a>
          <a href="#sobre">Sobre</a>
          <a href="#faq">FAQ</a>
        </div>

        <div className="footer-contact">
          <h2>Mapa da Acessibilidade</h2>
          <p>
            Encontre espaços acessíveis e contribua para uma cidade mais inclusiva.
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>
          © {new Date().getFullYear()} Acessa+. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}

export default Footer
