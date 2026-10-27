import { useState, type SubmitEvent } from "react";
import "./Login.css";

type Aba = "entrar" | "criar";

function Login() {
  const [aba, setAba] = useState<Aba>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // evita recarregar a página
    // Por enquanto só mostra no console. Depois será ligado à API.
    console.log({ aba, nome, email, senha });
  };

  return (
    <section className="login">
      <div className="login-conteudo">
        <div className="login-apresentacao">
          <h1>Bem-vindo ao Acessa+</h1>
          <p>
            Entre para avaliar instituições e ajudar a tornar a cidade mais
            acessível.
          </p>
          <img
            className="login-ilustracao"
            src="/ilustracao-acessibilidade.png"
            alt="Grupo de pessoas com diferentes deficiências sorrindo juntas"
          />
        </div>

        <div className="login-cartao">
          <div className="login-abas" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={aba === "entrar"}
              className={`login-aba ${aba === "entrar" ? "ativa" : ""}`}
              onClick={() => setAba("entrar")}
            >
              Entrar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === "criar"}
              className={`login-aba ${aba === "criar" ? "ativa" : ""}`}
              onClick={() => setAba("criar")}
            >
              Criar conta
            </button>
          </div>

          <form className="login-formulario" onSubmit={handleSubmit}>
            {aba === "criar" && (
              <div className="login-campo">
                <svg
                  viewBox="0 0 24 24"
                  width="16"
                  height="16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21a8 8 0 0 1 16 0" />
                </svg>
                <label htmlFor="nome" className="somente-leitor-tela">
                  Nome
                </label>
                <input
                  id="nome"
                  type="text"
                  placeholder="Nome"
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="login-campo">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </svg>
              <label htmlFor="email" className="somente-leitor-tela">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                placeholder="E-mail"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-campo">
              <svg
                viewBox="0 0 24 24"
                width="16"
                height="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V7a4 4 0 0 1 8 0v4" />
              </svg>
              <label htmlFor="senha" className="somente-leitor-tela">
                Senha
              </label>
              <input
                id="senha"
                type="password"
                placeholder="Senha"
                autoComplete={
                  aba === "entrar" ? "current-password" : "new-password"
                }
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-enviar">
              {aba === "entrar" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="login-links">
            {aba === "entrar" && (
              <a className="login-esqueci-senha" href="#">
                Esqueci minha senha
              </a>
            )}
            <p>
              {aba === "entrar" ? "Não tem conta? " : "Já tem conta? "}
              <button
                type="button"
                className="botao-link"
                onClick={() => setAba(aba === "entrar" ? "criar" : "entrar")}
              >
                {aba === "entrar" ? "Criar usuário" : "Entrar"}
              </button>
            </p>
          </div>

          <div className="login-divisor">
            <span>ou</span>
          </div>

          <button type="button" className="login-google">
            <svg viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"
              />
              <path
                fill="#FBBC05"
                d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"
              />
            </svg>
            Continuar com Google
          </button>
        </div>
      </div>
    </section>
  );
}

export default Login;
