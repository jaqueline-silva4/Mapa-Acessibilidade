import { useState, type SubmitEvent } from "react";
import {
  Send,
  Mail,
  MessageSquareText,
  Building2,
  CircleHelp,
} from "lucide-react";
import "./Contato.css";

type Formulario = {
  nome: string;
  email: string;
  assunto: string;
  mensagem: string;
};

type ErrosFormulario = Partial<Record<keyof Formulario, string>>;

const formularioInicial: Formulario = {
  nome: "",
  email: "",
  assunto: "",
  mensagem: "",
};

const motivos = [
  {
    icone: Building2,
    titulo: "Sugerir instituição",
    descricao: "Indique um local acessível para entrar no catálogo.",
  },
  {
    icone: CircleHelp,
    titulo: "Dúvidas",
    descricao: "Pergunte sobre recursos, avaliações ou cadastro.",
  },
  {
    icone: MessageSquareText,
    titulo: "Feedback",
    descricao: "Conte o que podemos melhorar no site.",
  },
];

function validarFormulario(formulario: Formulario): ErrosFormulario {
  const erros: ErrosFormulario = {};

  if (formulario.nome.trim().length < 2) {
    erros.nome = "Informe seu nome";
  } else if (formulario.nome.trim().length > 100) {
    erros.nome = "O nome deve ter no máximo 100 caracteres";
  }

  const email = formulario.email.trim();

  if (!email) {
    erros.email = "Informe seu e-mail";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    erros.email = "E-mail inválido";
  } else if (email.length > 255) {
    erros.email = "O e-mail deve ter no máximo 255 caracteres";
  }

  if (!formulario.assunto) {
    erros.assunto = "Escolha um assunto";
  }

  if (formulario.mensagem.trim().length < 10) {
    erros.mensagem = "Escreva pelo menos 10 caracteres";
  } else if (formulario.mensagem.trim().length > 1000) {
    erros.mensagem = "A mensagem deve ter no máximo 1000 caracteres";
  }

  return erros;
}

