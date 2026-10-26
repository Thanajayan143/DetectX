import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Pause, Play, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatCoordinate } from '@/lib/utils';

const ROUTE_WAYPOINTS = [
  { lat: 13.0851, lng: 80.2732, instruction: 'Start from base — proceed toward Main Hall' },
  { lat: 13.0845, lng: 80.2726, instruction: 'Continue through Gate A' },
  { lat: 13.0840, lng: 80.2720, instruction: 'Proceed through Entry Gate' },
  { lat: 13.0836, lng: 80.2715, instruction: 'Turn left toward Platform corridor' },
  { lat: 13.0832, lng: 80.2710, instruction: 'Proceed along Platform 8' },
  { lat: 13.0829, lng: 80.2708, instruction: 'Continue toward Parcel Zone' },
  { lat: 13.0827, lng: 80.2707, instruction: 'Destination reached — Parcel Zone, Platform 8' },
];

interface LiveNavigationProps {
  incidentId: string;
  destination: { lat: number; lng: number; label: string };
  onArrived?: () => void;
  className?: string;
}

export function LiveNavigation({ incidentId, destination, onArrived, className }: LiveNavigationProps) {
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [currentPos, setCurrentPos] = useState(ROUTE_WAYPOINTS[0]);
  const [speed] = useState(28);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<import('leaflet').Map | null>(null);
  const unitMarkerRef = useRef<import('leaflet').Marker | null>(null);
  const routeLayerRef = useRef<import('leaflet').Polyline | null>(null);

  const totalWaypoints = ROUTE_WAYPOINTS.length;
  const progressPct = arrived ? 100 : Math.round((currentWaypointIndex / (totalWaypoints - 1)) * 100);
  const remainingWaypoints = totalWaypoints - 1 - currentWaypointIndex;
  const etaSeconds = arrived ? 0 : remainingWaypoints * 4;
  const distanceKm = arrived ? 0 : ((remainingWaypoints / totalWaypoints) * 1.4).toFixed(1);

  useEffect(() => {
    initMap();
    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  async function initMap() {
    if (!mapRef.current || leafletMapRef.current) return;
    try {
      const leaflet = await import('leaflet');
      const L = leaflet.default ?? leaflet;

      delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;

      const map = L.map(mapRef.current, {
        center: [13.0839, 80.2720],
        zoom: 16,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OSM',
        maxZoom: 19,
      }).addTo(map);

      // Draw route
      const latlngs = ROUTE_WAYPOINTS.map(p => [p.lat, p.lng] as [number, number]);
      const polyline = L.polyline(latlngs, {
        color: '#00b4d8',
        weight: 4,
        opacity: 0.7,
        dashArray: '10 5',
      }).addTo(map);
      routeLayerRef.current = polyline;

      // Destination marker
      const destIcon = L.divIcon({
        html: `<div style="width:24px;height:24px;background:#ef4444;border:3px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 8px rgba(0,0,0,0.4)"></div>`,
        className: '',
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });
      L.marker([destination.lat, destination.lng], { icon: destIcon })
        .addTo(map)
        .bindTooltip(`📍 ${destination.label}`, { permanent: true, direction: 'right' });

      // Unit marker
      const unitIcon = L.divIcon({
        html: `<div style="position:relative"><div style="width:20px;height:20px;background:#22c55e;border:3px solid white;border-radius:50%;box-shadow:0 0 12px rgba(34,197,94,0.8)"></div><div style="position:absolute;top:-3px;left:-3px;width:26px;height:26px;border:2px solid rgba(34,197,94,0.5);border-radius:50%;animation:ping 1.5s ease infinite"></div></div>`,
        className: '',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const unitMarker = L.marker([ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng], { icon: unitIcon })
        .addTo(map)
        .bindTooltip('RPF-04 Unit', { permanent: false, direction: 'right' });
      unitMarkerRef.current = unitMarker;

      leafletMapRef.current = map;
    } catch (err) {
      console.error('Nav map init error:', err);
    }
  }

  function updateMarkerPosition(lat: number, lng: number) {
    if (!unitMarkerRef.current || !leafletMapRef.current) return;
    unitMarkerRef.current.setLatLng([lat, lng]);
    leafletMapRef.current.panTo([lat, lng], { animate: true, duration: 0.5 });
  }

  function startNavigation() {
    if (arrived) return;
    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      setCurrentWaypointIndex((prev) => {
        const next = prev + 1;
        if (next >= ROUTE_WAYPOINTS.length - 1) {
          clearInterval(intervalRef.current!);
          setIsRunning(false);
          setArrived(true);
          const lastWP = ROUTE_WAYPOINTS[ROUTE_WAYPOINTS.length - 1];
          setCurrentPos(lastWP);
          updateMarkerPosition(lastWP.lat, lastWP.lng);
          onArrived?.();
          return ROUTE_WAYPOINTS.length - 1;
        }
        const wp = ROUTE_WAYPOINTS[next];
        setCurrentPos(wp);
        updateMarkerPosition(wp.lat, wp.lng);
        return next;
      });
    }, 2500);
  }

  function pauseNavigation() {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function resetNavigation() {
    pauseNavigation();
    setCurrentWaypointIndex(0);
    setArrived(false);
    setCurrentPos(ROUTE_WAYPOINTS[0]);
    updateMarkerPosition(ROUTE_WAYPOINTS[0].lat, ROUTE_WAYPOINTS[0].lng);
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const currentInstruction = arrived
    ? 'Destination reached — Parcel Zone, Platform 8'
    : ROUTE_WAYPOINTS[currentWaypointIndex]?.instruction ?? '';

  return (
    <div className={cn('space-y-4', className)}>
      {/* SIMULATED label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-dx-cyan" />
          <span className="text-sm font-semibold text-foreground">Field Navigation</span>
        </div>
        <span className="text-[10px] font-bold text-dx-amber bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded tracking-widest">
          SIMULATED NAVIGATION
        </span>
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full h-56 rounded-lg overflow-hidden border border-border" />

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-dx-cyan rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="text-lg font-bold text-foreground">{distanceKm}</p>
          <p className="text-[10px] text-muted-foreground">km</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">ETA</p>
          <p className="text-lg font-bold text-foreground">
            {arrived ? '00:00' : `${String(Math.floor(etaSeconds / 60)).padStart(2, '0')}:${String(etaSeconds % 60).padStart(2, '0')}`}
          </p>
          <p className="text-[10px] text-muted-foreground">min:sec</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Speed</p>
          <p className="text-lg font-bold text-foreground">{isRunning ? speed : 0}</p>
          <p className="text-[10px] text-muted-foreground">km/h</p>
        </div>
      </div>

      {/* Coordinates */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">CURRENT LAT</span>
          <span className="font-mono text-dx-cyan">{formatCoordinate(currentPos.lat)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">CURRENT LNG</span>
          <span className="font-mono text-dx-cyan">{formatCoordinate(currentPos.lng)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">DESTINATION LAT</span>
          <span className="font-mono text-orange-400">{formatCoordinate(destination.lat)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">DESTINATION LNG</span>
          <span className="font-mono text-orange-400">{formatCoordinate(destination.lng)}</span>
        </div>
      </div>

      {/* Instruction */}
      <div className={cn(
        'flex items-start gap-3 rounded-lg p-3 border',
        arrived
          ? 'bg-green-500/10 border-green-500/30'
          : 'bg-[#00b4d8]/5 border-[#00b4d8]/20'
      )}>
        {arrived ? (
          <CheckCircle className="w-4 h-4 text-dx-green shrink-0 mt-0.5" />
        ) : (
          <Navigation className="w-4 h-4 text-dx-cyan shrink-0 mt-0.5" />
        )}
        <p className={cn('text-sm', arrived ? 'text-dx-green font-semibold' : 'text-foreground')}>
          {currentInstruction}
        </p>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {!arrived && (
          <>
            {!isRunning ? (
              <Button
                onClick={startNavigation}
                size="sm"
                className="flex-1 bg-dx-cyan text-black hover:bg-[#0090aa] font-semibold"
              >
                <Play className="w-3 h-3 mr-1.5" />
                {currentWaypointIndex === 0 ? 'START' : 'RESUME'}
              </Button>
            ) : (
              <Button
                onClick={pauseNavigation}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Pause className="w-3 h-3 mr-1.5" />
                PAUSE
              </Button>
            )}
          </>
        )}
        {arrived && (
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-dx-green" />
            <span className="text-sm font-bold text-dx-green">ARRIVED AT LOCATION</span>
          </div>
        )}
        <Button
          onClick={resetNavigation}
          size="sm"
          variant="outline"
          className="aspect-square"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
