import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { MapPin, Search, Trash2 } from "lucide-react";

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface OpenStreetMapPickerProps {
  latitude: string;
  longitude: string;
  addressHint?: string;
  onChange: (lat: string, lng: string) => void;
}

const DEFAULT_CENTER: [number, number] = [-5.2, -39.5];

const pickerMarkerIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapViewportSync({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [map, center, zoom]);

  return null;
}

function MapClickHandler({
  onSelect,
}: {
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function OpenStreetMapPicker({
  latitude,
  longitude,
  addressHint = "",
  onChange,
}: OpenStreetMapPickerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [viewZoom, setViewZoom] = useState<number>(() =>
    latitude.trim() && longitude.trim() ? 16 : 6
  );

  const parsedCoords = useMemo<[number, number] | null>(() => {
    const lat = Number(latitude.replace(",", "."));
    const lng = Number(longitude.replace(",", "."));
    if (
      latitude.trim() === "" ||
      longitude.trim() === "" ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
      return null;
    }
    return [lat, lng];
  }, [latitude, longitude]);

  const mapCenter = parsedCoords ?? DEFAULT_CENTER;

  const updatePoint = (lat: number, lng: number, zoom = 17) => {
    onChange(lat.toFixed(6), lng.toFixed(6));
    setViewZoom(zoom);
  };

  const runSearch = async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) {
      setSearchError("Digite um endereço, rua ou local para buscar.");
      return;
    }

    setSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=br&q=${encodeURIComponent(q)}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Não foi possível consultar o OpenStreetMap.");
      }

      const data = (await response.json()) as NominatimResult[];
      if (!Array.isArray(data) || data.length === 0) {
        setSearchError(
          "Nenhum local encontrado. Tente incluir cidade e estado ou clique diretamente no mapa."
        );
        return;
      }

      setResults(data);
      const first = data[0];
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        updatePoint(lat, lon, 16);
      }
    } catch (err) {
      setSearchError(
        err instanceof Error
          ? err.message
          : "Erro ao buscar localização no OpenStreetMap."
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch(searchQuery);
    }
  };

  const handleSelectResult = (item: NominatimResult) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
    updatePoint(lat, lon, 17);
    setResults([]);
    setSearchError(null);
  };

  return (
    <div className="osm-picker">
      <div className="osm-busca-barra">
        <div className="osm-busca-input-wrap">
          <Search size={16} aria-hidden="true" />
          <input
            id="cfg-osm-search"
            type="text"
            placeholder="Buscar endereço ou nome do local no OpenStreetMap (ex.: IFCE Campus Iguatu)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
        <button
          type="button"
          className="osm-btn-buscar"
          disabled={searching}
          onClick={() => void runSearch(searchQuery)}
        >
          {searching ? "Buscando..." : "Buscar"}
        </button>
        {addressHint.trim() && (
          <button
            type="button"
            className="osm-btn-endereco"
            disabled={searching}
            onClick={() => {
              setSearchQuery(addressHint);
              void runSearch(addressHint);
            }}
          >
            Usar endereço
          </button>
        )}
      </div>

      {searchError && (
        <p className="osm-erro" role="alert">
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <ul className="osm-resultados" aria-label="Resultados da busca no mapa">
          {results.map((item) => (
            <li key={item.place_id}>
              <button
                type="button"
                className="osm-resultado-item"
                onClick={() => handleSelectResult(item)}
              >
                <MapPin size={14} aria-hidden="true" />
                <span>{item.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="osm-mapa-wrap">
        <MapContainer
          center={mapCenter}
          zoom={viewZoom}
          scrollWheelZoom={true}
          className="osm-mapa"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapViewportSync center={mapCenter} zoom={viewZoom} />
          <MapClickHandler onSelect={(lat, lng) => updatePoint(lat, lng, 17)} />
          {parsedCoords && (
            <Marker
              position={parsedCoords}
              icon={pickerMarkerIcon}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const pos = e.target.getLatLng();
                  updatePoint(pos.lat, pos.lng, viewZoom);
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      <div className="osm-rodape">
        {parsedCoords ? (
          <>
            <span className="osm-coordenadas-ok">
              Localização marcada ({parsedCoords[0].toFixed(6)},{" "}
              {parsedCoords[1].toFixed(6)}) — clique ou arraste o pino para
              ajustar.
            </span>
            <button
              type="button"
              className="osm-btn-limpar"
              onClick={() => onChange("", "")}
            >
              <Trash2 size={14} aria-hidden="true" />
              <span>Remover marcação</span>
            </button>
          </>
        ) : (
          <span className="osm-dica">
            Busque um endereço acima ou clique diretamente no mapa para marcar
            a localização exata da instituição.
          </span>
        )}
      </div>
    </div>
  );
}

export default OpenStreetMapPicker;
