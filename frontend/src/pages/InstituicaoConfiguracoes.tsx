import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Accessibility,
  Building2,
  Check,
  Copy,
  ExternalLink,
  ImagePlus,
  LogOut,
  Map as MapIcon,
  MapPin,
  Save,
  Trash2,
} from "lucide-react";
import AccessibilityResourcesManager from "../components/AccessibilityResourcesManager";
import { useAuth } from "../contexts/AuthContext";
import {
  extractCoordinatesFromGoogleMapsUrl,
  formatPhoneInput,
  validateInstitutionContactFields,
  type InstitutionFieldErrors,
} from "../utils/institutionValidation";
import "./InstituicaoConfiguracoes.css";

interface ProfileFormState {
  name: string;
  unitName: string;
  cnpj: string;
  phone: string;
  email: string;
  customDomain: string;
  description: string;
  zipCode: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  logoUrl: string | null;
  coverUrl: string | null;
  floorPlanUrl: string | null;
  floorPlanAlt: string;
}

const INITIAL_STATE: ProfileFormState = {
  name: "",
  unitName: "",
  cnpj: "",
  phone: "",
  email: "",
  customDomain: "",
  description: "",
  zipCode: "",
  street: "",
  number: "",
  neighborhood: "",
  city: "",
  state: "",
  latitude: "",
  longitude: "",
  logoUrl: null,
  coverUrl: null,
  floorPlanUrl: null,
  floorPlanAlt: "",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

function formatCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) return cnpj;
  return digits.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

