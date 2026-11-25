import { type CSSProperties, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, X } from "lucide-react";
import AccessibilityBar from "../components/AccessibilityBar";
import {
  CategoryIcon,
  type AccessibilityCategory,
  type AccessibilityPointImage,
} from "../components/AccessibilityResourcesManager";
import type { Tema } from "../layouts/MainLayout";
import {
  extractPaletteFromImage,
  type HarmonicLogoPalette,
} from "../utils/logoPalette";
import "./InstituicaoPublica.css";

interface PublicInstitution {
  id: number;
  name: string;
  unitName?: string | null;
  description: string;
  phone: string;
  email: string;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  latitude: number | null;
  longitude: number | null;
  logoUrl: string | null;
  coverUrl: string | null;
  floorPlanUrl?: string | null;
  floorPlanAlt?: string | null;
  customDomain: string | null;
}

interface PublicAccessibilityPoint {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  underReview?: boolean;
  category: AccessibilityCategory;
  images: AccessibilityPointImage[];
}

function getInitialTema(): Tema {
  try {
    const saved = window.localStorage.getItem("tema");
    if (saved === "claro" || saved === "escuro") return saved;
  } catch {
    // ignore
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

function InstituicaoPublica() {
  const { id } = useParams();
  const [highContrast, setHighContrast] = useState(false);
  const [fontScale, setFontScale] = useState(1);
  const [tema, setTemaEstado] = useState<Tema>(getInitialTema);
  const [institution, setInstitution] = useState<PublicInstitution | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [points, setPoints] = useState<PublicAccessibilityPoint[]>([]);
  const [availableCategories, setAvailableCategories] = useState<
    AccessibilityCategory[]
  >([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [lightboxImage, setLightboxImage] =
    useState<AccessibilityPointImage | null>(null);
  const [extractedPalette, setExtractedPalette] = useState<{
    url: string;
    palette: HarmonicLogoPalette | null;
  } | null>(null);

  const setTema = (novoTema: Tema) => {
    setTemaEstado(novoTema);
    try {
      window.localStorage.setItem("tema", novoTema);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", tema);
  }, [tema]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-scale",
      String(fontScale)
    );
    return () => {
      document.documentElement.style.removeProperty("--font-scale");
    };
  }, [fontScale]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [instRes, ptsRes] = await Promise.all([
          fetch(`/api/institutions/${id}`),
          fetch(`/api/institutions/${id}/points`),
        ]);
        const data = await instRes.json().catch(() => ({}));
        if (!instRes.ok) {
          throw new Error(data.message || "Instituição não encontrada.");
        }
        const ptsData = await ptsRes.json().catch(() => ({}));
        if (!cancelled) {
          setInstitution(data);
          setPoints(Array.isArray(ptsData?.data) ? ptsData.data : []);
          setAvailableCategories(
            Array.isArray(ptsData?.availableCategories)
              ? ptsData.availableCategories
              : []
          );
          setSelectedCategoryId(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Não foi possível carregar a instituição."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    const logoUrl = institution?.logoUrl;
    if (!logoUrl) return;

    let cancelled = false;
    extractPaletteFromImage(logoUrl).then((palette) => {
      if (!cancelled) {
        setExtractedPalette({ url: logoUrl, palette });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [institution?.logoUrl]);

  const logoPalette =
    institution?.logoUrl && extractedPalette?.url === institution.logoUrl
      ? extractedPalette.palette
      : null;

  const paletteStyle = useMemo<CSSProperties | undefined>(() => {
    if (!logoPalette || highContrast) return undefined;
    return {
      "--inst-primary": logoPalette.primary,
      "--inst-primary-hover": logoPalette.primaryHover,
      "--inst-primary-deep": logoPalette.primaryDeep,
      "--inst-page-bg": logoPalette.pageBg,
      "--inst-tint-bg": logoPalette.tintBg,
      "--inst-border": logoPalette.border,
      "--inst-cover-gradient": logoPalette.coverGradient,
      "--inst-dark-page-bg": logoPalette.darkPageBg,
      "--inst-dark-surface": logoPalette.darkSurface,
      "--inst-dark-border": logoPalette.darkBorder,
      "--inst-dark-heading": logoPalette.darkHeading,
      "--inst-dark-tint-bg": logoPalette.darkTintBg,
    } as CSSProperties;
  }, [logoPalette, highContrast]);

  const renderTopBar = () => (
    <>
      <a className="skip-link" href="#conteudo-principal">
        Pular para o conteúdo principal
      </a>
      <AccessibilityBar
        highContrast={highContrast}
        setHighContrast={setHighContrast}
        fontScale={fontScale}
        setFontScale={setFontScale}
        tema={tema}
        setTema={setTema}
      />
      <header className="inst-publica-topbar">
        <div className="inst-publica-topbar-inner">
          <Link
            className="inst-publica-brand"
            to="/"
            aria-label="Acessa+ - Plataforma de Acessibilidade"
          >
            <img
              className="inst-publica-acessa-logo"
              src="/logo-acessa.png"
              alt="Acessa+"
            />
          </Link>
          <div className="inst-publica-topbar-acoes">
            <Link className="inst-publica-contato-btn" to="/#contato-home">
              Entre em contato
            </Link>
          </div>
        </div>
      </header>
    </>
  );

  const renderFooter = () => (
    <footer className="inst-publica-footer">
      <div className="inst-publica-footer-inner">
        <Link className="inst-publica-footer-brand" to="/">
          <img
            src="/favicon.png"
            alt=""
            aria-hidden="true"
            className="inst-publica-footer-icon"
          />
          <span>Acessa+</span>
          <span className="inst-publica-footer-sep" aria-hidden="true">
            ·
          </span>
          <span className="inst-publica-footer-tagline">
            Acessibilidade para todos
          </span>
        </Link>

        <p className="inst-publica-footer-copy">
          © {new Date().getFullYear()} Acessa+. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );

  if (loading) {
    return (
      <div
        className={`inst-publica-page ${highContrast ? "high-contrast" : ""}`}
      >
        {renderTopBar()}
        <main id="conteudo-principal" tabIndex={-1} className="inst-publica">
          <div className="inst-publica-container">
            <p className="inst-publica-estado">Carregando instituição...</p>
          </div>
        </main>
        {renderFooter()}
      </div>
    );
  }

  if (error || !institution) {
    return (
      <div
        className={`inst-publica-page ${highContrast ? "high-contrast" : ""}`}
      >
        {renderTopBar()}
        <main id="conteudo-principal" tabIndex={-1} className="inst-publica">
          <div className="inst-publica-container">
            <p className="inst-publica-erro" role="alert">
              {error || "Instituição não encontrada."}
            </p>
            <Link className="inst-publica-voltar" to="/">
              Ir para o Acessa+
            </Link>
          </div>
        </main>
        {renderFooter()}
      </div>
    );
  }

  const addressParts = [
    institution.street,
    institution.number ? `nº ${institution.number}` : null,
    institution.neighborhood,
    institution.city && institution.state
      ? `${institution.city}/${institution.state}`
      : institution.city || institution.state,
    institution.zipCode ? `CEP ${institution.zipCode}` : null,
  ].filter(Boolean);

  const hasCoordinates =
    institution.latitude !== null && institution.longitude !== null;

  const mapQuery = hasCoordinates
    ? `${institution.latitude},${institution.longitude}`
    : addressParts.length > 0
      ? addressParts.join(", ")
      : null;

  const mapsEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=16&output=embed`
    : null;

  const mapsExternalUrl = mapQuery
    ? `https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}`
    : null;

  const nameLength = institution.name.trim().length;
  const titleSizeClass =
    nameLength > 58
      ? "inst-publica-titulo--muito-longo"
      : nameLength > 38
        ? "inst-publica-titulo--longo"
        : "";

  return (
    <div
      className={`inst-publica-page ${highContrast ? "high-contrast" : ""}`}
      style={paletteStyle}
    >
      {renderTopBar()}
      <main id="conteudo-principal" tabIndex={-1} className="inst-publica">
        <header className="inst-publica-hero">
          <div className="inst-publica-capa">
            {institution.coverUrl ? (
              <img
                className="inst-publica-capa-img"
                src={institution.coverUrl}
                alt={`Foto de capa de ${institution.name}`}
              />
            ) : (
              <div className="inst-publica-capa-padrao" aria-hidden="true" />
            )}
            <div className="inst-publica-capa-scrim" aria-hidden="true" />

            <div className="inst-publica-perfil-barra">
              <div className="inst-publica-logo">
                {institution.logoUrl ? (
                  <img
                    src={institution.logoUrl}
                    alt={`Logo de ${institution.name}`}
                  />
                ) : (
                  <span aria-hidden="true">
                    {institution.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              <div className={`inst-publica-titulo ${titleSizeClass}`.trim()}>
                <h1>{institution.name}</h1>
                {institution.unitName && (
                  <div className="inst-publica-meta">
                    <span className="inst-publica-unidade">
                      {institution.unitName}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="inst-publica-container">
          <div className="inst-publica-layout">
          <div className="inst-publica-principal">
            {institution.floorPlanUrl && (
              <article className="inst-publica-box inst-publica-planta-card">
                <div className="mapa-cabecalho">
                  <h2>Planta da Instituição</h2>
                  <button
                    type="button"
                    className="planta-ampliar-btn"
                    onClick={() =>
                      setLightboxImage({
                        id: -1,
                        imageUrl: institution.floorPlanUrl!,
                        altText:
                          institution.floorPlanAlt?.trim() ||
                          `Planta baixa de ${institution.name}`,
                      })
                    }
                  >
                    Ampliar planta
                  </button>
                </div>
                <button
                  type="button"
                  className="inst-publica-planta-btn"
                  onClick={() =>
                    setLightboxImage({
                      id: -1,
                      imageUrl: institution.floorPlanUrl!,
                      altText:
                        institution.floorPlanAlt?.trim() ||
                        `Planta baixa de ${institution.name}`,
                    })
                  }
                  aria-label="Ampliar planta da instituição"
                >
                  <img
                    src={institution.floorPlanUrl}
                    alt={
                      institution.floorPlanAlt?.trim() ||
                      `Planta baixa de ${institution.name}`
                    }
                  />
                </button>
              </article>
            )}

            <article className="inst-publica-box">
              <h2>Sobre a instituição</h2>
              <p className="inst-publica-descricao">
                {institution.description?.trim()
                  ? institution.description
                  : "Esta instituição ainda não adicionou uma descrição."}
              </p>
            </article>

            <article className="inst-publica-box">
              <div className="recursos-publicos-cabecalho">
                <h2>Recursos de Acessibilidade</h2>
                {points.length > 0 && (
                  <span className="recursos-publicos-total">
                    {points.length}{" "}
                    {points.length === 1 ? "recurso" : "recursos"}
                  </span>
                )}
              </div>

              {availableCategories.length > 0 && (
                <div
                  className="recursos-filtros-chips"
                  role="group"
                  aria-label="Filtrar recursos por categoria"
                >
                  <button
                    type="button"
                    className={`recurso-chip ${selectedCategoryId === null ? "ativo" : ""}`}
                    onClick={() => setSelectedCategoryId(null)}
                  >
                    Todos
                  </button>
                  {availableCategories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      className={`recurso-chip ${selectedCategoryId === cat.id ? "ativo" : ""}`}
                      onClick={() => setSelectedCategoryId(cat.id)}
                    >
                      <CategoryIcon iconKey={cat.icon} size={14} />
                      <span>{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {points.length === 0 ? (
                <p className="inst-publica-vazio">
                  Esta instituição ainda não cadastrou recursos de
                  acessibilidade públicos.
                </p>
              ) : (
                <ul className="recursos-publicos-lista">
                  {points
                    .filter(
                      (point) =>
                        selectedCategoryId === null ||
                        point.categoryId === selectedCategoryId
                    )
                    .map((point) => (
                      <li key={point.id} className="recurso-publico-item">
                        <div className="recurso-publico-topo">
                          <span className="recurso-publico-cat">
                            <CategoryIcon
                              iconKey={point.category.icon}
                              size={14}
                            />
                            <span>{point.category.name}</span>
                          </span>
                          {point.underReview && (
                            <span className="recurso-publico-alerta">
                              <AlertTriangle size={13} aria-hidden="true" />
                              <span>Em verificação</span>
                            </span>
                          )}
                        </div>
                        <h3>{point.title}</h3>
                        <p>{point.description}</p>

                        {point.images.length > 0 && (
                          <div className="recurso-publico-galeria">
                            {point.images.map((img) => (
                              <button
                                key={img.id}
                                type="button"
                                className="recurso-publico-foto-btn"
                                onClick={() => setLightboxImage(img)}
                                aria-label={`Ampliar foto: ${img.altText}`}
                              >
                                <img src={img.imageUrl} alt={img.altText} />
                              </button>
                            ))}
                          </div>
                        )}
                      </li>
                    ))}
                </ul>
              )}
            </article>

            <article className="inst-publica-box">
              <div className="mapa-cabecalho">
                <h2>Localização no Mapa</h2>
                {mapsExternalUrl && (
                  <a
                    className="mapa-link-externo"
                    href={mapsExternalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Abrir no Google Maps
                  </a>
                )}
              </div>

              {mapsEmbedUrl ? (
                <div className="inst-publica-mapa-frame">
                  <iframe
                    title={`Mapa de localização de ${institution.name}`}
                    src={mapsEmbedUrl}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>
              ) : (
                <p className="inst-publica-vazio">
                  Localização ainda não informada pela instituição.
                </p>
              )}
            </article>
          </div>

          <aside
            className="inst-publica-sidebar"
            aria-label="Informações da instituição"
          >
            <div className="inst-publica-box inst-info-card">
              <h2>Informações</h2>

              <div className="info-bloco">
                <h3>Telefone</h3>
                <p>{institution.phone}</p>
              </div>

              <div className="info-bloco">
                <h3>E-mail</h3>
                <p>{institution.email}</p>
              </div>

              <div className="info-bloco">
                <h3>Endereço</h3>
                {addressParts.length > 0 ? (
                  <p>{addressParts.join(", ")}</p>
                ) : (
                  <p className="inst-publica-vazio">
                    Endereço ainda não informado.
                  </p>
                )}
              </div>
            </div>
          </aside>
          </div>
        </div>
      </main>
      {renderFooter()}
      {lightboxImage && (
        <div
          className="recurso-lightbox-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Visualização ampliada da foto"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="recurso-lightbox"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="recurso-lightbox-fechar"
              aria-label="Fechar foto ampliada"
              onClick={() => setLightboxImage(null)}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <img src={lightboxImage.imageUrl} alt={lightboxImage.altText} />
            <p className="recurso-lightbox-legenda">{lightboxImage.altText}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstituicaoPublica;
