import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Building2,
  ExternalLink,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  formatCnpjInput,
  formatPhoneInput,
  validateInstitutionContactFields,
  type InstitutionFieldErrors,
} from "../utils/institutionValidation";
import "./AdminInstituicoes.css";

interface InstitutionItem {
  id: number;
  name: string;
  unitName?: string | null;
  cnpj: string;
  phone: string;
  email: string;
  description: string;
  city: string | null;
  state: string | null;
  logoUrl: string | null;
  active: boolean;
  createdAt: string;
}

interface ContactMessageItem {
  id: number;
  reason: "QUESTION" | "REGISTRATION_REQUEST";
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: "PENDING" | "ANSWERED";
  createdAt: string;
}

interface CredentialsBanner {
  title: string;
  institutionName: string;
  login: string;
  temporaryPassword: string;
}

type AdminTab = "institutions" | "messages";
type StatusFilter = "all" | "active" | "inactive";
type ContactReasonFilter = "all" | "REGISTRATION_REQUEST" | "QUESTION";
type ContactStatusFilter = "all" | "PENDING" | "ANSWERED";

const INITIAL_FORM = {
  name: "",
  unitName: "",
  cnpj: "",
  phone: "",
  email: "",
  description: "",
};

const INITIAL_EDIT_FORM = {
  name: "",
  unitName: "",
  phone: "",
  email: "",
  description: "",
};

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function AdminInstituicoes() {
  const { token, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AdminTab>("institutions");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [contacts, setContacts] = useState<ContactMessageItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<InstitutionFieldErrors>({});
  const [touchedFields, setTouchedFields] = useState<
    Partial<Record<"cnpj" | "phone" | "email", boolean>>
  >({});

  const [editingInstitution, setEditingInstitution] =
    useState<InstitutionItem | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_EDIT_FORM);
  const [editFieldErrors, setEditFieldErrors] =
    useState<InstitutionFieldErrors>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [credentialsBanner, setCredentialsBanner] =
    useState<CredentialsBanner | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [confirmResetId, setConfirmResetId] = useState<number | null>(null);
  const [busyInstitutionId, setBusyInstitutionId] = useState<number | null>(
    null
  );

  const [contactReasonFilter, setContactReasonFilter] =
    useState<ContactReasonFilter>("all");
  const [contactStatusFilter, setContactStatusFilter] =
    useState<ContactStatusFilter>("all");
  const [busyContactId, setBusyContactId] = useState<number | null>(null);

  const fetchInstitutions = useCallback(async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const response = await fetch("/api/admin/institutions?limit=100", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setInstitutions(Array.isArray(data.institutions) ? data.institutions : []);
    } finally {
      setLoadingList(false);
    }
  }, [token]);

  const fetchContacts = useCallback(async () => {
    if (!token) return;
    setLoadingContacts(true);
    try {
      const response = await fetch("/api/admin/contacts", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : []);
    } finally {
      setLoadingContacts(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchInstitutions();
      fetchContacts();
    }
  }, [isAuthenticated, isAdmin, fetchInstitutions, fetchContacts]);

  const stats = useMemo(() => {
    const activeCount = institutions.filter((item) => item.active).length;
    const pendingContacts = contacts.filter(
      (item) => item.status === "PENDING"
    ).length;
    return {
      total: institutions.length,
      active: activeCount,
      inactive: institutions.length - activeCount,
      pendingContacts,
    };
  }, [institutions, contacts]);

  const filteredInstitutions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (statusFilter === "active" && !inst.active) return false;
      if (statusFilter === "inactive" && inst.active) return false;
      if (!term) return true;

      return (
        inst.name.toLowerCase().includes(term) ||
        (inst.unitName ?? "").toLowerCase().includes(term) ||
        inst.cnpj.toLowerCase().includes(term) ||
        inst.email.toLowerCase().includes(term)
      );
    });
  }, [institutions, searchTerm, statusFilter]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((item) => {
      if (
        contactReasonFilter !== "all" &&
        item.reason !== contactReasonFilter
      ) {
        return false;
      }
      if (
        contactStatusFilter !== "all" &&
        item.status !== contactStatusFilter
      ) {
        return false;
      }
      return true;
    });
  }, [contacts, contactReasonFilter, contactStatusFilter]);

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === "cnpj") {
      nextValue = formatCnpjInput(value);
    } else if (name === "phone") {
      nextValue = formatPhoneInput(value);
    }

    const nextForm = { ...form, [name]: nextValue };
    setForm(nextForm);

    if (
      (name === "cnpj" || name === "phone" || name === "email") &&
      touchedFields[name]
    ) {
      const nextErrors = validateInstitutionContactFields(nextForm);
      setFieldErrors((prev) => ({ ...prev, [name]: nextErrors[name] }));
    }
  };

  const handleContactBlur = (field: "cnpj" | "phone" | "email") => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
    const nextErrors = validateInstitutionContactFields(form);
    setFieldErrors((prev) => ({ ...prev, [field]: nextErrors[field] }));
  };

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // Clipboard API pode não estar disponível em contextos não seguros
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setActionFeedback(null);
    setCredentialsBanner(null);

    const contactErrors = validateInstitutionContactFields(form);
    if (Object.keys(contactErrors).length > 0) {
      setTouchedFields({
        cnpj: true,
        phone: true,
        email: true,
      });
      setFieldErrors(contactErrors);
      setError("Corrija os campos destacados antes de enviar.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          unitName: form.unitName.trim() || null,
          cnpj: form.cnpj,
          phone: form.phone,
          email: form.email,
          description: form.description,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const firstIssue = Array.isArray(data.errors)
          ? data.errors[0]?.message
          : null;
        throw new Error(
          firstIssue || data.message || "Erro ao cadastrar instituição."
        );
      }

      setCredentialsBanner({
        title: "Instituição cadastrada com sucesso!",
        institutionName: data.institution?.name || form.name,
        login: data.credentials?.login || "",
        temporaryPassword: data.credentials?.temporaryPassword || "",
      });

      setForm(INITIAL_FORM);
      setFieldErrors({});
      setTouchedFields({});
      setFormOpen(false);
      await fetchInstitutions();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cadastrar instituição."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (inst: InstitutionItem) => {
    if (!token) return;
    setError(null);
    setActionFeedback(null);
    setBusyInstitutionId(inst.id);
    try {
      const response = await fetch(
        `/api/admin/institutions/${inst.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ active: !inst.active }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar status.");
      }

      setInstitutions((prev) =>
        prev.map((item) =>
          item.id === inst.id ? { ...item, active: !inst.active } : item
        )
      );
      setActionFeedback(
        `Instituição "${inst.name}" ${!inst.active ? "ativada" : "inativada"} com sucesso.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar status."
      );
    } finally {
      setBusyInstitutionId(null);
    }
  };

  const handleResetPassword = async (inst: InstitutionItem) => {
    if (!token) return;
    setError(null);
    setActionFeedback(null);
    setBusyInstitutionId(inst.id);
    try {
      const response = await fetch(
        `/api/admin/institutions/${inst.id}/reset-password`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao redefinir a senha.");
      }

      setConfirmResetId(null);
      setCredentialsBanner({
        title: "Nova senha provisória gerada!",
        institutionName: data.institutionName || inst.name,
        login: data.login || inst.cnpj,
        temporaryPassword: data.temporaryPassword || "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao redefinir a senha."
      );
    } finally {
      setBusyInstitutionId(null);
    }
  };

  const handleDeleteInstitution = async (inst: InstitutionItem) => {
    if (!token) return;
    setError(null);
    setActionFeedback(null);
    setBusyInstitutionId(inst.id);
    try {
      const response = await fetch(`/api/admin/institutions/${inst.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao excluir instituição.");
      }

      setConfirmDeleteId(null);
      setInstitutions((prev) => prev.filter((item) => item.id !== inst.id));
      setActionFeedback(`Instituição "${inst.name}" excluída com sucesso.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao excluir instituição."
      );
    } finally {
      setBusyInstitutionId(null);
    }
  };

  const handleToggleContactStatus = async (contact: ContactMessageItem) => {
    if (!token) return;
    setError(null);
    setBusyContactId(contact.id);
    const nextStatus = contact.status === "PENDING" ? "ANSWERED" : "PENDING";
    try {
      const response = await fetch(
        `/api/admin/contacts/${contact.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao atualizar status da mensagem.");
      }
      setContacts((prev) =>
        prev.map((item) =>
          item.id === contact.id ? { ...item, status: nextStatus } : item
        )
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar mensagem."
      );
    } finally {
      setBusyContactId(null);
    }
  };

  const handlePrefillFromContact = (contact: ContactMessageItem) => {
    const cnpjMatch = contact.message.match(/CNPJ:\s*([\d./-]+)/i);
    setForm({
      name: contact.name,
      unitName: "",
      cnpj: cnpjMatch ? formatCnpjInput(cnpjMatch[1]) : "",
      phone: contact.phone ? formatPhoneInput(contact.phone) : "",
      email: contact.email,
      description: "",
    });
    setFieldErrors({});
    setTouchedFields({});
    setActiveTab("institutions");
    setFormOpen(true);
    setActionFeedback(
      `Dados de "${contact.name}" preenchidos no formulário de cadastro.`
    );
  };

  const openEditModal = (inst: InstitutionItem) => {
    setConfirmDeleteId(null);
    setConfirmResetId(null);
    setEditError(null);
    setEditFieldErrors({});
    setEditForm({
      name: inst.name,
      unitName: inst.unitName ?? "",
      phone: formatPhoneInput(inst.phone),
      email: inst.email,
      description: inst.description ?? "",
    });
    setEditingInstitution(inst);
  };

  const closeEditModal = () => {
    if (savingEdit) return;
    setEditingInstitution(null);
    setEditError(null);
    setEditFieldErrors({});
  };

  const handleEditFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const nextValue = name === "phone" ? formatPhoneInput(value) : value;
    setEditForm((prev) => ({ ...prev, [name]: nextValue }));
    setEditFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setEditError(null);
  };

  const handleEditSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInstitution || !token) return;
    setEditError(null);

    const contactErrors = validateInstitutionContactFields({
      cnpj: editingInstitution.cnpj,
      phone: editForm.phone,
      email: editForm.email,
    });
    delete contactErrors.cnpj;

    if (Object.keys(contactErrors).length > 0) {
      setEditFieldErrors(contactErrors);
      setEditError("Corrija os campos destacados antes de salvar.");
      return;
    }

    setSavingEdit(true);
    try {
      const response = await fetch(
        `/api/admin/institutions/${editingInstitution.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: editForm.name,
            unitName: editForm.unitName.trim() || null,
            phone: editForm.phone,
            email: editForm.email,
            description: editForm.description,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao atualizar instituição.");
      }

      setInstitutions((prev) =>
        prev.map((item) =>
          item.id === editingInstitution.id ? { ...item, ...data } : item
        )
      );
      setActionFeedback(
        `Instituição "${data.name || editForm.name}" atualizada com sucesso.`
      );
      setEditingInstitution(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Erro ao atualizar instituição."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="admin-workspace">
      <header className="admin-topbar">
        <div className="admin-topbar-inner">
          <div className="admin-topbar-brand">
            <img
              className="admin-topbar-logo"
              src="/logo-acessa.png"
              alt="Acessa+"
            />
            <span className="admin-topbar-titulo">Painel Administrativo</span>
          </div>

          <button
            type="button"
            className="admin-topbar-sair"
            onClick={handleLogout}
          >
            <LogOut size={16} aria-hidden="true" />
            <span>Sair</span>
          </button>
        </div>
      </header>

      <main className="admin-instituicoes">
        <div className="admin-container">
          <div className="admin-cabecalho">
            <div className="admin-cabecalho-texto">
              <h1>Gestão do Sistema</h1>
              <p>
                Gerencie instituições cadastradas, credenciais de acesso e
                mensagens recebidas pela plataforma.
              </p>
            </div>

            <button
              type="button"
              className="admin-toggle-form"
              aria-expanded={formOpen}
              onClick={() => {
                setActiveTab("institutions");
                setFormOpen((prev) => !prev);
                setError(null);
              }}
            >
              <Plus size={18} aria-hidden="true" />
              <span>
                {formOpen ? "Fechar formulário" : "Nova instituição"}
              </span>
            </button>
          </div>

          <div className="admin-resumo" aria-label="Resumo administrativo">
            <div className="resumo-card">
              <span className="resumo-rotulo">Total de instituições</span>
              <strong className="resumo-valor">{stats.total}</strong>
            </div>
            <div className="resumo-card">
              <span className="resumo-rotulo">Ativas</span>
              <strong className="resumo-valor resumo-ativa">
                {stats.active}
              </strong>
            </div>
            <div className="resumo-card">
              <span className="resumo-rotulo">Inativas</span>
              <strong className="resumo-valor resumo-inativa">
                {stats.inactive}
              </strong>
            </div>
            <div className="resumo-card">
              <span className="resumo-rotulo">Mensagens pendentes</span>
              <strong className="resumo-valor resumo-alerta">
                {stats.pendingContacts}
              </strong>
            </div>
          </div>

          <div className="admin-tabs" role="tablist" aria-label="Seções do painel">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "institutions"}
              className={`admin-tab ${activeTab === "institutions" ? "ativa" : ""}`}
              onClick={() => setActiveTab("institutions")}
            >
              <Building2 size={17} aria-hidden="true" />
              <span>Instituições ({institutions.length})</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "messages"}
              className={`admin-tab ${activeTab === "messages" ? "ativa" : ""}`}
              onClick={() => setActiveTab("messages")}
            >
              <Mail size={17} aria-hidden="true" />
              <span>Mensagens recebidas</span>
              {stats.pendingContacts > 0 && (
                <span className="tab-badge">{stats.pendingContacts}</span>
              )}
            </button>
          </div>

          {credentialsBanner && (
            <div className="admin-credenciais" role="status" aria-live="polite">
              <div className="credenciais-topo">
                <div>
                  <h2>{credentialsBanner.title}</h2>
                  <p>
                    Entregue as credenciais abaixo ao responsável por{" "}
                    <strong>{credentialsBanner.institutionName}</strong>. A senha
                    provisória não poderá ser consultada novamente depois de
                    fechar este aviso.
                  </p>
                </div>
                <button
                  type="button"
                  className="credenciais-fechar"
                  onClick={() => setCredentialsBanner(null)}
                >
                  Fechar
                </button>
              </div>
              <div className="credenciais-grid">
                <div className="credencial-item">
                  <span>Login (CNPJ)</span>
                  <div className="credencial-valor">
                    <code>{credentialsBanner.login}</code>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("login", credentialsBanner.login)
                      }
                    >
                      {copiedField === "login" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
                <div className="credencial-item">
                  <span>Senha provisória</span>
                  <div className="credencial-valor">
                    <code>{credentialsBanner.temporaryPassword}</code>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy("senha", credentialsBanner.temporaryPassword)
                      }
                    >
                      {copiedField === "senha" ? "Copiado!" : "Copiar"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {actionFeedback && (
            <p className="admin-sucesso" role="status" aria-live="polite">
              {actionFeedback}
            </p>
          )}

          {error && (
            <p className="admin-erro" role="alert">
              {error}
            </p>
          )}

          {activeTab === "institutions" && (
            <>
              {formOpen && (
                <form className="admin-form-card" onSubmit={handleSubmit}>
                  <div className="form-cabecalho">
                    <div>
                      <h2>Cadastrar nova instituição</h2>
                      <p>
                        Informe os dados básicos para gerar o acesso do
                        responsável. Endereço, geolocalização, capa e logo são
                        preenchidos pela própria instituição.
                      </p>
                    </div>
                  </div>

                  <div className="campos-duplos">
                    <div className="campo-grupo">
                      <label htmlFor="inst-name">
                        Nome completo da instituição *
                      </label>
                      <input
                        id="inst-name"
                        name="name"
                        type="text"
                        placeholder="Ex.: Instituto Federal de Educação, Ciência e Tecnologia do Ceará"
                        value={form.name}
                        onChange={handleFieldChange}
                        required
                      />
                    </div>
                    <div className="campo-grupo">
                      <label htmlFor="inst-unit-name">
                        Nome da unidade / campus (opcional)
                      </label>
                      <input
                        id="inst-unit-name"
                        name="unitName"
                        type="text"
                        placeholder="Ex.: IFCE Campus Iguatu"
                        value={form.unitName}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>

                  <div className="campos-duplos">
                    <div className="campo-grupo">
                      <label htmlFor="inst-cnpj">CNPJ *</label>
                      <input
                        id="inst-cnpj"
                        name="cnpj"
                        type="text"
                        inputMode="numeric"
                        maxLength={18}
                        placeholder="00.000.000/0001-00"
                        value={form.cnpj}
                        onChange={handleFieldChange}
                        onBlur={() => handleContactBlur("cnpj")}
                        aria-invalid={Boolean(fieldErrors.cnpj)}
                        aria-describedby={
                          fieldErrors.cnpj ? "erro-cnpj" : undefined
                        }
                        className={
                          fieldErrors.cnpj ? "input-invalido" : undefined
                        }
                        required
                      />
                      {fieldErrors.cnpj && (
                        <span
                          id="erro-cnpj"
                          className="campo-erro"
                          role="alert"
                        >
                          {fieldErrors.cnpj}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="campos-duplos">
                    <div className="campo-grupo">
                      <label htmlFor="inst-phone">Telefone *</label>
                      <input
                        id="inst-phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        maxLength={15}
                        placeholder="(11) 99999-9999"
                        value={form.phone}
                        onChange={handleFieldChange}
                        onBlur={() => handleContactBlur("phone")}
                        aria-invalid={Boolean(fieldErrors.phone)}
                        aria-describedby={
                          fieldErrors.phone ? "erro-phone" : undefined
                        }
                        className={
                          fieldErrors.phone ? "input-invalido" : undefined
                        }
                        required
                      />
                      {fieldErrors.phone && (
                        <span
                          id="erro-phone"
                          className="campo-erro"
                          role="alert"
                        >
                          {fieldErrors.phone}
                        </span>
                      )}
                    </div>
                    <div className="campo-grupo">
                      <label htmlFor="inst-email">
                        E-mail institucional *
                      </label>
                      <input
                        id="inst-email"
                        name="email"
                        type="email"
                        placeholder="contato@instituicao.org.br"
                        value={form.email}
                        onChange={handleFieldChange}
                        onBlur={() => handleContactBlur("email")}
                        aria-invalid={Boolean(fieldErrors.email)}
                        aria-describedby={
                          fieldErrors.email ? "erro-email" : undefined
                        }
                        className={
                          fieldErrors.email ? "input-invalido" : undefined
                        }
                        required
                      />
                      {fieldErrors.email && (
                        <span
                          id="erro-email"
                          className="campo-erro"
                          role="alert"
                        >
                          {fieldErrors.email}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="campo-grupo">
                    <label htmlFor="inst-description">
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="inst-description"
                      name="description"
                      rows={2}
                      maxLength={2000}
                      placeholder="Observações ou breve descrição da instituição..."
                      value={form.description}
                      onChange={handleFieldChange}
                    />
                  </div>

                  <div className="form-acoes">
                    <button
                      type="button"
                      className="btn-acao btn-cancelar"
                      onClick={() => setFormOpen(false)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="admin-submit"
                      disabled={submitting}
                    >
                      {submitting
                        ? "Cadastrando..."
                        : "Cadastrar instituição"}
                    </button>
                  </div>
                </form>
              )}

              <section
                className="admin-lista-card"
                aria-label="Instituições cadastradas"
              >
                <div className="lista-cabecalho">
                  <div className="lista-topo">
                    <h2>Instituições cadastradas</h2>
                    <span className="lista-contagem">
                      {filteredInstitutions.length}
                    </span>
                  </div>

                  <div className="lista-filtros">
                    <div className="lista-busca-wrap">
                      <Search size={15} aria-hidden="true" />
                      <label
                        htmlFor="busca-instituicoes"
                        className="somente-leitor-tela"
                      >
                        Buscar instituições
                      </label>
                      <input
                        id="busca-instituicoes"
                        type="search"
                        className="lista-busca"
                        placeholder="Buscar por nome, CNPJ ou e-mail..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <label
                      htmlFor="filtro-status"
                      className="somente-leitor-tela"
                    >
                      Filtrar por status
                    </label>
                    <select
                      id="filtro-status"
                      className="lista-select"
                      value={statusFilter}
                      onChange={(e) =>
                        setStatusFilter(e.target.value as StatusFilter)
                      }
                    >
                      <option value="all">Todas</option>
                      <option value="active">Ativas</option>
                      <option value="inactive">Inativas</option>
                    </select>
                  </div>
                </div>

                {loadingList ? (
                  <p className="lista-vazia">Carregando instituições...</p>
                ) : filteredInstitutions.length === 0 ? (
                  <p className="lista-vazia">
                    {institutions.length === 0
                      ? "Nenhuma instituição cadastrada ainda."
                      : "Nenhuma instituição encontrada com os filtros atuais."}
                  </p>
                ) : (
                  <ul className="lista-instituicoes">
                    {filteredInstitutions.map((inst) => {
                      const isBusy = busyInstitutionId === inst.id;
                      const isConfirmingDelete = confirmDeleteId === inst.id;
                      const isConfirmingReset = confirmResetId === inst.id;

                      return (
                        <li key={inst.id} className="instituicao-card">
                          <div className="instituicao-principal">
                            <div className="instituicao-avatar">
                              {inst.logoUrl ? (
                                <img
                                  src={inst.logoUrl}
                                  alt={`Logo de ${inst.name}`}
                                />
                              ) : (
                                <span aria-hidden="true">
                                  {inst.name.slice(0, 2).toUpperCase()}
                                </span>
                              )}
                            </div>

                            <div className="instituicao-info">
                              <div className="instituicao-titulo">
                                <strong>{inst.name}</strong>
                                {inst.unitName && (
                                  <span className="instituicao-unidade">
                                    {inst.unitName}
                                  </span>
                                )}
                                <span
                                  className={`status-pill ${inst.active ? "ativa" : "inativa"}`}
                                >
                                  {inst.active ? "Ativa" : "Inativa"}
                                </span>
                              </div>

                              <div className="instituicao-detalhes">
                                <span>CNPJ: {formatCnpj(inst.cnpj)}</span>
                                <span>Tel: {inst.phone}</span>
                                <span>E-mail: {inst.email}</span>
                                {inst.city && inst.state && (
                                  <span>
                                    Local: {inst.city}/{inst.state}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="instituicao-acoes">
                            {isConfirmingReset ? (
                              <div className="confirmacao-inline" role="group">
                                <span>Gerar nova senha provisória?</span>
                                <button
                                  type="button"
                                  className="btn-acao btn-confirmar"
                                  disabled={isBusy}
                                  onClick={() => handleResetPassword(inst)}
                                >
                                  {isBusy ? "Gerando..." : "Confirmar"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-acao btn-cancelar"
                                  disabled={isBusy}
                                  onClick={() => setConfirmResetId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : isConfirmingDelete ? (
                              <div
                                className="confirmacao-inline confirmacao-perigo"
                                role="group"
                              >
                                <span>
                                  Excluir instituição e conta de acesso?
                                </span>
                                <button
                                  type="button"
                                  className="btn-acao btn-excluir-confirmar"
                                  disabled={isBusy}
                                  onClick={() => handleDeleteInstitution(inst)}
                                >
                                  {isBusy
                                    ? "Excluindo..."
                                    : "Confirmar exclusão"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-acao btn-cancelar"
                                  disabled={isBusy}
                                  onClick={() => setConfirmDeleteId(null)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  className="btn-acao btn-editar"
                                  disabled={isBusy}
                                  onClick={() => openEditModal(inst)}
                                >
                                  <Pencil size={13} aria-hidden="true" />
                                  <span>Editar</span>
                                </button>
                                <a
                                  href={`/instituicoes/${inst.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn-acao btn-status"
                                >
                                  <ExternalLink size={13} aria-hidden="true" />
                                  <span>Página pública</span>
                                </a>
                                <button
                                  type="button"
                                  className="btn-acao btn-senha"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setConfirmDeleteId(null);
                                    setConfirmResetId(inst.id);
                                  }}
                                >
                                  Redefinir senha
                                </button>
                                <button
                                  type="button"
                                  className="btn-acao btn-status"
                                  disabled={isBusy}
                                  onClick={() => handleToggleStatus(inst)}
                                >
                                  {inst.active ? "Inativar" : "Ativar"}
                                </button>
                                <button
                                  type="button"
                                  className="btn-acao btn-excluir"
                                  disabled={isBusy}
                                  onClick={() => {
                                    setConfirmResetId(null);
                                    setConfirmDeleteId(inst.id);
                                  }}
                                >
                                  Excluir
                                </button>
                              </>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          )}

          {activeTab === "messages" && (
            <section
              className="admin-lista-card"
              aria-label="Mensagens recebidas"
            >
              <div className="lista-cabecalho">
                <div className="lista-topo">
                  <h2>Mensagens e Solicitações</h2>
                  <span className="lista-contagem">
                    {filteredContacts.length}
                  </span>
                </div>

                <div className="lista-filtros">
                  <select
                    aria-label="Filtrar por tipo de mensagem"
                    className="lista-select"
                    value={contactReasonFilter}
                    onChange={(e) =>
                      setContactReasonFilter(
                        e.target.value as ContactReasonFilter
                      )
                    }
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="REGISTRATION_REQUEST">
                      Solicitações de cadastro
                    </option>
                    <option value="QUESTION">Fale Conosco / Dúvidas</option>
                  </select>

                  <select
                    aria-label="Filtrar por status da mensagem"
                    className="lista-select"
                    value={contactStatusFilter}
                    onChange={(e) =>
                      setContactStatusFilter(
                        e.target.value as ContactStatusFilter
                      )
                    }
                  >
                    <option value="all">Todos os status</option>
                    <option value="PENDING">Pendentes</option>
                    <option value="ANSWERED">Respondidas</option>
                  </select>
                </div>
              </div>

              {loadingContacts ? (
                <p className="lista-vazia">Carregando mensagens...</p>
              ) : filteredContacts.length === 0 ? (
                <p className="lista-vazia">
                  Nenhuma mensagem encontrada com os filtros atuais.
                </p>
              ) : (
                <ul className="lista-instituicoes">
                  {filteredContacts.map((msg) => {
                    const isRegistration =
                      msg.reason === "REGISTRATION_REQUEST";
                    const isBusy = busyContactId === msg.id;

                    return (
                      <li key={msg.id} className="mensagem-card">
                        <div className="mensagem-topo">
                          <div className="mensagem-badges">
                            <span
                              className={`reason-pill ${
                                isRegistration ? "cadastro" : "duvida"
                              }`}
                            >
                              {isRegistration
                                ? "Solicitação de cadastro"
                                : "Fale Conosco"}
                            </span>
                            <span
                              className={`status-pill ${
                                msg.status === "ANSWERED"
                                  ? "ativa"
                                  : "pendente"
                              }`}
                            >
                              {msg.status === "ANSWERED"
                                ? "Respondida"
                                : "Pendente"}
                            </span>
                          </div>
                          <span className="mensagem-data">
                            {formatDateTime(msg.createdAt)}
                          </span>
                        </div>

                        <div className="mensagem-remetente">
                          <strong>{msg.name}</strong>
                          <span>{msg.email}</span>
                          {msg.phone && <span>Tel: {msg.phone}</span>}
                        </div>

                        <p className="mensagem-texto">{msg.message}</p>

                        <div className="mensagem-acoes">
                          {isRegistration && (
                            <button
                              type="button"
                              className="btn-acao btn-senha"
                              onClick={() => handlePrefillFromContact(msg)}
                            >
                              Pré-preencher cadastro
                            </button>
                          )}
                          <button
                            type="button"
                            className="btn-acao btn-status"
                            disabled={isBusy}
                            onClick={() => handleToggleContactStatus(msg)}
                          >
                            {msg.status === "PENDING"
                              ? "Marcar como respondida"
                              : "Reabrir como pendente"}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>

      {editingInstitution && (
        <div
          className="admin-modal-backdrop"
          role="presentation"
          onClick={closeEditModal}
        >
          <div
            className="admin-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="editar-inst-titulo"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-topo">
              <div>
                <h2 id="editar-inst-titulo">Editar instituição</h2>
                <p>Atualize os dados básicos de {editingInstitution.name}.</p>
              </div>
              <button
                type="button"
                className="admin-modal-fechar"
                aria-label="Fechar modal de edição"
                onClick={closeEditModal}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {editError && (
              <p className="admin-erro" role="alert">
                {editError}
              </p>
            )}

            <form className="admin-modal-form" onSubmit={handleEditSubmit}>
              <div className="campos-duplos">
                <div className="campo-grupo">
                  <label htmlFor="edit-name">
                    Nome completo da instituição *
                  </label>
                  <input
                    id="edit-name"
                    name="name"
                    type="text"
                    placeholder="Ex.: Instituto Federal de Educação, Ciência e Tecnologia do Ceará"
                    value={editForm.name}
                    onChange={handleEditFieldChange}
                    required
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="edit-unit-name">
                    Nome da unidade / campus (opcional)
                  </label>
                  <input
                    id="edit-unit-name"
                    name="unitName"
                    type="text"
                    placeholder="Ex.: IFCE Campus Iguatu"
                    value={editForm.unitName}
                    onChange={handleEditFieldChange}
                  />
                </div>
              </div>

              <div className="campo-grupo">
                <label htmlFor="edit-cnpj">CNPJ</label>
                <input
                  id="edit-cnpj"
                  type="text"
                  value={formatCnpj(editingInstitution.cnpj)}
                  disabled
                />
              </div>

              <div className="campos-duplos">
                <div className="campo-grupo">
                  <label htmlFor="edit-phone">Telefone *</label>
                  <input
                    id="edit-phone"
                    name="phone"
                    type="tel"
                    maxLength={15}
                    value={editForm.phone}
                    onChange={handleEditFieldChange}
                    aria-invalid={Boolean(editFieldErrors.phone)}
                    className={
                      editFieldErrors.phone ? "input-invalido" : undefined
                    }
                    required
                  />
                  {editFieldErrors.phone && (
                    <span className="campo-erro" role="alert">
                      {editFieldErrors.phone}
                    </span>
                  )}
                </div>
                <div className="campo-grupo">
                  <label htmlFor="edit-email">E-mail institucional *</label>
                  <input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editForm.email}
                    onChange={handleEditFieldChange}
                    aria-invalid={Boolean(editFieldErrors.email)}
                    className={
                      editFieldErrors.email ? "input-invalido" : undefined
                    }
                    required
                  />
                  {editFieldErrors.email && (
                    <span className="campo-erro" role="alert">
                      {editFieldErrors.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="campo-grupo">
                <label htmlFor="edit-description">Descrição</label>
                <textarea
                  id="edit-description"
                  name="description"
                  rows={3}
                  maxLength={2000}
                  value={editForm.description}
                  onChange={handleEditFieldChange}
                />
              </div>

              <div className="form-acoes">
                <button
                  type="button"
                  className="btn-acao btn-cancelar"
                  onClick={closeEditModal}
                  disabled={savingEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="admin-submit"
                  disabled={savingEdit}
                >
                  {savingEdit ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminInstituicoes;