function InstituicaoConfiguracoes() {
  const { token, user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [institutionId, setInstitutionId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "resources">(
    "profile"
  );
  const [form, setForm] = useState<ProfileFormState>(INITIAL_STATE);
  const [mapsLink, setMapsLink] = useState("");
  const [mapsLinkHint, setMapsLinkHint] = useState<string | null>(null);
  const [copiedPublicLink, setCopiedPublicLink] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [floorPlanPreview, setFloorPlanPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<InstitutionFieldErrors>({});

  const loadProfile = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/institution/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao carregar perfil.");
      }

      setInstitutionId(data.id);
      setForm({
        name: data.name ?? "",
        unitName: data.unitName ?? "",
        cnpj: data.cnpj ?? "",
        phone: data.phone ? formatPhoneInput(data.phone) : "",
        email: data.email ?? "",
        customDomain: data.customDomain ?? "",
        description: data.description ?? "",
        zipCode: data.zipCode ?? "",
        street: data.street ?? "",
        number: data.number ?? "",
        neighborhood: data.neighborhood ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        latitude:
          data.latitude !== null && data.latitude !== undefined
            ? String(data.latitude)
            : "",
        longitude:
          data.longitude !== null && data.longitude !== undefined
            ? String(data.longitude)
            : "",
        logoUrl: data.logoUrl ?? null,
        coverUrl: data.coverUrl ?? null,
        floorPlanUrl: data.floorPlanUrl ?? null,
        floorPlanAlt: data.floorPlanAlt ?? "",
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar perfil."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "INSTITUTION") {
      loadProfile();
    }
  }, [isAuthenticated, user?.role, loadProfile]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
    };
  }, [coverPreview]);

  if (!isAuthenticated || user?.role !== "INSTITUTION") {
    return <Navigate to="/login" replace />;
  }

  const handleFieldChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    let nextValue = value;
    if (name === "state") {
      nextValue = value.toUpperCase().slice(0, 2);
    } else if (name === "phone") {
      nextValue = formatPhoneInput(value);
    }

    setForm((prev) => ({ ...prev, [name]: nextValue }));
  };

  const handleMapsLinkChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMapsLink(value);
    setMapsLinkHint(null);

    if (!value.trim()) return;

    const coords = extractCoordinatesFromGoogleMapsUrl(value);
    if (coords) {
      setForm((prev) => ({
        ...prev,
        latitude: String(coords.latitude),
        longitude: String(coords.longitude),
      }));
      setMapsLinkHint(
        `Coordenadas extraídas: ${coords.latitude}, ${coords.longitude}`
      );
    } else {
      setMapsLinkHint(
        "Não foi possível extrair as coordenadas. Use o link completo do Google Maps (com @lat,lng na URL) ou preencha abaixo."
      );
    }
  };

  const handleImageSelect = (
    e: ChangeEvent<HTMLInputElement>,
    kind: "logo" | "cover" | "floorPlan"
  ) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Formato inválido. Use JPEG, PNG ou WebP.");
      e.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("A imagem deve ter no máximo 5 MB.");
      e.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (kind === "logo") {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(file);
      setLogoPreview(previewUrl);
    } else if (kind === "cover") {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(file);
      setCoverPreview(previewUrl);
    } else {
      if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview);
      setFloorPlanFile(file);
      setFloorPlanPreview(previewUrl);
    }
  };

  const handleRemoveImage = (kind: "logo" | "cover" | "floorPlan") => {
    if (kind === "logo") {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(null);
      setLogoPreview(null);
      setForm((prev) => ({ ...prev, logoUrl: null }));
    } else if (kind === "cover") {
      if (coverPreview) URL.revokeObjectURL(coverPreview);
      setCoverFile(null);
      setCoverPreview(null);
      setForm((prev) => ({ ...prev, coverUrl: null }));
    } else {
      if (floorPlanPreview) URL.revokeObjectURL(floorPlanPreview);
      setFloorPlanFile(null);
      setFloorPlanPreview(null);
      setForm((prev) => ({ ...prev, floorPlanUrl: null, floorPlanAlt: "" }));
    }
  };

  const uploadImage = async (
    file: File,
    kind: "logo" | "cover" | "floorPlan"
  ): Promise<string> => {
    const endpoint =
      kind === "floorPlan"
        ? "/api/institution/profile/floor-plan"
        : `/api/institution/profile/${kind}`;
    const body = new FormData();
    body.append(kind, file);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(
        data.message ||
          `Falha ao enviar a ${
            kind === "logo" ? "logo" : kind === "cover" ? "capa" : "planta"
          }.`
      );
    }
    return kind === "logo"
      ? data.logoUrl
      : kind === "cover"
        ? data.coverUrl
        : data.floorPlanUrl;
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const contactErrors = validateInstitutionContactFields({
      cnpj: form.cnpj,
      phone: form.phone,
      email: form.email,
      customDomain: form.customDomain,
    });
    if (Object.keys(contactErrors).length > 0) {
      setFieldErrors(contactErrors);
      setError("Corrija os campos destacados antes de salvar.");
      return;
    }
    setFieldErrors({});

    const latRaw = form.latitude.trim();
    const lngRaw = form.longitude.trim();
    let lat: number | null = null;
    let lng: number | null = null;

    if (latRaw !== "" || lngRaw !== "") {
      lat = Number(latRaw.replace(",", "."));
      lng = Number(lngRaw.replace(",", "."));
      if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
        setError("Informe uma latitude válida entre -90 e 90.");
        return;
      }
      if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
        setError("Informe uma longitude válida entre -180 e 180.");
        return;
      }
    }

    setSaving(true);
    try {
      let nextLogoUrl = form.logoUrl;
      let nextCoverUrl = form.coverUrl;
      let nextFloorPlanUrl = form.floorPlanUrl;

      if (logoFile) {
        nextLogoUrl = await uploadImage(logoFile, "logo");
      }
      if (coverFile) {
        nextCoverUrl = await uploadImage(coverFile, "cover");
      }
      if (floorPlanFile) {
        nextFloorPlanUrl = await uploadImage(floorPlanFile, "floorPlan");
      }

      const payload = {
        name: form.name,
        unitName: form.unitName.trim() || null,
        phone: form.phone,
        email: form.email,
        customDomain: form.customDomain.trim() || null,
        description: form.description,
        zipCode: form.zipCode.trim() || null,
        street: form.street.trim() || null,
        number: form.number.trim() || null,
        neighborhood: form.neighborhood.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        latitude: lat,
        longitude: lng,
        logoUrl: nextLogoUrl,
        coverUrl: nextCoverUrl,
        floorPlanUrl: nextFloorPlanUrl,
        floorPlanAlt: nextFloorPlanUrl
          ? form.floorPlanAlt.trim() || null
          : null,
      };

      const response = await fetch("/api/institution/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const firstIssue = Array.isArray(data.errors)
          ? data.errors[0]?.message
          : null;
        throw new Error(
          firstIssue || data.message || "Erro ao salvar configurações."
        );
      }

      setLogoFile(null);
      setLogoPreview(null);
      setCoverFile(null);
      setCoverPreview(null);
      setForm((prev) => ({
        ...prev,
        logoUrl: data.logoUrl ?? nextLogoUrl,
        coverUrl: data.coverUrl ?? nextCoverUrl,
      }));
      setSuccess("Configurações da instituição salvas com sucesso!");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao salvar configurações."
      );
    } finally {
      setSaving(false);
    }
  };

  const activeCover = coverPreview || form.coverUrl;
  const activeFloorPlan = floorPlanPreview || form.floorPlanUrl;
  const activeLogo = logoPreview || form.logoUrl;
  const publicPath = institutionId ? `/instituicoes/${institutionId}` : null;
  const publicFullUrl = publicPath
    ? `${window.location.origin}${publicPath}`
    : null;

  const handleCopyPublicUrl = async () => {
    if (!publicFullUrl) return;
    try {
      await navigator.clipboard.writeText(publicFullUrl);
      setCopiedPublicLink(true);
      setTimeout(() => setCopiedPublicLink(false), 2000);
    } catch {
      // Clipboard API pode não estar disponível em contextos não seguros
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="inst-workspace">
      <header className="inst-topbar">
        <div className="inst-topbar-inner">
          <div className="inst-topbar-brand">
            <img
              className="inst-topbar-logo"
              src="/logo-acessa.png"
              alt="Acessa+"
            />
            <span className="inst-topbar-titulo">
              Configurações da Instituição
            </span>
          </div>

          <div className="inst-topbar-acoes">
            <button
              type="button"
              className="inst-topbar-sair"
              onClick={handleLogout}
            >
              <LogOut size={15} aria-hidden="true" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="inst-config">
        <div className="inst-config-container">
          <div className="inst-config-cabecalho">
            <div>
              <span className="inst-config-badge">Painel da Instituição</span>
              <h1>Personalize sua página pública</h1>
              <p>
                Gerencie identidade visual, informações de contato, endereço e
                localização exata no mapa.
              </p>
            </div>
          </div>

          {publicFullUrl && (
            <div className="public-link-card">
              <div className="public-link-info">
                <span className="public-link-rotulo">
                  Link da sua página pública
                </span>
                <a
                  className="public-link-url"
                  href={publicPath!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {publicFullUrl}
                </a>
              </div>
              <div className="public-link-botoes">
                <button
                  type="button"
                  className="btn-copiar-link"
                  onClick={handleCopyPublicUrl}
                >
                  {copiedPublicLink ? (
                    <Check size={15} aria-hidden="true" />
                  ) : (
                    <Copy size={15} aria-hidden="true" />
                  )}
                  <span>{copiedPublicLink ? "Copiado!" : "Copiar link"}</span>
                </button>
                <a
                  className="btn-abrir-link"
                  href={publicPath!}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink size={15} aria-hidden="true" />
                  <span>Visualizar página</span>
                </a>
              </div>
            </div>
          )}

          <div className="inst-config-tabs" role="tablist" aria-label="Seções de configuração">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "profile"}
              className={`inst-config-tab ${activeTab === "profile" ? "ativo" : ""}`}
              onClick={() => setActiveTab("profile")}
            >
              <Building2 size={16} aria-hidden="true" />
              <span>Dados e Perfil</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "resources"}
              className={`inst-config-tab ${activeTab === "resources" ? "ativo" : ""}`}
              onClick={() => setActiveTab("resources")}
            >
              <Accessibility size={16} aria-hidden="true" />
              <span>Recursos de Acessibilidade</span>
            </button>
          </div>

          {activeTab === "resources" && token ? (
            <AccessibilityResourcesManager token={token} />
          ) : loading ? (
            <p className="inst-config-carregando">Carregando perfil...</p>
          ) : (
            <form className="inst-config-form" onSubmit={handleSubmit}>
              {error && (
                <p className="inst-config-erro" role="alert">
                  {error}
                </p>
              )}
              {success && (
                <div className="inst-config-sucesso" role="status">
                  <span>{success}</span>
                  {publicPath && (
                    <a
                      href={publicPath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver atualização na página pública
                    </a>
                  )}
                </div>
              )}

            <div className="perfil-visual-card">
              <div className="capa-preview">
                {activeCover ? (
                  <img src={activeCover} alt="Prévia da foto de capa" />
                ) : (
                  <div className="capa-placeholder">
                    <span>Prévia da foto de capa da página pública</span>
                  </div>
                )}
                <div className="capa-preview-scrim" aria-hidden="true" />

                <div className="perfil-preview-sobreposicao">
                  <div className="logo-perfil-preview">
                    {activeLogo ? (
                      <img src={activeLogo} alt="Prévia da logo" />
                    ) : (
                      <span>
                        {form.name ? form.name.slice(0, 2).toUpperCase() : "IN"}
                      </span>
                    )}
                  </div>
                  <div className="perfil-preview-texto">
                    <strong>
                      {form.name.trim() || "Nome da sua instituição"}
                    </strong>
                    {form.unitName.trim() && (
                      <span className="perfil-preview-unidade">
                        {form.unitName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="perfil-visual-barra">
                <div className="perfil-upload-controles">
                  <div className="upload-grupo">
                    <span className="upload-titulo">Logo da instituição</span>
                    <p className="upload-dica">
                      JPEG, PNG ou WebP até 5 MB. As cores da página pública se
                      adaptam à logo.
                    </p>
                    <div className="upload-botoes">
                      <label htmlFor="input-logo" className="btn-upload-arquivo">
                        <ImagePlus size={15} aria-hidden="true" />
                        <span>{activeLogo ? "Alterar logo" : "Enviar logo"}</span>
                      </label>
                      <input
                        id="input-logo"
                        className="sr-only-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageSelect(e, "logo")}
                      />
                      {activeLogo && (
                        <button
                          type="button"
                          className="btn-remover-img"
                          onClick={() => handleRemoveImage("logo")}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="upload-grupo">
                    <span className="upload-titulo">Foto de capa</span>
                    <p className="upload-dica">
                      Imagem horizontal em alta resolução para o topo da página
                      pública.
                    </p>
                    <div className="upload-botoes">
                      <label
                        htmlFor="input-cover"
                        className="btn-upload-arquivo"
                      >
                        <ImagePlus size={15} aria-hidden="true" />
                        <span>
                          {activeCover ? "Alterar capa" : "Enviar capa"}
                        </span>
                      </label>
                      <input
                        id="input-cover"
                        className="sr-only-input"
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => handleImageSelect(e, "cover")}
                      />
                      {activeCover && (
                        <button
                          type="button"
                          className="btn-remover-img"
                          onClick={() => handleRemoveImage("cover")}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Remover</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <fieldset className="config-fieldset">
              <legend>
                <span className="legend-inner">
                  <MapIcon size={17} aria-hidden="true" />
                  <span>Planta da Instituição (Mapa Interno)</span>
                </span>
              </legend>
              <p className="upload-dica">
                Envie a planta baixa ou mapa interno do prédio/campus. Quando
                cadastrada, ela aparece logo no início da página pública para
                ajudar os visitantes a localizar rampas, elevadores e salas.
              </p>

              <div className="planta-config-bloco">
                {activeFloorPlan && (
                  <div className="planta-config-preview">
                    <img
                      src={activeFloorPlan}
                      alt={
                        form.floorPlanAlt.trim() ||
                        "Prévia da planta da instituição"
                      }
                    />
                  </div>
                )}

                <div className="planta-config-controles">
                  <div className="upload-botoes">
                    <label
                      htmlFor="input-floor-plan"
                      className="btn-upload-arquivo"
                    >
                      <ImagePlus size={15} aria-hidden="true" />
                      <span>
                        {activeFloorPlan ? "Alterar planta" : "Enviar planta"}
                      </span>
                    </label>
                    <input
                      id="input-floor-plan"
                      className="sr-only-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) => handleImageSelect(e, "floorPlan")}
                    />
                    {activeFloorPlan && (
                      <button
                        type="button"
                        className="btn-remover-img"
                        onClick={() => handleRemoveImage("floorPlan")}
                      >
                        <Trash2 size={14} aria-hidden="true" />
                        <span>Remover planta</span>
                      </button>
                    )}
                  </div>

                  {activeFloorPlan && (
                    <div className="campo-grupo">
                      <label htmlFor="cfg-floorPlanAlt">
                        Descrição acessível da planta (texto alternativo)
                      </label>
                      <input
                        id="cfg-floorPlanAlt"
                        name="floorPlanAlt"
                        type="text"
                        maxLength={250}
                        placeholder="Ex.: Planta do térreo indicando rampa na entrada, elevador central e banheiro adaptado."
                        value={form.floorPlanAlt}
                        onChange={handleFieldChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="config-fieldset">
              <legend>
                <span className="legend-inner">
                  <Building2 size={17} aria-hidden="true" />
                  <span>Dados Gerais</span>
                </span>
              </legend>
              <div className="campos-duplos">
                <div className="campo-grupo">
                  <label htmlFor="cfg-name">
                    Nome completo da instituição *
                  </label>
                  <input
                    id="cfg-name"
                    name="name"
                    type="text"
                    placeholder="Ex.: Instituto Federal de Educação, Ciência e Tecnologia do Ceará"
                    value={form.name}
                    onChange={handleFieldChange}
                    required
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-unit-name">
                    Nome da unidade / campus (opcional)
                  </label>
                  <input
                    id="cfg-unit-name"
                    name="unitName"
                    type="text"
                    placeholder="Ex.: IFCE Campus Iguatu"
                    value={form.unitName}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>

              <div className="campo-grupo">
                <label htmlFor="cfg-cnpj">CNPJ</label>
                <input
                  id="cfg-cnpj"
                  type="text"
                  value={formatCnpj(form.cnpj)}
                  disabled
                />
              </div>

              <div className="campos-duplos">
                <div className="campo-grupo">
                  <label htmlFor="cfg-phone">Telefone *</label>
                  <input
                    id="cfg-phone"
                    name="phone"
                    type="tel"
                    maxLength={15}
                    value={form.phone}
                    onChange={handleFieldChange}
                    required
                  />
                  {fieldErrors.phone && (
                    <span className="campo-erro">{fieldErrors.phone}</span>
                  )}
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-email">E-mail *</label>
                  <input
                    id="cfg-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleFieldChange}
                    required
                  />
                  {fieldErrors.email && (
                    <span className="campo-erro">{fieldErrors.email}</span>
                  )}
                </div>
              </div>

              <div className="campo-grupo">
                <label htmlFor="cfg-description">Descrição</label>
                <textarea
                  id="cfg-description"
                  name="description"
                  rows={3}
                  maxLength={2000}
                  placeholder="Apresente sua instituição e os recursos de acessibilidade disponíveis..."
                  value={form.description}
                  onChange={handleFieldChange}
                />
              </div>
            </fieldset>

            <fieldset className="config-fieldset">
              <legend>
                <span className="legend-inner">
                  <MapPin size={17} aria-hidden="true" />
                  <span>Endereço</span>
                </span>
              </legend>
              <div className="campos-triplos-end">
                <div className="campo-grupo">
                  <label htmlFor="cfg-zipCode">CEP</label>
                  <input
                    id="cfg-zipCode"
                    name="zipCode"
                    type="text"
                    placeholder="00000-000"
                    value={form.zipCode}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-street">Rua / Logradouro</label>
                  <input
                    id="cfg-street"
                    name="street"
                    type="text"
                    value={form.street}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-number">Número</label>
                  <input
                    id="cfg-number"
                    name="number"
                    type="text"
                    value={form.number}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>

              <div className="campos-triplos-end">
                <div className="campo-grupo">
                  <label htmlFor="cfg-neighborhood">Bairro</label>
                  <input
                    id="cfg-neighborhood"
                    name="neighborhood"
                    type="text"
                    value={form.neighborhood}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-city">Cidade</label>
                  <input
                    id="cfg-city"
                    name="city"
                    type="text"
                    value={form.city}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-state">UF</label>
                  <input
                    id="cfg-state"
                    name="state"
                    type="text"
                    maxLength={2}
                    placeholder="CE"
                    value={form.state}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>
            </fieldset>

            <fieldset className="config-fieldset">
              <legend>
                <span className="legend-inner">
                  <MapIcon size={17} aria-hidden="true" />
                  <span>Localização no Mapa (Google Maps)</span>
                </span>
              </legend>

              <div className="campo-grupo">
                <label htmlFor="cfg-maps-link">Link do Google Maps</label>
                <input
                  id="cfg-maps-link"
                  type="url"
                  placeholder="Cole aqui a URL completa do Google Maps (ex.: https://www.google.com/maps/place/.../@-6.36,-39.30,17z)"
                  value={mapsLink}
                  onChange={handleMapsLinkChange}
                />
                {mapsLinkHint && (
                  <span className="maps-dica">{mapsLinkHint}</span>
                )}
              </div>

              <div className="campos-duplos">
                <div className="campo-grupo">
                  <label htmlFor="cfg-latitude">Latitude</label>
                  <input
                    id="cfg-latitude"
                    name="latitude"
                    type="text"
                    inputMode="decimal"
                    placeholder="-6.360000"
                    value={form.latitude}
                    onChange={handleFieldChange}
                  />
                </div>
                <div className="campo-grupo">
                  <label htmlFor="cfg-longitude">Longitude</label>
                  <input
                    id="cfg-longitude"
                    name="longitude"
                    type="text"
                    inputMode="decimal"
                    placeholder="-39.300000"
                    value={form.longitude}
                    onChange={handleFieldChange}
                  />
                </div>
              </div>

              {(() => {
                const latRaw = form.latitude.trim();
                const lngRaw = form.longitude.trim();
                const hasCoords = latRaw !== "" && lngRaw !== "";
                const addressQuery = [
                  form.street,
                  form.number,
                  form.neighborhood,
                  form.city,
                  form.state,
                ]
                  .filter((p) => p.trim() !== "")
                  .join(", ");
                const query = hasCoords
                  ? `${latRaw},${lngRaw}`
                  : addressQuery || null;
                if (!query) return null;
                return (
                  <div className="osm-mapa-wrap">
                    <iframe
                      title="Prévia da localização no Google Maps"
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=16&output=embed`}
                      className="osm-mapa"
                      style={{ border: 0 }}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                );
              })()}
            </fieldset>

            <div className="config-acoes">
              <span className="config-acoes-dica">
                As alterações ficam visíveis na página pública imediatamente após
                salvar.
              </span>
              <button
                type="submit"
                className="inst-config-salvar"
                disabled={saving}
              >
                <Save size={16} aria-hidden="true" />
                <span>{saving ? "Salvando..." : "Salvar configurações"}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  </div>
  );
}

export default InstituicaoConfiguracoes;
