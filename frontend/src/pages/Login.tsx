import { useState, type SubmitEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Lock, User } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const { login, changeTemporaryPassword } = useAuth();

  const [loginInput, setLoginInput] = useState("");
  const [senha, setSenha] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [precisaTrocarSenha, setPrecisaTrocarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);
    setAviso(null);

    setCarregando(true);
    try {
      const user = await login(loginInput, senha);
      if (user.isTemporaryPassword) {
        setPrecisaTrocarSenha(true);
        setAviso(
          "Você entrou com uma senha provisória. Defina uma nova senha para continuar."
        );
        return;
      }

      navigate(
        user.role === "ADMIN"
          ? "/admin/instituicoes"
          : "/instituicao/configuracoes"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível realizar o login."
      );
    } finally {
      setCarregando(false);
    }
  };

  const handleChangeTempPassword = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErro(null);

    if (novaSenha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);
    try {
      const user = await changeTemporaryPassword(novaSenha);
      setPrecisaTrocarSenha(false);
      navigate(
        user.role === "ADMIN"
          ? "/admin/instituicoes"
          : "/instituicao/configuracoes"
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a senha."
      );
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <div className="login-topo">
          <Link className="login-voltar" to="/">
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Voltar para o site</span>
          </Link>
        </div>

        <section className="login-cartao" aria-labelledby="login-titulo">
          <div className="login-marca">
            <img
              className="login-marca-logo"
              src="/logo-acessa.png"
              alt="Acessa+"
            />
            <span className="login-badge">Acesso ao Sistema</span>
          </div>

          {precisaTrocarSenha ? (
            <form
              className="login-formulario"
              onSubmit={handleChangeTempPassword}
            >
              <h1 id="login-titulo" className="login-titulo">
                Definir nova senha
              </h1>
              <p className="login-subtexto">
                Por segurança, substitua a senha provisória antes de acessar o
                painel.
              </p>

              {aviso && (
                <p className="login-aviso" role="status">
                  {aviso}
                </p>
              )}
              {erro && (
                <p className="login-erro" role="alert">
                  {erro}
                </p>
              )}

              <div className="login-campo">
                <Lock size={16} aria-hidden="true" />
                <label htmlFor="nova-senha" className="somente-leitor-tela">
                  Nova senha
                </label>
                <input
                  id="nova-senha"
                  type="password"
                  placeholder="Nova senha"
                  autoComplete="new-password"
                  value={novaSenha}
                  onChange={(e) => setNovaSenha(e.target.value)}
                  required
                />
              </div>

              <div className="login-campo">
                <Lock size={16} aria-hidden="true" />
                <label
                  htmlFor="confirmar-senha"
                  className="somente-leitor-tela"
                >
                  Confirmar nova senha
                </label>
                <input
                  id="confirmar-senha"
                  type="password"
                  placeholder="Confirmar nova senha"
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                className="login-enviar"
                disabled={carregando}
              >
                {carregando ? "Salvando..." : "Salvar nova senha"}
              </button>
            </form>
          ) : (
            <>
              <h1 id="login-titulo" className="login-titulo">
                Área Administrativa
              </h1>
              <p className="login-subtexto">
                Entre com suas credenciais de administrador ou instituição.
              </p>

              {erro && (
                <p className="login-erro" role="alert">
                  {erro}
                </p>
              )}
              {aviso && (
                <p className="login-aviso" role="status">
                  {aviso}
                </p>
              )}

              <form className="login-formulario" onSubmit={handleSubmit}>
                <div className="login-campo">
                  <User size={16} aria-hidden="true" />
                  <label htmlFor="login-id" className="somente-leitor-tela">
                    Usuário ou CNPJ
                  </label>
                  <input
                    id="login-id"
                    type="text"
                    placeholder="Usuário ou CNPJ"
                    autoComplete="username"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    required
                  />
                </div>

                <div className="login-campo">
                  <Lock size={16} aria-hidden="true" />
                  <label htmlFor="senha" className="somente-leitor-tela">
                    Senha
                  </label>
                  <input
                    id="senha"
                    type="password"
                    placeholder="Senha"
                    autoComplete="current-password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="login-enviar"
                  disabled={carregando}
                >
                  {carregando ? "Entrando..." : "Entrar"}
                </button>
              </form>

              <div className="login-links">
                <a className="login-esqueci-senha" href="#">
                  Esqueci minha senha
                </a>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

export default Login;
