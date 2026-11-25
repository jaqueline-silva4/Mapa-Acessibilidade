import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type SubmitEvent,
} from "react";
import {
  ArrowLeft,
  DoorOpen,
  Layers,
  MapPin,
  MoveDiagonal2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  CategoryIcon,
  type AccessibilityPointItem,
} from "./AccessibilityResourcesManager";
import "./CampusMapEditor.css";

export type RoomType =
  | "room"
  | "hall"
  | "restroom"
  | "reception"
  | "lab"
  | "stairs";

export interface CampusRoomItem {
  id: number;
  blockId: number;
  name: string;
  roomType: RoomType;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CampusBlockItem {
  id: number;
  name: string;
  subtitle: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  rooms: CampusRoomItem[];
}

export interface CampusMapPoint extends AccessibilityPointItem {
  mapBlockId: number | null;
  mapX: number | null;
  mapY: number | null;
  underReview?: boolean;
}

interface CampusMapEditorProps {
  token: string;
}

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

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function CampusMapEditor({ token }: CampusMapEditorProps) {
  const [blocks, setBlocks] = useState<CampusBlockItem[]>([]);
  const [points, setPoints] = useState<CampusMapPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [placingPointId, setPlacingPointId] = useState<number | null>(null);

  // Formulário inline para criar bloco ou sala
  const [addingKind, setAddingKind] = useState<"block" | "room" | null>(null);
  const [newName, setNewName] = useState("");
  const [newSubtitle, setNewSubtitle] = useState("");
  const [newColor, setNewColor] = useState(BLOCK_COLORS[0]);
  const [newRoomType, setNewRoomType] = useState<RoomType>("room");
  const [savingItem, setSavingItem] = useState(false);

  const canvasRef = useRef<HTMLDivElement | null>(null);

  const dragStateRef = useRef<{
    kind: "block" | "room" | "pin";
    mode: "move" | "resize";
    id: number;
    startClientX: number;
    startClientY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const loadMap = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/institution/campus-map", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Erro ao carregar mapa interativo.");
      }
      setBlocks(Array.isArray(data.blocks) ? data.blocks : []);
      setPoints(Array.isArray(data.points) ? data.points : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar mapa interativo."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadMap();
  }, [loadMap]);

  const activeBlock =
    activeBlockId !== null
      ? blocks.find((b) => b.id === activeBlockId) ?? null
      : null;

  const visiblePins = points.filter((p) => {
    if (p.mapX === null || p.mapY === null) return false;
    return activeBlock ? p.mapBlockId === activeBlock.id : p.mapBlockId === null;
  });

  const handleCreateItem = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSavingItem(true);
    setError(null);
    setFeedback(null);

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
            width: 26,
            height: 24,
            color: newColor,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Erro ao criar bloco.");
        }
        setBlocks((prev) => [...prev, data]);
        setFeedback(`Bloco "${data.name}" adicionado ao campus.`);
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
              width: 28,
              height: 24,
            }),
          }
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || "Erro ao criar sala.");
        }
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
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/institution/campus-map/blocks/${block.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao remover bloco.");
      }
      setBlocks((prev) => prev.filter((b) => b.id !== block.id));
      setPoints((prev) =>
        prev.map((p) =>
          p.mapBlockId === block.id
            ? { ...p, mapBlockId: null, mapX: null, mapY: null }
            : p
        )
      );
      if (activeBlockId === block.id) setActiveBlockId(null);
      setFeedback(`Bloco "${block.name}" removido.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover bloco.");
    }
  };

  const handleDeleteRoom = async (room: CampusRoomItem) => {
    setError(null);
    setFeedback(null);
    try {
      const response = await fetch(
        `/api/institution/campus-map/rooms/${room.id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) {
        throw new Error("Erro ao remover ambiente.");
      }
      setBlocks((prev) =>
        prev.map((b) =>
          b.id === room.blockId
            ? { ...b, rooms: b.rooms.filter((r) => r.id !== room.id) }
            : b
        )
      );
      setFeedback(`Ambiente "${room.name}" removido.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao remover ambiente."
      );
    }
  };

  const savePointPosition = async (
    pointId: number,
    mapBlockId: number | null,
    mapX: number | null,
    mapY: number | null
  ) => {
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

  const handleCanvasClick = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (placingPointId === null || !canvasRef.current) return;
    if ((e.target as HTMLElement).closest("[data-map-interactive='true']")) {
      return;
    }

    const rect = canvasRef.current.getBoundingClientRect();
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 3, 97);
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 5, 95);

    const targetId = placingPointId;
    const targetBlockId = activeBlock ? activeBlock.id : null;
    setPlacingPointId(null);
    setFeedback("Posição do recurso salva no mapa.");
    void savePointPosition(targetId, targetBlockId, x, y);
  };

  const startDrag = (
    e: ReactPointerEvent,
    kind: "block" | "room" | "pin",
    mode: "move" | "resize",
    id: number,
    origX: number,
    origY: number,
    origW = 0,
    origH = 0
  ) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragStateRef.current = {
      kind,
      mode,
      id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      origX,
      origY,
      origW,
      origH,
    };
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.startClientX) / rect.width) * 100;
    const dy = ((e.clientY - drag.startClientY) / rect.height) * 100;

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
            width: clamp(drag.origW + dx, 12, 100 - b.x),
            height: clamp(drag.origH + dy, 12, 100 - b.y),
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
                width: clamp(drag.origW + dx, 12, 100 - r.x),
                height: clamp(drag.origH + dy, 12, 100 - r.y),
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

  const handlePointerUp = () => {
    const drag = dragStateRef.current;
    if (!drag) return;
    dragStateRef.current = null;

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

  const placingPoint =
    placingPointId !== null
      ? points.find((p) => p.id === placingPointId) ?? null
      : null;

  return (
    <section className="campus-editor" aria-labelledby="campus-editor-titulo">
      <div className="campus-editor-topo">
        <div>
          <div className="campus-breadcrumb">
            <button
              type="button"
              className={`campus-crumb-btn ${!activeBlock ? "ativo" : ""}`}
              onClick={() => {
                setActiveBlockId(null);
                setAddingKind(null);
                setPlacingPointId(null);
              }}
            >
              <Layers size={14} aria-hidden="true" />
              <span>Visão do Campus</span>
            </button>
            {activeBlock && (
              <>
                <span aria-hidden="true">/</span>
                <span className="campus-crumb-atual">{activeBlock.name}</span>
              </>
            )}
          </div>
          <h2 id="campus-editor-titulo">
            {activeBlock
              ? `Planta interna — ${activeBlock.name}`
              : "Mapa Interativo do Campus"}
          </h2>
          <p>
            {activeBlock
              ? "Desenhe salas, recepção, banheiros ou corredores e posicione os recursos de acessibilidade dentro deste bloco."
              : "Desenhe os blocos do campus (arraste para mover ou redimensionar), entre em cada bloco para montar a planta interna e posicione os recursos."}
          </p>
        </div>

        <div className="campus-editor-acoes">
          {activeBlock && (
            <button
              type="button"
              className="campus-btn-voltar"
              onClick={() => {
                setActiveBlockId(null);
                setAddingKind(null);
              }}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Voltar ao campus</span>
            </button>
          )}
          <button
            type="button"
            className="recursos-btn-novo"
            onClick={() =>
              setAddingKind(activeBlock ? "room" : "block")
            }
          >
            <Plus size={16} aria-hidden="true" />
            <span>{activeBlock ? "Nova sala / área" : "Novo bloco"}</span>
          </button>
        </div>
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

      {addingKind && (
        <form className="campus-mini-form" onSubmit={handleCreateItem}>
          <div className="campus-mini-form-topo">
            <strong>
              {addingKind === "block"
                ? "Adicionar bloco ao campus"
                : `Adicionar sala/área em ${activeBlock?.name}`}
            </strong>
            <button
              type="button"
              className="recurso-form-fechar"
              aria-label="Cancelar criação"
              onClick={() => setAddingKind(null)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="campos-duplos">
            <div className="campo-grupo">
              <label htmlFor="map-item-name">Nome *</label>
              <input
                id="map-item-name"
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
              <div className="campo-grupo">
                <label htmlFor="map-block-sub">Subtítulo (opcional)</label>
                <input
                  id="map-block-sub"
                  type="text"
                  placeholder="Ex.: Salas de aula e coordenação"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                />
              </div>
            ) : (
              <div className="campo-grupo">
                <label htmlFor="map-room-type">Tipo de ambiente</label>
                <select
                  id="map-room-type"
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value as RoomType)}
                >
                  {Object.entries(ROOM_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {addingKind === "block" && (
            <div className="campus-cores">
              <span>Cor do bloco:</span>
              {BLOCK_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  className={`campus-cor-btn ${newColor === hex ? "ativo" : ""}`}
                  style={{ backgroundColor: hex }}
                  aria-label={`Selecionar cor ${hex}`}
                  onClick={() => setNewColor(hex)}
                />
              ))}
            </div>
          )}

          <div className="recurso-form-acoes">
            <button
              type="submit"
              className="inst-config-salvar"
              disabled={savingItem}
            >
              {savingItem ? "Adicionando..." : "Adicionar no mapa"}
            </button>
          </div>
        </form>
      )}

      {placingPoint && (
        <div className="campus-placing-banner" role="status">
          <span>
            Clique em qualquer local da planta para posicionar:{" "}
            <strong>{placingPoint.title}</strong>
          </span>
          <button
            type="button"
            className="recurso-btn-acao"
            onClick={() => setPlacingPointId(null)}
          >
            Cancelar
          </button>
        </div>
      )}

      {loading ? (
        <p className="inst-config-carregando">Carregando mapa interativo...</p>
      ) : (
        <div className="campus-editor-grid">
          <div className="campus-canvas-col">
            <div
              ref={canvasRef}
              className={`campus-canvas ${placingPoint ? "modo-posicionar" : ""}`}
              onPointerDown={handleCanvasClick}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
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
                          backgroundColor: `${block.color}14`,
                        }}
                        onPointerDown={(e) =>
                          startDrag(
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
                              aria-label={`Abrir planta de ${block.name}`}
                              onClick={() => {
                                setActiveBlockId(block.id);
                                setAddingKind(null);
                              }}
                            >
                              <DoorOpen size={13} aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Excluir bloco"
                              aria-label={`Excluir ${block.name}`}
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
                            startDrag(
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
                          title="Arraste para redimensionar"
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
                        startDrag(e, "room", "move", room.id, room.x, room.y)
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
                            aria-label={`Excluir ${room.name}`}
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
                          startDrag(
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
                        title="Arraste para redimensionar"
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
                    startDrag(
                      e,
                      "pin",
                      "move",
                      pin.id,
                      pin.mapX ?? 50,
                      pin.mapY ?? 50
                    )
                  }
                  title={`${pin.title} (arraste para mover)`}
                >
                  <CategoryIcon iconKey={pin.category.icon} size={13} />
                  <span>{pin.category.name}</span>
                </div>
              ))}
            </div>
            <p className="campus-canvas-dica">
              Dica: arraste blocos ou salas para posicionar, use o canto
              inferior direito para redimensionar e clique no ícone da porta
              para editar a planta interna de um bloco.
            </p>
          </div>

          <aside className="campus-sidebar-recursos">
            <h3>Recursos de Acessibilidade</h3>
            {points.length === 0 ? (
              <p className="campus-sidebar-vazio">
                Cadastre recursos na aba{" "}
                <strong>Recursos de Acessibilidade</strong> para posicioná-los
                aqui no mapa.
              </p>
            ) : (
              <ul className="campus-sidebar-lista">
                {points.map((point) => {
                  const placedBlock =
                    point.mapBlockId !== null
                      ? blocks.find((b) => b.id === point.mapBlockId)
                      : null;
                  const isPlaced = point.mapX !== null && point.mapY !== null;
                  const isPlacing = placingPointId === point.id;

                  return (
                    <li key={point.id} className="campus-sidebar-item">
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
                              ? `Posicionado em: ${placedBlock.name}`
                              : "Posicionado no Campus"
                            : "Ainda não posicionado"}
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
                            {isPlacing
                              ? "Clique no mapa..."
                              : isPlaced
                                ? "Reposicionar aqui"
                                : "Posicionar aqui"}
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
                            Remover do mapa
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        </div>
      )}
    </section>
  );
}

export default CampusMapEditor;
