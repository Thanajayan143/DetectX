import { useEffect, useRef } from 'react';
import { MapPin, Layers } from 'lucide-react';

interface MapMarker {
  lat: number;
  lng: number;
  label: string;
  type: 'incident' | 'unit' | 'robot' | 'station';
  color?: string;
}

interface IncidentMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: MapMarker[];
  height?: string;
  className?: string;
  onMarkerClick?: (marker: MapMarker) => void;
  animatedMarker?: { lat: number; lng: number; label: string } | null;
  route?: Array<{ lat: number; lng: number }>;
}

// We'll dynamically import leaflet to avoid SSR issues
let L: typeof import('leaflet') | null = null;

export function IncidentMap({
  center = [13.0827, 80.2707],
  zoom = 15,
  markers = [],
  height = '400px',
  className = '',
  onMarkerClick,
  animatedMarker,
  route,
}: IncidentMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const markersRef = useRef<import('leaflet').Marker[]>([]);
  const routeLayerRef = useRef<import('leaflet').Polyline | null>(null);
  const animMarkerRef = useRef<import('leaflet').Marker | null>(null);

  useEffect(() => {
    let mounted = true;

    async function initMap() {
      if (!mapRef.current || leafletMapRef.current) return;

      try {
        const leaflet = await import('leaflet');
        L = leaflet.default ?? leaflet;

        // Fix default icons
        delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
        });

        if (!mounted || !mapRef.current) return;

        const map = L.map(mapRef.current, {
          center,
          zoom,
          zoomControl: true,
          attributionControl: true,
        });

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        leafletMapRef.current = map;

        // Add markers
        addMarkersToMap(map, markers, L);

        // Add route
        if (route && route.length > 1) {
          addRouteToMap(map, route, L);
        }

        // Add animated marker
        if (animatedMarker) {
          addAnimatedMarker(map, animatedMarker, L);
        }
      } catch (err) {
        console.error('Map init error:', err);
      }
    }

    initMap();

    return () => {
      mounted = false;
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!leafletMapRef.current || !L) return;
    const map = leafletMapRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    addMarkersToMap(map, markers, L);
  }, [markers]);

  // Update animated marker
  useEffect(() => {
    if (!leafletMapRef.current || !L) return;
    const map = leafletMapRef.current;

    if (animMarkerRef.current) {
      map.removeLayer(animMarkerRef.current);
      animMarkerRef.current = null;
    }

    if (animatedMarker) {
      addAnimatedMarker(map, animatedMarker, L);
    }
  }, [animatedMarker]);

  // Update route
  useEffect(() => {
    if (!leafletMapRef.current || !L) return;
    const map = leafletMapRef.current;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (route && route.length > 1) {
      addRouteToMap(map, route, L);
    }
  }, [route]);

  function addMarkersToMap(
    map: import('leaflet').Map,
    markers: MapMarker[],
    Leaflet: typeof import('leaflet')
  ) {
    markers.forEach((marker) => {
      const color = marker.color ?? getMarkerColor(marker.type);
      const icon = Leaflet.divIcon({
        html: `<div style="
          width:28px;height:28px;
          background:${color};
          border:2px solid rgba(255,255,255,0.8);
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          box-shadow:0 2px 8px rgba(0,0,0,0.4);
        "></div>`,
        className: '',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
      });

      const m = Leaflet.marker([marker.lat, marker.lng], { icon })
        .addTo(map)
        .bindPopup(
          `<div style="font-family:Inter,sans-serif;font-size:12px;color:#0a1224;padding:4px">
            <strong>${marker.label}</strong><br/>
            <span style="color:#666">${marker.type.toUpperCase()}</span>
          </div>`
        );

      if (onMarkerClick) {
        m.on('click', () => onMarkerClick(marker));
      }

      markersRef.current.push(m);
    });
  }

  function addRouteToMap(
    map: import('leaflet').Map,
    route: Array<{ lat: number; lng: number }>,
    Leaflet: typeof import('leaflet')
  ) {
    const latlngs = route.map((p) => [p.lat, p.lng] as [number, number]);
    const polyline = Leaflet.polyline(latlngs, {
      color: '#00b4d8',
      weight: 3,
      opacity: 0.8,
      dashArray: '8 4',
    }).addTo(map);
    routeLayerRef.current = polyline;
  }

  function addAnimatedMarker(
    map: import('leaflet').Map,
    marker: { lat: number; lng: number; label: string },
    Leaflet: typeof import('leaflet')
  ) {
    const icon = Leaflet.divIcon({
      html: `<div style="position:relative">
        <div style="
          width:20px;height:20px;
          background:#22c55e;
          border:3px solid white;
          border-radius:50%;
          box-shadow:0 0 12px rgba(34,197,94,0.6);
        "></div>
        <div style="
          position:absolute;top:-2px;left:-2px;
          width:24px;height:24px;
          border:2px solid rgba(34,197,94,0.5);
          border-radius:50%;
          animation:ping 1.5s ease infinite;
        "></div>
      </div>`,
      className: '',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const m = Leaflet.marker([marker.lat, marker.lng], { icon })
      .addTo(map)
      .bindTooltip(marker.label, { permanent: true, direction: 'right', offset: [10, 0] });
    animMarkerRef.current = m;
  }

  function getMarkerColor(type: string): string {
    const colors: Record<string, string> = {
      incident: '#ef4444',
      unit: '#22c55e',
      robot: '#00b4d8',
      station: '#3b82f6',
    };
    return colors[type] ?? '#6b7280';
  }

  return (
    <div className={`relative rounded-lg overflow-hidden border border-border ${className}`} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      {/* Map overlay label */}
      <div className="absolute top-2 left-2 z-[1000] bg-black/60 backdrop-blur-sm text-xs text-dx-cyan px-2 py-1 rounded border border-dx-cyan/20 flex items-center gap-1.5">
        <Layers className="w-3 h-3" />
        DETECT-X 2.0 MAP
      </div>
    </div>
  );
}