function Contato() {
  const [formulario, setFormulario] =
    useState<Formulario>(formularioInicial);

  const [erros, setErros] = useState<ErrosFormulario>({});
  const [status, setStatus] = useState("");

  function atualizarCampo(campo: keyof Formulario, valor: string) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErros((anteriores) => ({
      ...anteriores,
      [campo]: undefined,
    }));

    setStatus("");
  }

  function enviarFormulario(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const novosErros = validarFormulario(formulario);
    setErros(novosErros);

    if (Object.keys(novosErros).length > 0) {
      setStatus("");
      return;
    }

    // O envio ao backend será implementado posteriormente.
    setStatus(
      "Formulário validado com sucesso! O envio da mensagem ainda precisa ser conectado ao servidor."
    );

    setFormulario(formularioInicial);
    setErros({});
  }

  return (
    <>
    <a className="skip-link" href="#conteudo-principal">
      Pular para o conteúdo principal
    </a>

      <section className="contato-destaque" aria-labelledby="contato-titulo">
        <div className="contato-destaque-layout">
          <div className="contato-destaque-conteudo">
            <span className="contato-destaque-rotulo">CONTATO</span>

            <h1 id="contato-titulo">Fale conosco</h1>

            <p>
              Tire dúvidas, sugira uma instituição ou envie um feedback. Sua mensagem ajuda a construir ambientes mais inclusivos.
            </p>
          </div>

          <div className="contato-destaque-imagem">
            <img
              src="/ilustracao-acessibilidade.png"
              alt="Pessoas com deficiência, incluindo uma pessoa usando cadeira de rodas, uma pessoa com deficiência visual acompanhada de um cão-guia e uma pessoa com prótese"
            />
          </div>
        </div>
      </section>

      <main className="contato-pagina" id="conteudo-principal">
        <div className="contato-container">
          <section
            className="contato-motivos"
            aria-label="Motivos para entrar em contato"
          >
            {motivos.map(({ icone: Icone, titulo, descricao }) => (
              <article className="contato-motivo" key={titulo}>
                <div className="contato-motivo-icone">
                  <Icone size={24} strokeWidth={1.8} aria-hidden="true" />
                </div>

                <h2>{titulo}</h2>

                <p>{descricao}</p>
              </article>
            ))}
          </section>

          <section className="contato-form-card">
            <header className="contato-form-cabecalho">
              <div className="contato-form-icone">
                <Mail size={24} strokeWidth={1.8} aria-hidden="true" />
              </div>

              <div>
                <h2>Envie sua mensagem</h2>
                <p>
                  Preencha os campos abaixo e responderemos em breve.
                </p>
              </div>
            </header>

            <form
              className="contato-formulario"
              onSubmit={enviarFormulario}
              noValidate
            >
              <div className="contato-campo">
                <label htmlFor="contato-nome">Nome</label>

                <input
                  id="contato-nome"
                  name="nome"
                  type="text"
                  autoComplete="name"
                  value={formulario.nome}
                  onChange={(event) =>
                    atualizarCampo("nome", event.target.value)
                  }
                  maxLength={100}
                  aria-invalid={Boolean(erros.nome)}
                  aria-describedby={
                    erros.nome ? "erro-contato-nome" : undefined
                  }
                />

                {erros.nome && (
                  <span className="contato-erro" id="erro-contato-nome">
                    {erros.nome}
                  </span>
                )}
              </div>

              <div className="contato-campo">
                <label htmlFor="contato-email">E-mail</label>

                <input
                  id="contato-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formulario.email}
                  onChange={(event) =>
                    atualizarCampo("email", event.target.value)
                  }
                  maxLength={255}
                  aria-invalid={Boolean(erros.email)}
                  aria-describedby={
                    erros.email ? "erro-contato-email" : undefined
                  }
                />

                {erros.email && (
                  <span className="contato-erro" id="erro-contato-email">
                    {erros.email}
                  </span>
                )}
              </div>

              <div className="contato-campo">
                <label htmlFor="contato-assunto">Assunto</label>

                <select
                  id="contato-assunto"
                  name="assunto"
                  value={formulario.assunto}
                  onChange={(event) =>
                    atualizarCampo("assunto", event.target.value)
                  }
                  aria-invalid={Boolean(erros.assunto)}
                  aria-describedby={
                    erros.assunto ? "erro-contato-assunto" : undefined
                  }
                >
                  <option value="">Selecione...</option>
                  <option value="Sugerir instituição">
                    Sugerir instituição
                  </option>
                  <option value="Dúvida">Dúvida</option>
                  <option value="Problema no site">
                    Problema no site
                  </option>
                  <option value="Outro">Outro</option>
                </select>

                {erros.assunto && (
                  <span
                    className="contato-erro"
                    id="erro-contato-assunto"
                  >
                    {erros.assunto}
                  </span>
                )}
              </div>

              <div className="contato-campo contato-campo-mensagem">
                <label htmlFor="contato-mensagem">Mensagem</label>

                <textarea
                  id="contato-mensagem"
                  name="mensagem"
                  rows={5}
                  value={formulario.mensagem}
                  onChange={(event) =>
                    atualizarCampo("mensagem", event.target.value)
                  }
                  maxLength={1000}
                  placeholder="Escreva sua mensagem..."
                  aria-invalid={Boolean(erros.mensagem)}
                  aria-describedby={
                    erros.mensagem
                      ? "erro-contato-mensagem"
                      : undefined
                  }
                />

                {erros.mensagem && (
                  <span
                    className="contato-erro"
                    id="erro-contato-mensagem"
                  >
                    {erros.mensagem}
                  </span>
                )}
              </div>

              {status && (
                <p className="contato-status" role="status">
                  {status}
                </p>
              )}

              <button type="submit" className="contato-enviar">
                <Send size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>Enviar mensagem</span>
              </button>
            </form>
          </section>
        </div>
      </main>
    </>
  );
}

export default Contato;