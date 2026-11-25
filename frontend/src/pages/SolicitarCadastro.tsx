import { useState, type ChangeEvent, type SubmitEvent } from "react";
import { Building2, CheckCircle2, Send } from "lucide-react";
import {
  formatCnpjInput,
  formatPhoneInput,
  isValidCnpj,
  isValidEmail,
  isValidPhone,
} from "../utils/institutionValidation";
import "./SolicitarCadastro.css";

interface SolicitacaoForm {
  institutionName: string;
  responsibleName: string;
  cnpj: string;
  phone: string;
  email: string;
  message: string;
}

type SolicitacaoErrors = Partial<Record<keyof SolicitacaoForm, string>>;

const INITIAL_FORM: SolicitacaoForm = {
  institutionName: "",
  responsibleName: "",
  cnpj: "",
  phone: "",
  email: "",
  message: "",
};

function validateForm(form: SolicitacaoForm): SolicitacaoErrors {
  const errors: SolicitacaoErrors = {};

  if (form.institutionName.trim().length < 2) {
    errors.institutionName = "Informe o nome da instituição.";
  }
  if (form.responsibleName.trim().length < 2) {
    errors.responsibleName = "Informe o nome do responsável.";
  }
  if (!isValidCnpj(form.cnpj)) {
    errors.cnpj = "CNPJ inválido. Verifique os 14 dígitos.";
  }
  if (!isValidPhone(form.phone)) {
    errors.phone = "Telefone inválido. Informe DDD + 8 ou 9 dígitos.";
  }
  if (!isValidEmail(form.email)) {
    errors.email = "Informe um e-mail válido.";
  }
  if (form.message.trim().length < 10) {
    errors.message =
      "Descreva brevemente a instituição e a cidade/estado (mín. 10 caracteres).";
  }

  return errors;
}

