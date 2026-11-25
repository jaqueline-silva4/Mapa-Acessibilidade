import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type SubmitEvent,
} from "react";
import {
  Accessibility,
  ArrowUpDown,
  BookOpen,
  Car,
  CheckCircle2,
  Ear,
  Eye,
  EyeOff,
  Footprints,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import "./AccessibilityResourcesManager.css";

export interface AccessibilityCategory {
  id: number;
  name: string;
  icon: string;
}

export interface AccessibilityPointImage {
  id: number;
  imageUrl: string;
  altText: string;
}

export interface AccessibilityPointItem {
  id: number;
  categoryId: number;
  title: string;
  description: string;
  active: boolean;
  reportCount?: number;
  category: AccessibilityCategory;
  images: AccessibilityPointImage[];
}

interface PendingPhoto {
  file: File;
  previewUrl: string;
  altText: string;
}

interface ExistingPhotoState {
  id: number;
  imageUrl: string;
  altText: string;
  markedForRemoval: boolean;
}

interface AccessibilityResourcesManagerProps {
  token: string;
}

const MAX_IMAGES = 5;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function CategoryIcon({
  iconKey,
  size = 16,
}: {
  iconKey: string;
  size?: number;
}) {
  switch (iconKey) {
    case "ramp":
      return <Accessibility size={size} aria-hidden="true" />;
    case "tactile-paving":
      return <Footprints size={size} aria-hidden="true" />;
    case "accessible-restroom":
      return <Accessibility size={size} aria-hidden="true" />;
    case "sign-language":
      return <Ear size={size} aria-hidden="true" />;
    case "elevator":
      return <ArrowUpDown size={size} aria-hidden="true" />;
    case "audio-description":
      return <Eye size={size} aria-hidden="true" />;
    case "parking":
      return <Car size={size} aria-hidden="true" />;
    case "braille":
      return <BookOpen size={size} aria-hidden="true" />;
    default:
      return <CheckCircle2 size={size} aria-hidden="true" />;
  }
}

function AccessibilityResourcesManager({
  token,
}: AccessibilityResourcesManagerProps) {
  const [categories, setCategories] = useState<AccessibilityCategory[]>([]);
  const [points, setPoints] = useState<AccessibilityPointItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingPointId, setEditingPointId] = useState<number | null>(null);
  const [categoryId, setCategoryId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhotoState[]>(
    []
  );
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [busyPointId, setBusyPointId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, ptsRes] = await Promise.all([
        fetch("/api/accessibility-categories"),
        fetch("/api/institution/points", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const catData = await catRes.json().catch(() => []);
      const ptsData = await ptsRes.json().catch(() => []);

      if (!catRes.ok) {
        throw new Error(
          catData.message || "Erro ao carregar categorias de acessibilidade."
        );
      }
      if (!ptsRes.ok) {
        throw new Error(
          ptsData.message || "Erro ao carregar recursos da instituição."
        );
      }

      setCategories(Array.isArray(catData) ? catData : []);
      setPoints(Array.isArray(ptsData) ? ptsData : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao carregar recursos de acessibilidade."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const resetForm = () => {
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setEditingPointId(null);
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setTitle("");
    setDescription("");
    setActive(true);
    setExistingPhotos([]);
    setPendingPhotos([]);
    setFormError(null);
    setFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setCategoryId(categories[0] ? String(categories[0].id) : "");
    setFormOpen(true);
    setFeedback(null);
  };

  const openEditForm = (point: AccessibilityPointItem) => {
    pendingPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setEditingPointId(point.id);
    setCategoryId(String(point.categoryId));
    setTitle(point.title);
    setDescription(point.description);
    setActive(point.active);
    setExistingPhotos(
      point.images.map((img) => ({
        id: img.id,
        imageUrl: img.imageUrl,
        altText: img.altText,
        markedForRemoval: false,
      }))
    );
    setPendingPhotos([]);
    setFormError(null);
    setFormOpen(true);
    setConfirmDeleteId(null);
    setFeedback(null);
  };

  const remainingExistingCount = existingPhotos.filter(
    (img) => !img.markedForRemoval
  ).length;
  const totalPhotosCount = remainingExistingCount + pendingPhotos.length;

  const handleFilesSelected = (e: ChangeEvent<HTMLInputElement>) => {
    setFormError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    const availableSlots = MAX_IMAGES - totalPhotosCount;
    if (availableSlots <= 0) {
      setFormError(`Cada recurso pode ter no máximo ${MAX_IMAGES} fotos.`);
      return;
    }

    const nextPending: PendingPhoto[] = [];
    for (const file of files.slice(0, availableSlots)) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFormError("Use apenas imagens JPEG, PNG ou WebP.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError("Cada imagem deve ter no máximo 5 MB.");
        continue;
      }
      nextPending.push({
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
      });
    }

    if (files.length > availableSlots) {
      setFormError(
        `Limite de ${MAX_IMAGES} fotos por recurso atingido; apenas parte das imagens foi adicionada.`
      );
    }

    setPendingPhotos((prev) => [...prev, ...nextPending]);
  };

  const handlePendingAltChange = (index: number, value: string) => {
    setPendingPhotos((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, altText: value } : item
      )
    );
    setFormError(null);
  };

  const handleRemovePending = (index: number) => {
    setPendingPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleExistingAltChange = (id: number, value: string) => {
    setExistingPhotos((prev) =>
      prev.map((img) => (img.id === id ? { ...img, altText: value } : img))
    );
    setFormError(null);
  };

  const handleToggleExistingRemoval = (id: number) => {
    setExistingPhotos((prev) =>
      prev.map((img) =>
        img.id === id
          ? { ...img, markedForRemoval: !img.markedForRemoval }
          : img
      )
    );
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!categoryId) {
      setFormError("Selecione uma categoria de acessibilidade.");
      return;
    }
    if (title.trim().length < 3) {
      setFormError("O título deve ter pelo menos 3 caracteres.");
      return;
    }
    if (description.trim().length < 20) {
      setFormError(
        "Descreva o recurso (localização, funcionamento ou horários) com pelo menos 20 caracteres."
      );
      return;
    }

    const missingPendingAlt = pendingPhotos.some(
      (p) => p.altText.trim().length === 0
    );
    const missingExistingAlt = existingPhotos.some(
      (img) => !img.markedForRemoval && img.altText.trim().length === 0
    );
    if (missingPendingAlt || missingExistingAlt) {
      setFormError(
        "Informe o texto alternativo (descrição acessível) para todas as fotos."
      );
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", categoryId);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("active", String(active));
      formData.append(
        "altTexts",
        JSON.stringify(pendingPhotos.map((p) => p.altText.trim()))
      );

      for (const item of pendingPhotos) {
        formData.append("images", item.file);
      }

      if (editingPointId !== null) {
        const removeIds = existingPhotos
          .filter((img) => img.markedForRemoval)
          .map((img) => img.id);
        const imageAlts = existingPhotos
          .filter((img) => !img.markedForRemoval)
          .map((img) => ({ id: img.id, altText: img.altText.trim() }));

        formData.append("removeImageIds", JSON.stringify(removeIds));
        formData.append("imageAlts", JSON.stringify(imageAlts));
      }

      const endpoint =
        editingPointId !== null
          ? `/api/institution/points/${editingPointId}`
          : "/api/institution/points";

      const response = await fetch(endpoint, {
        method: editingPointId !== null ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data.message || "Não foi possível salvar o recurso de acessibilidade."
        );
      }

      setFeedback(
        editingPointId !== null
          ? "Recurso de acessibilidade atualizado com sucesso!"
          : "Recurso de acessibilidade cadastrado com sucesso!"
      );
      resetForm();
      await loadData();
    } catch (err) {
      setFormError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar recurso de acessibilidade."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (point: AccessibilityPointItem) => {
    setBusyPointId(point.id);
    setError(null);
    setFeedback(null);
    try {
      const formData = new FormData();
      formData.append("active", String(!point.active));
      formData.append("altTexts", "[]");
      formData.append("removeImageIds", "[]");
      formData.append("imageAlts", "[]");

      const response = await fetch(`/api/institution/points/${point.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao alterar visibilidade.");
      }

      setPoints((prev) =>
        prev.map((item) => (item.id === point.id ? data : item))
      );
      setFeedback(
        data.active
          ? `Recurso "${point.title}" publicado na página pública.`
          : `Recurso "${point.title}" ocultado da página pública.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao atualizar recurso."
      );
    } finally {
      setBusyPointId(null);
    }
  };

  const handleDelete = async (point: AccessibilityPointItem) => {
    setBusyPointId(point.id);
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(`/api/institution/points/${point.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Erro ao excluir recurso.");
      }

      setPoints((prev) => prev.filter((item) => item.id !== point.id));
      setConfirmDeleteId(null);
      setFeedback(`Recurso "${point.title}" removido.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir recurso.");
    } finally {
      setBusyPointId(null);
    }
  };

  return (
    <section
      className="recursos-manager"
      aria-labelledby="recursos-manager-titulo"
    >
      <div className="recursos-topo">
        <div>
          <h2 id="recursos-manager-titulo">Recursos de Acessibilidade</h2>
          <p>
            Cadastre recursos físicos (rampas, piso tátil, elevadores, banheiros
            adaptados) e serviços (intérprete de Libras, audiodescrição,
            Braille) com fotos e descrições acessíveis.
          </p>
        </div>
        {!formOpen && (
          <button
            type="button"
            className="recursos-btn-novo"
            onClick={openCreateForm}
          >
            <Plus size={16} aria-hidden="true" />
            <span>Adicionar recurso</span>
          </button>
        )}
      </div>

      {error && (
        <p className="inst-config-erro" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <div className="inst-config-sucesso" role="status">
          <span>{feedback}</span>
        </div>
      )}

      {formOpen && (
        <form className="recurso-form-card" onSubmit={handleSubmit}>
          <div className="recurso-form-header">
            <h3>
              {editingPointId !== null
                ? "Editar recurso de acessibilidade"
                : "Novo recurso de acessibilidade"}
            </h3>
            <button
              type="button"
              className="recurso-form-fechar"
              aria-label="Fechar formulário"
              onClick={resetForm}
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          {formError && (
            <p className="inst-config-erro" role="alert">
              {formError}
            </p>
          )}

          <div className="campos-duplos">
            <div className="campo-grupo">
              <label htmlFor="rec-category">Categoria *</label>
              <select
                id="rec-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo-grupo">
              <label htmlFor="rec-title">Título do recurso *</label>
              <input
                id="rec-title"
                type="text"
                maxLength={120}
                placeholder="Ex.: Rampa na entrada principal ou Intérprete de Libras"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="campo-grupo">
            <label htmlFor="rec-description">
              Descrição detalhada * (mínimo 20 caracteres)
            </label>
            <textarea
              id="rec-description"
              rows={3}
              maxLength={2000}
              placeholder="Descreva onde fica, horários de atendimento, condições de uso ou como solicitar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="recurso-fotos-bloco">
            <div className="recurso-fotos-topo">
              <div>
                <span className="upload-titulo">
                  Fotos do recurso (opcional — até {MAX_IMAGES} fotos)
                </span>
                <p className="upload-dica">
                  Adicione fotos reais de rampas, pisos táteis, elevadores ou
                  sinalizações. Toda foto exige texto alternativo para leitores
                  de tela.
                </p>
              </div>
              {totalPhotosCount < MAX_IMAGES && (
                <label htmlFor="rec-images-input" className="btn-upload-arquivo">
                  <ImagePlus size={15} aria-hidden="true" />
                  <span>Adicionar fotos</span>
                </label>
              )}
              <input
                id="rec-images-input"
                className="sr-only-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFilesSelected}
              />
            </div>

            {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
              <div className="recurso-fotos-lista">
                {existingPhotos.map((img) => (
                  <div
                    key={img.id}
                    className={`recurso-foto-item ${img.markedForRemoval ? "marcada-remocao" : ""}`}
                  >
                    <img src={img.imageUrl} alt={img.altText} />
                    <div className="recurso-foto-campos">
                      <label htmlFor={`alt-existing-${img.id}`}>
                        Texto alternativo *
                      </label>
                      <input
                        id={`alt-existing-${img.id}`}
                        type="text"
                        maxLength={250}
                        disabled={img.markedForRemoval}
                        value={img.altText}
                        onChange={(e) =>
                          handleExistingAltChange(img.id, e.target.value)
                        }
                        placeholder="Descreva o que aparece na foto"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-remover-img"
                      onClick={() => handleToggleExistingRemoval(img.id)}
                    >
                      {img.markedForRemoval ? "Desfazer" : "Remover"}
                    </button>
                  </div>
                ))}

                {pendingPhotos.map((photo, index) => (
                  <div key={photo.previewUrl} className="recurso-foto-item">
                    <img
                      src={photo.previewUrl}
                      alt={photo.altText || "Prévia da foto selecionada"}
                    />
                    <div className="recurso-foto-campos">
                      <label htmlFor={`alt-pending-${index}`}>
                        Texto alternativo *
                      </label>
                      <input
                        id={`alt-pending-${index}`}
                        type="text"
                        maxLength={250}
                        value={photo.altText}
                        onChange={(e) =>
                          handlePendingAltChange(index, e.target.value)
                        }
                        placeholder="Ex.: Rampa de concreto com corrimão duplo na entrada do Bloco A"
                        required
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-remover-img"
                      onClick={() => handleRemovePending(index)}
                    >
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <label className="recurso-checkbox">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />
            <span>Publicar este recurso na página pública da instituição</span>
          </label>

          <div className="recurso-form-acoes">
            <button
              type="button"
              className="recurso-btn-cancelar"
              disabled={submitting}
              onClick={resetForm}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inst-config-salvar"
              disabled={submitting}
            >
              {submitting
                ? "Salvando..."
                : editingPointId !== null
                  ? "Salvar alterações"
                  : "Cadastrar recurso"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="inst-config-carregando">
          Carregando recursos de acessibilidade...
        </p>
      ) : points.length === 0 ? (
        <div className="recursos-vazio">
          <p>
            Nenhum recurso de acessibilidade cadastrado ainda. Clique em{" "}
            <strong>Adicionar recurso</strong> para começar.
          </p>
        </div>
      ) : (
        <ul className="recursos-lista">
          {points.map((point) => {
            const isBusy = busyPointId === point.id;
            const isConfirmingDelete = confirmDeleteId === point.id;

            return (
              <li key={point.id} className="recurso-card">
                <div className="recurso-card-topo">
                  <div className="recurso-badges">
                    <span className="recurso-categoria-pill">
                      <CategoryIcon iconKey={point.category.icon} size={14} />
                      <span>{point.category.name}</span>
                    </span>
                    <span
                      className={`recurso-status-pill ${point.active ? "ativo" : "oculto"}`}
                    >
                      {point.active ? "Publicado" : "Oculto"}
                    </span>
                  </div>

                  <div className="recurso-acoes">
                    {isConfirmingDelete ? (
                      <div className="recurso-confirmar-exclusao">
                        <span>Excluir recurso?</span>
                        <button
                          type="button"
                          className="btn-excluir-sim"
                          disabled={isBusy}
                          onClick={() => handleDelete(point)}
                        >
                          {isBusy ? "Excluindo..." : "Confirmar"}
                        </button>
                        <button
                          type="button"
                          className="btn-excluir-nao"
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
                          className="recurso-btn-acao"
                          disabled={isBusy}
                          onClick={() => handleToggleActive(point)}
                        >
                          {point.active ? (
                            <EyeOff size={14} aria-hidden="true" />
                          ) : (
                            <Eye size={14} aria-hidden="true" />
                          )}
                          <span>{point.active ? "Ocultar" : "Publicar"}</span>
                        </button>
                        <button
                          type="button"
                          className="recurso-btn-acao"
                          disabled={isBusy}
                          onClick={() => openEditForm(point)}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          <span>Editar</span>
                        </button>
                        <button
                          type="button"
                          className="recurso-btn-acao perigo"
                          disabled={isBusy}
                          onClick={() => setConfirmDeleteId(point.id)}
                        >
                          <Trash2 size={14} aria-hidden="true" />
                          <span>Excluir</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <h3>{point.title}</h3>
                <p className="recurso-descricao">{point.description}</p>

                {point.images.length > 0 && (
                  <div className="recurso-galeria-mini">
                    {point.images.map((img) => (
                      <figure key={img.id} className="recurso-thumb">
                        <img src={img.imageUrl} alt={img.altText} />
                      </figure>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

export default AccessibilityResourcesManager;
