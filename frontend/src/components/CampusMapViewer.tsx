import { useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, DoorOpen, Layers, MapPin } from "lucide-react";
import {
  CategoryIcon,
  type AccessibilityPointImage,
} from "./AccessibilityResourcesManager";
import type {
  CampusBlockItem,
  CampusMapPoint,
  RoomType,
} from "./CampusMapEditor";
import "./CampusMapViewer.css";

interface CampusMapViewerProps {
  blocks: CampusBlockItem[];
  points: CampusMapPoint[];
  onOpenImage: (image: AccessibilityPointImage) => void;
}

const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  room: "Sala de Aula",
  reception: "Recepção",
  hall: "Corredor",
  restroom: "Sanitário",
  lab: "Laboratório",
  stairs: "Elevador / Escada",
};

function CampusMapViewer({
  blocks,
  points,
  onOpenImage,
}: CampusMapViewerProps) {
  const [activeBlockId, setActiveBlockId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [selectedPointId, setSelectedPointId] = useState<number | null>(null);

  const activeBlock =
    activeBlockId !== null
      ? blocks.find((b) => b.id === activeBlockId) ?? null
      : null;

  const categories = useMemo(() => {
    const map = new Map<number, { id: number; name: string; icon: string }>();
    for (const p of points) {
      if (!map.has(p.category.id)) {
        map.set(p.category.id, p.category);
      }
    }
    return Array.from(map.values());
  }, [points]);

  const filteredPoints = useMemo(() => {
    return points.filter((p) => {
      if (selectedCategoryId !== null && p.categoryId !== selectedCategoryId) {
        return false;
      }
      return true;
    });
  }, [points, selectedCategoryId]);

  const visiblePins = useMemo(() => {
    return filteredPoints.filter((p) =>
      activeBlock ? p.mapBlockId === activeBlock.id : p.mapBlockId === null
    );
  }, [filteredPoints, activeBlock]);

  const activeSelectedPoint =
    visiblePins.find((p) => p.id === selectedPointId) ?? visiblePins[0] ?? null;

  return (
    <article className="inst-publica-box campus-viewer-box">
      <div className="campus-viewer-topo">
        <div>
          <div className="campus-breadcrumb">
            <button
              type="button"
              className={`campus-crumb-btn ${!activeBlock ? "ativo" : ""}`}
              onClick={() => {
                setActiveBlockId(null);
                setSelectedPointId(null);
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
          <h2>
            {activeBlock
              ? `Planta interna — ${activeBlock.name}`
              : "Mapa Interativo da Instituição"}
          </h2>
        </div>

        {activeBlock && (
          <button
            type="button"
            className="campus-btn-voltar"
            onClick={() => {
              setActiveBlockId(null);
              setSelectedPointId(null);
            }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            <span>Voltar ao campus</span>
          </button>
        )}
      </div>

      {categories.length > 0 && (
        <div
          className="recursos-filtros-chips"
          role="group"
          aria-label="Filtrar recursos no mapa interativo"
        >
          <button
            type="button"
            className={`recurso-chip ${selectedCategoryId === null ? "ativo" : ""}`}
            onClick={() => setSelectedCategoryId(null)}
          >
            Todos ({points.length})
          </button>
          {categories.map((cat) => (
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

      <div className="campus-viewer-grid">
        <div className="campus-viewer-canvas-col">
          <div className="campus-viewer-canvas">
            {!activeBlock
              ? blocks.map((block) => {
                  const insideCount = filteredPoints.filter(
                    (p) => p.mapBlockId === block.id
                  ).length;

                  return (
                    <button
                      key={block.id}
                      type="button"
                      className="campus-viewer-block"
                      style={{
                        left: `${block.x}%`,
                        top: `${block.y}%`,
                        width: `${block.width}%`,
                        height: `${block.height}%`,
                        borderColor: block.color,
                        backgroundColor: `${block.color}16`,
                      }}
                      onClick={() => {
                        setActiveBlockId(block.id);
                        setSelectedPointId(null);
                      }}
                    >
                      <span
                        className="campus-viewer-block-title"
                        style={{ color: block.color }}
                      >
                        <DoorOpen size={13} aria-hidden="true" />
                        <span>{block.name}</span>
                      </span>
                      {block.subtitle && (
                        <span className="campus-viewer-block-sub">
                          {block.subtitle}
                        </span>
                      )}
                      <span className="campus-viewer-block-meta">
                        {insideCount}{" "}
                        {insideCount === 1 ? "recurso" : "recursos"} · Ver
                        planta
                      </span>
                    </button>
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
                      cursor: "default",
                    }}
                  >
                    <div className="campus-box-head">
                      <strong>{room.name}</strong>
                    </div>
                    <span className="campus-box-sub">
                      {ROOM_TYPE_LABELS[room.roomType]}
                    </span>
                  </div>
                ))}

            {visiblePins.map((pin) => {
              const isSelected = activeSelectedPoint?.id === pin.id;
              return (
                <button
                  key={pin.id}
                  type="button"
                  className={`campus-viewer-pin ${isSelected ? "ativo" : ""}`}
                  style={{
                    left: `${pin.mapX}%`,
                    top: `${pin.mapY}%`,
                  }}
                  onClick={() => setSelectedPointId(pin.id)}
                  aria-label={`Ver recurso ${pin.title}`}
                >
                  <CategoryIcon iconKey={pin.category.icon} size={13} />
                  <span>{pin.category.name}</span>
                </button>
              );
            })}
          </div>
          <p className="campus-canvas-dica">
            {activeBlock
              ? "Clique nos pinos dentro do bloco para ver detalhes e fotos de cada recurso."
              : "Clique em um bloco para abrir sua planta interna ou clique nos pinos do campus."}
          </p>
        </div>

        <div className="campus-viewer-detalhes">
          {activeSelectedPoint ? (
            <div className="campus-detalhe-card">
              <div className="recurso-publico-topo">
                <span className="recurso-publico-cat">
                  <CategoryIcon
                    iconKey={activeSelectedPoint.category.icon}
                    size={13}
                  />
                  <span>{activeSelectedPoint.category.name}</span>
                </span>
                {activeSelectedPoint.underReview && (
                  <span className="recurso-publico-alerta">
                    <AlertTriangle size={12} aria-hidden="true" />
                    <span>Em verificação</span>
                  </span>
                )}
              </div>

              <h3>{activeSelectedPoint.title}</h3>
              <p className="campus-detalhe-local">
                <MapPin size={13} aria-hidden="true" />
                <span>
                  {activeBlock ? activeBlock.name : "Área externa / Campus"}
                </span>
              </p>
              <p className="campus-detalhe-desc">
                {activeSelectedPoint.description}
              </p>

              {activeSelectedPoint.images.length > 0 && (
                <div className="recurso-publico-galeria">
                  {activeSelectedPoint.images.map((img) => (
                    <button
                      key={img.id}
                      type="button"
                      className="recurso-publico-foto-btn"
                      onClick={() => onOpenImage(img)}
                      aria-label={`Ampliar foto: ${img.altText}`}
                    >
                      <img src={img.imageUrl} alt={img.altText} />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="campus-detalhe-vazio">
              <p>
                {activeBlock
                  ? "Nenhum recurso visível neste bloco para o filtro atual."
                  : "Selecione um bloco no mapa para explorar os ambientes internos e seus recursos."}
              </p>
            </div>
          )}

          {visiblePins.length > 1 && (
            <ul className="campus-viewer-lista">
              {visiblePins.map((pin) => (
                <li key={pin.id}>
                  <button
                    type="button"
                    className={`campus-viewer-lista-btn ${activeSelectedPoint?.id === pin.id ? "ativo" : ""}`}
                    onClick={() => setSelectedPointId(pin.id)}
                  >
                    <CategoryIcon iconKey={pin.category.icon} size={13} />
                    <span>{pin.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}

export default CampusMapViewer;