function SolicitarCadastro() {
  const [form, setForm] = useState<SolicitacaoForm>(INITIAL_FORM);
  const [errors, setErrors] = useState<SolicitacaoErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === "cnpj") {
      nextValue = formatCnpjInput(value);
    } else if (name === "phone") {
      nextValue = formatPhoneInput(value);
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setSubmitError(null);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const composedMessage = [
        `Instituição: ${form.institutionName.trim()}`,
        `CNPJ: ${form.cnpj.trim()}`,
        `Responsável: ${form.responsibleName.trim()}`,
        "",
        form.message.trim(),
      ].join("\n");

      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: "REGISTRATION_REQUEST",
          name: form.institutionName.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          message: composedMessage,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível enviar a solicitação."
        );
      }

      setSubmitted(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Não foi possível enviar a solicitação."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <section
        className="solicitar-destaque"
        aria-labelledby="solicitar-titulo"
      >
        <div className="solicitar-destaque-layout">
          <div className="solicitar-destaque-conteudo">
            <span className="solicitar-destaque-rotulo">
              PARA INSTITUIÇÕES
            </span>
            <h1 id="solicitar-titulo">Cadastre sua instituição no Acessa+</h1>
            <p>
              Preencha os dados institucionais abaixo para solicitar o acesso ao
              painel da sua instituição e divulgar seus recursos de
              acessibilidade.
            </p>
          </div>

          <div className="solicitar-destaque-imagem">
            <img
              src="/ilustracao-acessibilidade.png"
              alt="Grupo de pessoas com diferentes deficiências sorrindo juntas"
            />
          </div>
        </div>
      </section>

      <main className="solicitar-pagina" id="conteudo-principal">
        <div className="solicitar-container">
          {submitted ? (
            <section className="solicitar-sucesso" role="status">
              <CheckCircle2 size={36} aria-hidden="true" />
              <h2>Solicitação enviada com sucesso!</h2>
              <p>
                Nossa equipe administrativa analisará os dados da sua instituição
                e enviará as credenciais de primeiro acesso para o e-mail
                informado.
              </p>
              <button
                type="button"
                className="solicitar-nova-btn"
                onClick={() => setSubmitted(false)}
              >
                Enviar outra solicitação
              </button>
            </section>
          ) : (
            <section className="solicitar-card">
              <header className="solicitar-card-cabecalho">
                <div className="solicitar-card-icone">
                  <Building2 size={24} strokeWidth={1.8} aria-hidden="true" />
                </div>
                <div>
                  <h2>Dados para solicitação de cadastro</h2>
                  <p>
                    Após a aprovação do administrador, o responsável receberá um
                    login (CNPJ) e senha provisória para configurar capa, logo,
                    endereço e pontos de acessibilidade.
                  </p>
                </div>
              </header>

              {submitError && (
                <p className="solicitar-erro-geral" role="alert">
                  {submitError}
                </p>
              )}

              <form
                className="solicitar-form"
                onSubmit={handleSubmit}
                noValidate
              >
                <div className="solicitar-campo">
                  <label htmlFor="sol-inst">Nome da instituição *</label>
                  <input
                    id="sol-inst"
                    name="institutionName"
                    type="text"
                    placeholder="Ex.: IFCE Campus Iguatu"
                    value={form.institutionName}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.institutionName)}
                  />
                  {errors.institutionName && (
                    <span className="solicitar-erro">
                      {errors.institutionName}
                    </span>
                  )}
                </div>

                <div className="solicitar-campo">
                  <label htmlFor="sol-resp">Nome do responsável *</label>
                  <input
                    id="sol-resp"
                    name="responsibleName"
                    type="text"
                    placeholder="Nome completo do responsável"
                    value={form.responsibleName}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.responsibleName)}
                  />
                  {errors.responsibleName && (
                    <span className="solicitar-erro">
                      {errors.responsibleName}
                    </span>
                  )}
                </div>

                <div className="solicitar-campo">
                  <label htmlFor="sol-cnpj">CNPJ *</label>
                  <input
                    id="sol-cnpj"
                    name="cnpj"
                    type="text"
                    inputMode="numeric"
                    maxLength={18}
                    placeholder="00.000.000/0001-00"
                    value={form.cnpj}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.cnpj)}
                  />
                  {errors.cnpj && (
                    <span className="solicitar-erro">{errors.cnpj}</span>
                  )}
                </div>

                <div className="solicitar-campo">
                  <label htmlFor="sol-phone">Telefone de contato *</label>
                  <input
                    id="sol-phone"
                    name="phone"
                    type="tel"
                    maxLength={15}
                    placeholder="(88) 99999-9999"
                    value={form.phone}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <span className="solicitar-erro">{errors.phone}</span>
                  )}
                </div>

                <div className="solicitar-campo solicitar-campo-largo">
                  <label htmlFor="sol-email">E-mail institucional *</label>
                  <input
                    id="sol-email"
                    name="email"
                    type="email"
                    placeholder="acessibilidade@instituicao.edu.br"
                    value={form.email}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <span className="solicitar-erro">{errors.email}</span>
                  )}
                </div>

                <div className="solicitar-campo solicitar-campo-largo">
                  <label htmlFor="sol-msg">
                    Sobre a instituição e cidade/UF *
                  </label>
                  <textarea
                    id="sol-msg"
                    name="message"
                    rows={4}
                    maxLength={1500}
                    placeholder="Informe a cidade/UF, tipo de instituição e quais recursos de acessibilidade possui..."
                    value={form.message}
                    onChange={handleChange}
                    aria-invalid={Boolean(errors.message)}
                  />
                  {errors.message && (
                    <span className="solicitar-erro">{errors.message}</span>
                  )}
                </div>

                <button
                  type="submit"
                  className="solicitar-enviar"
                  disabled={submitting}
                >
                  <Send size={17} strokeWidth={1.8} aria-hidden="true" />
                  <span>
                    {submitting
                      ? "Enviando solicitação..."
                      : "Enviar solicitação de cadastro"}
                  </span>
                </button>
              </form>
            </section>
          )}
        </div>
      </main>
    </>
  );
}

export default SolicitarCadastro;
