import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent as ReactPointerEvent,
  type SubmitEvent,
  type WheelEvent,
} from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Accessibility,
  ArrowLeft,
  DoorOpen,
  Hand,
  ImagePlus,
  Layers,
  MapPin,
  Minus,
  MousePointer2,
  MoveDiagonal2,
  PanelRightClose,
  PanelRightOpen,
  Plus,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  CategoryIcon,
  type AccessibilityCategory,
} from "../components/AccessibilityResourcesManager";
import type {
  CampusBlockItem,
  CampusMapPoint,
  RoomType,
} from "../components/CampusMapEditor";
import "./InstituicaoMapaInterativo.css";

const BLOCK_COLORS = [
  "#0b78c2",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#db2777",
  "#334155",
];

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  room: "Sala de Aula",
  reception: "Recepção / Atendimento",
  hall: "Corredor / Hall",
  restroom: "Sanitário",
  lab: "Laboratório",
  stairs: "Elevador / Escada",
};

const MAX_IMAGES = 5;
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface PendingPhoto {
  file: File;
  previewUrl: string;
  altText: string;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function InstituicaoMapaInterativo() {
  const { token, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [blocks, setBlocks] = useState<CampusBlockItem[]>([]);
  const [points, setPoints] = useState<CampusMapPoint[]>([]);
  const [categories, setCategories] = useState<AccessibilityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [tool, setTool] = useState<"select" | "pan">("select");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [placingPointId, setPlacingPointId] = useState<number | null>(null);

  // Zoom e Pan da malha quadriculada
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [spacePressed, setSpacePressed] = useState(false);

  // Modal de criação de Bloco ou Sala
  const [addingKind, setAddingKind] = useState<"block" | "room" | null>(null);
  const [newName, setNewName] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newColor, setNewColor] = useState(BLOCK_COLORS[0]);
  const [newRoomType, setNewRoomType] = useState<RoomType>("room");
  const [savingItem, setSavingItem] = useState(false);

  // Modal de criação de Recurso de Acessibilidade direto no mapa
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resCategoryId, setResCategoryId] = useState("");
  const [resTitle, setResTitle] = useState("");
  const [resDescription, setResDescription] = useState("");
  const [resActive, setResActive] = useState(true);
  const [resPhotos, setResPhotos] = useState<PendingPhoto[]>([]);
  const [resError, setResError] = useState<string | null>(null);
  const [savingRes, setSavingRes] = useState(false);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);

  const dragRef = useRef<
    | {
        kind: "pan";
        startX: number;
        startY: number;
        origPanX: number;
        origPanY: number;
      }
    | {
        kind: "block" | "room" | "pin";
        mode: "move" | "resize";
        id: number;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
      }
    | null
  >(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [mapRes, catRes] = await Promise.all([
        fetch("/api/institution/campus-map", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/accessibility-categories"),
      ]);
      const mapData = await mapRes.json().catch(() => ({}));
      const catData = await catRes.json().catch(() => []);
      if (!mapRes.ok) {
        throw new Error(mapData.message || "Erro ao carregar mapa interativo.");
      }
      setBlocks(Array.isArray(mapData.blocks) ? mapData.blocks : []);
      setPoints(Array.isArray(mapData.points) ? mapData.points : []);
      const cats = Array.isArray(catData) ? catData : [];
      setCategories(cats);
      if (cats.length > 0 && !resCategoryId) {
        setResCategoryId(String(cats[0].id));
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar mapa interativo."
      );
    } finally {
      setLoading(false);
    }
  }, [token, resCategoryId]);

  useEffect(() => {
    if (isAuthenticated && user?.role === "INSTITUTION") {
      void loadData();
    }
  }, [isAuthenticated, user?.role, loadData]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(
          (e.target as HTMLElement)?.tagName
        )
      ) {
        e.preventDefault();
        setSpacePressed(true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setSpacePressed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  if (!isAuthenticated || user?.role !== "INSTITUTION") {
    return <Navigate to="/login" replace />;
  }

  const activeBlock =
    activeBlockId !== null
      ? blocks.find((b) => b.id === activeBlockId) ?? null
      : null;

  const visiblePins = points.filter((p) => {
    if (p.mapX === null || p.mapY === null) return false;
    return activeBlock ? p.mapBlockId === activeBlock.id : p.mapBlockId === null;
  });

  const isPanMode = tool === "pan" || spacePressed;

  const savePointPosition = async (
    pointId: number,
    mapBlockId: number | null,
    mapX: number | null,
    mapY: number | null
  ) => {
    if (!token) return;
    try {
      const response = await fetch(
        `/api/institution/campus-map/points/${pointId}/position`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mapBlockId, mapX, mapY }),
        }
      );
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao posicionar recurso.");
      }
      setPoints((prev) =>
        prev.map((p) => (p.id === pointId ? { ...p, ...data } : p))
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao posicionar recurso."
      );
    }
  };

  const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => clamp(Number((prev + delta).toFixed(2)), 0.45, 2.2));
  };

  const handleViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isPanMode || e.button === 1) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        kind: "pan",
        startX: e.clientX,
        startY: e.clientY,
        origPanX: pan.x,
        origPanY: pan.y,
      };
      return;
    }

    if (placingPointId !== null && stageRef.current) {
      if ((e.target as HTMLElement).closest("[data-map-interactive='true']")) {
        return;
      }
      const rect = stageRef.current.getBoundingClientRect();
      const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 3, 97);
      const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 5, 95);
      const targetId = placingPointId;
      setPlacingPointId(null);
      setFeedback("Recurso posicionado no mapa.");
      void savePointPosition(
        targetId,
        activeBlock ? activeBlock.id : null,
        x,
        y
      );
    }
  };

  const startItemDrag = (
    e: ReactPointerEvent,
    kind: "block" | "room" | "pin",
    mode: "move" | "resize",
    id: number,
    origX: number,
    origY: number,
    origW = 0,
    origH = 0
  ) => {
    if (isPanMode || e.button === 1) return;
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      kind,
      mode,
      id,
      startX: e.clientX,
      startY: e.clientY,
      origX,
      origY,
      origW,
      origH,
    };
  };

  const handleViewportPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    if (drag.kind === "pan") {
      setPan({
        x: drag.origPanX + (e.clientX - drag.startX),
        y: drag.origPanY + (e.clientY - drag.startY),
      });
      return;
    }

    if (!stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startY) / rect.height) * 100;

    if (drag.kind === "block") {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== drag.id) return b;
          if (drag.mode === "move") {
            return {
              ...b,
              x: clamp(drag.origX + dx, 0, 100 - b.width),
              y: clamp(drag.origY + dy, 0, 100 - b.height),
            };
          }
          return {
            ...b,
            width: clamp(drag.origW + dx, 10, 100 - b.x),
            height: clamp(drag.origH + dy, 10, 100 - b.y),
          };
        })
      );
    } else if (drag.kind === "room" && activeBlock) {
      setBlocks((prev) =>
        prev.map((b) => {
          if (b.id !== activeBlock.id) return b;
          return {
            ...b,
            rooms: b.rooms.map((r) => {
              if (r.id !== drag.id) return r;
              if (drag.mode === "move") {
                return {
                  ...r,
                  x: clamp(drag.origX + dx, 0, 100 - r.width),
                  y: clamp(drag.origY + dy, 0, 100 - r.height),
                };
              }
              return {
                ...r,
                width: clamp(drag.origW + dx, 10, 100 - r.x),
                height: clamp(drag.origH + dy, 10, 100 - r.y),
              };
            }),
          };
        })
      );
    } else if (drag.kind === "pin") {
      setPoints((prev) =>
        prev.map((p) =>
          p.id === drag.id
            ? {
                ...p,
                mapX: clamp(drag.origX + dx, 2, 98),
                mapY: clamp(drag.origY + dy, 4, 96),
              }
            : p
        )
      );
    }
  };

  const handleViewportPointerUp = () => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    if (drag.kind === "pan" || !token) return;

    if (drag.kind === "block") {
      const b = blocks.find((item) => item.id === drag.id);
      if (b) {
        void fetch(`/api/institution/campus-map/blocks/${b.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height,
          }),
        });
      }
    } else if (drag.kind === "room" && activeBlock) {
      const r = activeBlock.rooms.find((item) => item.id === drag.id);
      if (r) {
        void fetch(`/api/institution/campus-map/rooms/${r.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
          }),
        });
      }
    } else if (drag.kind === "pin") {
      const p = points.find((item) => item.id === drag.id);
      if (p && p.mapX !== null && p.mapY !== null) {
        void savePointPosition(p.id, p.mapBlockId, p.mapX, p.mapY);
      }
    }
  };

  // Drag-and-drop de recurso da barra lateral para o mapa
  const handleStageDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const pointIdRaw = e.dataTransfer.getData("text/plain");
    const pointId = Number(pointIdRaw);
    if (!Number.isFinite(pointId) || !stageRef.current) return;

    const rect = stageRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 3, 97);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 5, 95);
    setFeedback("Recurso posicionado no mapa.");
    void savePointPosition(
      pointId,
      activeBlock ? activeBlock.id : null,
      x,
      y
    );
  };

  const handleCreateStructure = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim() || !token) return;
    setSavingItem(true);
    setError(null);

    try {
      if (addingKind === "block") {
        const offset = (blocks.length % 4) * 5;
        const response = await fetch("/api/institution/campus-map/blocks", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name: newName.trim(),
            subtitle: newSubtitle.trim() || null,
            x: 10 + offset,
            y: 12 + offset,
            width: 24,
            height: 24,
            color: newColor,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Erro ao criar bloco.");
        setBlocks((prev) => [...prev, data]);
        setFeedback(`Bloco "${data.name}" criado. Arraste para posicionar.`);
      } else if (addingKind === "room" && activeBlock) {
        const offset = (activeBlock.rooms.length % 4) * 5;
        const response = await fetch(
          `/api/institution/campus-map/blocks/${activeBlock.id}/rooms`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              name: newName.trim(),
              roomType: newRoomType,
              x: 10 + offset,
              y: 12 + offset,
              width: 26,
              height: 24,
            }),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.message || "Erro ao criar sala.");
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === activeBlock.id ? { ...b, rooms: [...b.rooms, data] } : b
          )
        );
        setFeedback(`Ambiente "${data.name}" adicionado ao bloco.`);
      }
      setAddingKind(null);
      setNewName("");
      setNewSubtitle("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar item.");
    } finally {
      setSavingItem(false);
    }
  };

  const handleDeleteBlock = async (block: CampusBlockItem) => {
    if (!token) return;
    try {
      const res = await fetch(
        `/api/institution/campus-map/blocks/${block.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Erro ao excluir bloco.");
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      setPoints((prev) =>
        prev.map((p) =>
          p.mapBlockId === block.id
            ? { ...p, mapBlockId: null, mapX: null, mapY: null }
            : p
        )
      );
      if (activeBlockId === block.id) setActiveBlockId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir bloco.");
    }
  };

  const handleDeleteRoom = async (room: CampusBlockItem["rooms"][number]) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/institution/campus-map/rooms/${room.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao excluir sala.");
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === room.blockId
            ? { ...b, rooms: b.rooms.filter((r) => r.id !== room.id) }
            : b
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir sala.");
    }
  };

  // Criação de Recurso de Acessibilidade direto na tela do mapa
  const handleResPhotosSelect = (e: ChangeEvent<HTMLInputElement>) => {
    setResError(null);
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    const slots = MAX_IMAGES - resPhotos.length;
    if (slots <= 0) {
      setResError(`Máximo de ${MAX_IMAGES} fotos.`);
      return;
    }
    const next: PendingPhoto[] = [];
    for (const file of files.slice(0, slots)) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setResError("Use JPEG, PNG ou WebP.");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setResError("Cada imagem deve ter no máximo 5 MB.");
        continue;
      }
      next.push({
        file,
        previewUrl: URL.createObjectURL(file),
        altText: "",
      });
    }
    setResPhotos((prev) => [...prev, ...next]);
  };

  const resetResourceModal = () => {
    resPhotos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setResTitle("");
    setResDescription("");
    setResActive(true);
    setResPhotos([]);
    setResError(null);
    setResourceModalOpen(false);
  };

  const handleCreateResourceSubmit = async (
    e: SubmitEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    if (!token) return;
    setResError(null);

    if (!resCategoryId) {
      setResError("Selecione uma categoria.");
      return;
    }
    if (resTitle.trim().length < 3) {
      setResError("O título precisa de pelo menos 3 caracteres.");
      return;
    }
    if (resDescription.trim().length < 20) {
      setResError("A descrição precisa de pelo menos 20 caracteres.");
      return;
    }
    if (resPhotos.some((p) => p.altText.trim().length === 0)) {
      setResError("Informe o texto alternativo de todas as fotos.");
      return;
    }

    setSavingRes(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", resCategoryId);
      formData.append("title", resTitle.trim());
      formData.append("description", resDescription.trim());
      formData.append("active", String(resActive));
      formData.append(
        "altTexts",
        JSON.stringify(resPhotos.map((p) => p.altText.trim()))
      );
      for (const p of resPhotos) {
        formData.append("images", p.file);
      }

      const response = await fetch("/api/institution/points", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const created = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(created.message || "Erro ao criar recurso.");
      }

      const newPoint: CampusMapPoint = {
        ...created,
        mapBlockId: null,
        mapX: null,
        mapY: null,
      };
      setPoints((prev) => [newPoint, ...prev]);
      resetResourceModal();
      setPlacingPointId(created.id);
      setSidebarOpen(true);
      setFeedback(
        `Recurso "${created.title}" criado! Clique no mapa para posicioná-lo ou arraste da barra lateral.`
      );
    } catch (err) {
      setResError(err instanceof Error ? err.message : "Erro ao criar recurso.");
    } finally {
      setSavingRes(false);
    }
  };

  const placingPoint =
    placingPointId !== null
      ? points.find((p) => p.id === placingPointId) ?? null
      : null;

  return (
    <div className="mapa-ws">
      {/* Barra superior estilo Lucidchart */}
      <header className="mapa-ws-topbar">
        <div className="mapa-ws-topbar-left">
          <button
            type="button"
            className="mapa-ws-back-btn"
            onClick={() => navigate("/instituicao/configuracoes")}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Configurações</span>
          </button>

          <div className="mapa-ws-breadcrumb">
            <button
              type="button"
              className={`campus-crumb-btn ${!activeBlock ? "ativo" : ""}`}
              onClick={() => {
                setActiveBlockId(null);
                setAddingKind(null);
              }}
            >
              <Layers size={14} aria-hidden="true" />
              <span>Campus</span>
            </button>
            {activeBlock && (
              <>
                <span aria-hidden="true">/</span>
                <span className="campus-crumb-atual">{activeBlock.name}</span>
              </>
            )}
          </div>
        </div>

        <div className="mapa-ws-topbar-right">
          {feedback && <span className="mapa-ws-toast">{feedback}</span>}
          {error && <span className="mapa-ws-toast erro">{error}</span>}
          <button
            type="button"
            className="mapa-ws-primary-btn"
            onClick={() => setResourceModalOpen(true)}
          >
            <Plus size={15} aria-hidden="true" />
            <span>Novo recurso</span>
          </button>
          <button
            type="button"
            className="mapa-ws-icon-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title={sidebarOpen ? "Recolher painel" : "Abrir painel de recursos"}
          >
            {sidebarOpen ? (
              <PanelRightClose size={18} aria-hidden="true" />
            ) : (
              <PanelRightOpen size={18} aria-hidden="true" />
            )}
          </button>
        </div>
      </header>

      {/* Área principal em tela cheia com malha quadriculada */}
      <div className="mapa-ws-body">
        {/* Barra de ferramentas esquerda flutuante */}
        <aside className="mapa-ws-toolbar" aria-label="Ferramentas do mapa">
          <button
            type="button"
            className={`mapa-tool-btn ${tool === "select" && !spacePressed ? "ativo" : ""}`}
            onClick={() => setTool("select")}
            title="Selecionar e arrastar elementos"
          >
            <MousePointer2 size={18} aria-hidden="true" />
            <span>Mover</span>
          </button>
          <button
            type="button"
            className={`mapa-tool-btn ${isPanMode ? "ativo" : ""}`}
            onClick={() => setTool((t) => (t === "pan" ? "select" : "pan"))}
            title="Arrastar a malha (ou segure Espaço)"
          >
            <Hand size={18} aria-hidden="true" />
            <span>Tela</span>
          </button>

          <div className="mapa-tool-sep" />

          <button
            type="button"
            className="mapa-tool-btn destaque"
            onClick={() => setAddingKind(activeBlock ? "room" : "block")}
            title={
              activeBlock
                ? "Adicionar sala ou ambiente"
                : "Adicionar bloco no campus"
            }
          >
            <Plus size={18} aria-hidden="true" />
            <span>{activeBlock ? "Sala" : "Bloco"}</span>
          </button>

          <button
            type="button"
            className="mapa-tool-btn"
            onClick={() => setResourceModalOpen(true)}
            title="Criar novo recurso de acessibilidade"
          >
            <Accessibility size={18} aria-hidden="true" />
            <span>Recurso</span>
          </button>
        </aside>

        {/* Banner de posicionamento */}
        {placingPoint && (
          <div className="mapa-ws-placing-pill" role="status">
            <span>
              Clique no mapa para posicionar:{" "}
              <strong>{placingPoint.title}</strong>
            </span>
            <button
              type="button"
              onClick={() => setPlacingPointId(null)}
              aria-label="Cancelar posicionamento"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Viewport com pan e zoom */}
        <div
          ref={viewportRef}
          className={`mapa-ws-viewport ${isPanMode ? "modo-pan" : ""} ${placingPoint ? "modo-posicionar" : ""}`}
          style={{
            backgroundPosition: `${pan.x}px ${pan.y}px`,
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          }}
          onWheel={handleWheel}
          onPointerDown={handleViewportPointerDown}
          onPointerMove={handleViewportPointerMove}
          onPointerUp={handleViewportPointerUp}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleStageDrop}
        >
          {loading ? (
            <div className="mapa-ws-loading">Carregando mapa interativo...</div>
          ) : (
            <div
              ref={stageRef}
              className="mapa-ws-stage"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              }}
            >
              {!activeBlock
                ? blocks.map((block) => {
                    const pinsCount = points.filter(
                      (p) => p.mapBlockId === block.id
                    ).length;
                    return (
                      <div
                        key={block.id}
                        className="campus-block-box"
                        style={{
                          left: `${block.x}%`,
                          top: `${block.y}%`,
                          width: `${block.width}%`,
                          height: `${block.height}%`,
                          borderColor: block.color,
                          backgroundColor: `${block.color}16`,
                        }}
                        onPointerDown={(e) =>
                          startItemDrag(
                            e,
                            "block",
                            "move",
                            block.id,
                            block.x,
                            block.y
                          )
                        }
                      >
                        <div className="campus-box-head">
                          <strong style={{ color: block.color }}>
                            {block.name}
                          </strong>
                          <div
                            className="campus-box-btns"
                            data-map-interactive="true"
                            onPointerDown={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              title="Abrir planta interna"
                              onClick={() => {
                                setActiveBlockId(block.id);
                                setPan({ x: 0, y: 0 });
                                setZoom(1);
                              }}
                            >
                              <DoorOpen size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Excluir bloco"
                              onClick={() => handleDeleteBlock(block)}
                            >
                              <Trash2 size={13} aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                        {block.subtitle && (
                          <span className="campus-box-sub">
                            {block.subtitle}
                          </span>
                        )}
                        <span className="campus-box-meta">
                          {block.rooms.length}{" "}
                          {block.rooms.length === 1 ? "sala" : "salas"} ·{" "}
                          {pinsCount}{" "}
                          {pinsCount === 1 ? "recurso" : "recursos"}
                        </span>
                        <div
                          className="campus-resize-handle"
                          onPointerDown={(e) =>
                            startItemDrag(
                              e,
                              "block",
                              "resize",
                              block.id,
                              block.x,
                              block.y,
                              block.width,
                              block.height
                            )
                          }
                        >
                          <MoveDiagonal2 size={12} aria-hidden="true" />
                        </div>
                      </div>
                    );
                  })
                : activeBlock.rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`campus-room-box tipo-${room.roomType}`}
                      style={{
                        left: `${room.x}%`,
                        top: `${room.y}%`,
                        width: `${room.width}%`,
                        height: `${room.height}%`,
                      }}
                      onPointerDown={(e) =>
                        startItemDrag(
                          e,
                          "room",
                          "move",
                          room.id,
                          room.x,
                          room.y
                        )
                      }
                    >
                      <div className="campus-box-head">
                        <strong>{room.name}</strong>
                        <div
                          className="campus-box-btns"
                          data-map-interactive="true"
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            title="Excluir sala"
                            onClick={() => handleDeleteRoom(room)}
                          >
                            <Trash2 size={13} aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                      <span className="campus-box-sub">
                        {ROOM_TYPE_LABELS[room.roomType]}
                      </span>
                      <div
                        className="campus-resize-handle"
                        onPointerDown={(e) =>
                          startItemDrag(
                            e,
                            "room",
                            "resize",
                            room.id,
                            room.x,
                            room.y,
                            room.width,
                            room.height
                          )
                        }
                      >
                        <MoveDiagonal2 size={12} aria-hidden="true" />
                      </div>
                    </div>
                  ))}

              {visiblePins.map((pin) => (
                <div
                  key={pin.id}
                  data-map-interactive="true"
                  className="campus-pin-marker"
                  style={{
                    left: `${pin.mapX}%`,
                    top: `${pin.mapY}%`,
                  }}
                  onPointerDown={(e) =>
                    startItemDrag(
                      e,
                      "pin",
                      "move",
                      pin.id,
                      pin.mapX ?? 50,
                      pin.mapY ?? 50
                    )
                  }
                  title={`${pin.title} (arraste para reposicionar)`}
                >
                  <CategoryIcon iconKey={pin.category.icon} size={13} />
                  <span>{pin.category.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Barra de zoom no canto inferior */}
        <div
          className="mapa-ws-zoom-bar"
          style={{ right: sidebarOpen ? 360 : 20 }}
        >
          <button
            type="button"
            onClick={() =>
              setZoom((z) => clamp(Number((z - 0.15).toFixed(2)), 0.45, 2.2))
            }
            aria-label="Diminuir zoom"
          >
            <Minus size={15} aria-hidden="true" />
          </button>
          <span className="mapa-ws-zoom-val">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            onClick={() =>
              setZoom((z) => clamp(Number((z + 0.15).toFixed(2)), 0.45, 2.2))
            }
            aria-label="Aumentar zoom"
          >
            <Plus size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Centralizar mapa"
            title="Resetar zoom e posição"
          >
            <RotateCcw size={14} aria-hidden="true" />
          </button>
        </div>

        {/* Painel lateral direito de recursos */}
        {sidebarOpen && (
          <aside className="mapa-ws-sidebar">
            <div className="mapa-ws-sidebar-head">
              <h3>Recursos de Acessibilidade</h3>
              <button
                type="button"
                className="recurso-btn-acao"
                onClick={() => setResourceModalOpen(true)}
              >
                <Plus size={14} aria-hidden="true" />
                <span>Criar</span>
              </button>
            </div>
            <p className="mapa-ws-sidebar-hint">
              Arraste um recurso para a malha ou clique em{" "}
              <strong>Posicionar</strong>.
            </p>

            {points.length === 0 ? (
              <div className="campus-sidebar-vazio">
                Nenhum recurso cadastrado ainda. Clique em <strong>Criar</strong>{" "}
                acima para adicionar com foto e descrição.
              </div>
            ) : (
              <ul className="mapa-ws-sidebar-list">
                {points.map((point) => {
                  const placedBlock =
                    point.mapBlockId !== null
                      ? blocks.find((b) => b.id === point.mapBlockId)
                      : null;
                  const isPlaced = point.mapX !== null && point.mapY !== null;
                  const isPlacing = placingPointId === point.id;

                  return (
                    <li
                      key={point.id}
                      className="campus-sidebar-item"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", String(point.id));
                      }}
                    >
                      <div className="campus-sidebar-item-info">
                        <span className="recurso-categoria-pill">
                          <CategoryIcon
                            iconKey={point.category.icon}
                            size={12}
                          />
                          <span>{point.category.name}</span>
                        </span>
                        <strong>{point.title}</strong>
                        <span className="campus-sidebar-local">
                          {isPlaced
                            ? placedBlock
                              ? `Em: ${placedBlock.name}`
                              : "No Campus"
                            : "Não posicionado"}
                        </span>
                      </div>

                      <div className="campus-sidebar-item-acoes">
                        <button
                          type="button"
                          className={`recurso-btn-acao ${isPlacing ? "ativo" : ""}`}
                          onClick={() =>
                            setPlacingPointId(isPlacing ? null : point.id)
                          }
                        >
                          <MapPin size={13} aria-hidden="true" />
                          <span>
                            {isPlacing ? "Clique na tela" : "Posicionar"}
                          </span>
                        </button>
                        {isPlaced && (
                          <button
                            type="button"
                            className="recurso-btn-acao perigo"
                            onClick={() =>
                              void savePointPosition(point.id, null, null, null)
                            }
                          >
                            Remover
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        )}
      </div>

      {/* Modal para criar Bloco ou Sala */}
      {addingKind && (
        <div
          className="mapa-ws-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={() => setAddingKind(null)}
        >
          <form
            className="mapa-ws-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateStructure}
          >
            <div className="recurso-form-header">
              <h3>
                {addingKind === "block"
                  ? "Novo bloco do campus"
                  : `Nova sala em ${activeBlock?.name}`}
              </h3>
              <button
                type="button"
                className="recurso-form-fechar"
                onClick={() => setAddingKind(null)}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            <div className="campo-grupo">
              <label htmlFor="ws-struct-name">Nome *</label>
              <input
                id="ws-struct-name"
                type="text"
                placeholder={
                  addingKind === "block"
                    ? "Ex.: Bloco A — Ensino"
                    : "Ex.: Recepção ou Banheiro Térreo"
                }
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
              />
            </div>

            {addingKind === "block" ? (
              <>
                <div className="campo-grupo">
                  <label htmlFor="ws-block-sub">Subtítulo (opcional)</label>
                  <input
                    id="ws-block-sub"
                    type="text"
                    placeholder="Ex.: Salas de aula e coordenação"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                  />
                </div>
                <div className="campus-cores">
                  <span>Cor:</span>
                  {BLOCK_COLORS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      className={`campus-cor-btn ${newColor === hex ? "ativo" : ""}`}
                      style={{ backgroundColor: hex }}
                      onClick={() => setNewColor(hex)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="campo-grupo">
                <label htmlFor="ws-room-type">Tipo de ambiente</label>
                <select
                  id="ws-room-type"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                >
                  {Object.entries(ROOM_TYPE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="recurso-form-acoes">
              <button
                type="button"
                className="recurso-btn-cancelar"
                onClick={() => setAddingKind(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inst-config-salvar"
                disabled={savingItem}
              >
                {savingItem ? "Adicionando..." : "Adicionar no mapa"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para criar Recurso de Acessibilidade com Fotos direto no mapa */}
      {resourceModalOpen && (
        <div
          className="mapa-ws-modal-backdrop"
          role="dialog"
          aria-modal="true"
          onClick={resetResourceModal}
        >
          <form
            className="mapa-ws-modal mapa-ws-modal--largo"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleCreateResourceSubmit}
          >
            <div className="recurso-form-header">
              <h3>Novo recurso de acessibilidade</h3>
              <button
                type="button"
                className="recurso-form-fechar"
                onClick={resetResourceModal}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>

            {resError && (
              <p className="inst-config-erro" role="alert">
                {resError}
              </p>
            )}

            <div className="campos-duplos">
              <div className="campo-grupo">
                <label htmlFor="ws-res-cat">Categoria *</label>
                <select
                  id="ws-res-cat"
                  value={resCategoryId}
                  onChange={(e) => setResCategoryId(e.target.value)}
                  required
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo-grupo">
                <label htmlFor="ws-res-title">Título *</label>
                <input
                  id="ws-res-title"
                  type="text"
                  maxLength={120}
                  placeholder="Ex.: Rampa na entrada principal"
                  value={resTitle}
                  onChange={(e) => setResTitle(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="campo-grupo">
              <label htmlFor="ws-res-desc">
                Descrição * (mínimo 20 caracteres)
              </label>
              <textarea
                id="ws-res-desc"
                rows={3}
                maxLength={2000}
                placeholder="Descreva localização, horários ou detalhes de acesso..."
                value={resDescription}
                onChange={(e) => setResDescription(e.target.value)}
                required
              />
            </div>

            <div className="recurso-fotos-bloco">
              <div className="recurso-fotos-topo">
                <span className="upload-titulo">
                  Fotos do recurso (opcional — até {MAX_IMAGES})
                </span>
                {resPhotos.length < MAX_IMAGES && (
                  <label htmlFor="ws-res-photos" className="btn-upload-arquivo">
                    <ImagePlus size={15} aria-hidden="true" />
                    <span>Adicionar fotos</span>
                  </label>
                )}
                <input
                  id="ws-res-photos"
                  className="sr-only-input"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleResPhotosSelect}
                />
              </div>

              {resPhotos.length > 0 && (
                <div className="recurso-fotos-lista">
                  {resPhotos.map((photo, idx) => (
                    <div key={photo.previewUrl} className="recurso-foto-item">
                      <img src={photo.previewUrl} alt="Prévia" />
                      <div className="recurso-foto-campos">
                        <label htmlFor={`ws-alt-${idx}`}>
                          Texto alternativo *
                        </label>
                        <input
                          id={`ws-alt-${idx}`}
                          type="text"
                          value={photo.altText}
                          onChange={(e) =>
                            setResPhotos((prev) =>
                              prev.map((p, i) =>
                                i === idx
                                  ? { ...p, altText: e.target.value }
                                  : p
                              )
                            )
                          }
                          placeholder="Descreva o que aparece na foto"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-remover-img"
                        onClick={() =>
                          setResPhotos((prev) => {
                            URL.revokeObjectURL(prev[idx].previewUrl);
                            return prev.filter((_, i) => i !== idx);
                          })
                        }
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
                checked={resActive}
                onChange={(e) => setResActive(e.target.checked)}
              />
              <span>Publicar na página pública</span>
            </label>

            <div className="recurso-form-acoes">
              <button
                type="button"
                className="recurso-btn-cancelar"
                onClick={resetResourceModal}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inst-config-salvar"
                disabled={savingRes}
              >
                {savingRes ? "Salvando..." : "Criar e posicionar no mapa"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default InstituicaoMapaInterativo;
