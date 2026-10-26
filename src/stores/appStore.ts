import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Incident,
  FieldUnit,
  Device,
  AuditEvent,
  Evidence,
  AppNotification,
  Theme,
  Alert,
  IncidentEvent,
} from '@/types';
import {
  MOCK_INCIDENTS,
  MOCK_FIELD_UNITS,
  MOCK_DEVICES,
  MOCK_AUDIT_LOGS,
  MOCK_EVIDENCE,
  MOCK_NOTIFICATIONS,
  MOCK_EVENTS,
} from '@/constants/mockData';

interface AppState {
  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Incidents
  incidents: Incident[];
  addIncident: (incident: Incident) => void;
  updateIncident: (incidentId: string, updates: Partial<Incident>) => void;
  getIncident: (incidentId: string) => Incident | undefined;

  // Evidence
  evidence: Evidence[];
  addEvidence: (ev: Evidence) => void;

  // Incident events
  incidentEvents: IncidentEvent[];
  addIncidentEvent: (event: IncidentEvent) => void;
  getIncidentEvents: (incidentId: string) => IncidentEvent[];

  // Field units
  fieldUnits: FieldUnit[];
  updateFieldUnit: (unitId: string, updates: Partial<FieldUnit>) => void;

  // Devices
  devices: Device[];
  updateDevice: (deviceId: string, updates: Partial<Device>) => void;

  // Audit logs
  auditLogs: AuditEvent[];
  addAuditEvent: (event: AuditEvent) => void;

  // Alerts
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  acknowledgeAlert: (alertId: string) => void;

  // Notifications
  notifications: AppNotification[];
  addNotification: (notif: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  getUnreadCount: () => number;

  // Demo simulation
  demoRunning: boolean;
  demoStep: number;
  demoPaused: boolean;
  setDemoRunning: (running: boolean) => void;
  setDemoStep: (step: number) => void;
  setDemoPaused: (paused: boolean) => void;

  // Robot detection state
  robotDetectionActive: boolean;
  robotDetectionConfirmed: boolean;
  setRobotDetectionActive: (active: boolean) => void;
  setRobotDetectionConfirmed: (confirmed: boolean) => void;

  // System status
  realtimeConnected: boolean;
  cloudSyncActive: boolean;
  setRealtimeConnected: (connected: boolean) => void;
  setCloudSyncActive: (active: boolean) => void;

  // Selected station
  selectedStation: string;
  setSelectedStation: (station: string) => void;

  // Reset
  resetToDefaults: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Theme
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // Incidents
      incidents: MOCK_INCIDENTS,
      addIncident: (incident) =>
        set((state) => ({ incidents: [incident, ...state.incidents] })),
      updateIncident: (incidentId, updates) =>
        set((state) => ({
          incidents: state.incidents.map((inc) =>
            inc.incident_id === incidentId
              ? { ...inc, ...updates, updated_at: new Date().toISOString() }
              : inc
          ),
        })),
      getIncident: (incidentId) =>
        get().incidents.find((inc) => inc.incident_id === incidentId),

      // Evidence
      evidence: MOCK_EVIDENCE,
      addEvidence: (ev) =>
        set((state) => ({ evidence: [...state.evidence, ev] })),

      // Incident events
      incidentEvents: MOCK_EVENTS,
      addIncidentEvent: (event) =>
        set((state) => ({ incidentEvents: [...state.incidentEvents, event] })),
      getIncidentEvents: (incidentId) =>
        get().incidentEvents.filter((e) => e.incident_id === incidentId),

      // Field units
      fieldUnits: MOCK_FIELD_UNITS,
      updateFieldUnit: (unitId, updates) =>
        set((state) => ({
          fieldUnits: state.fieldUnits.map((fu) =>
            fu.unit_id === unitId ? { ...fu, ...updates } : fu
          ),
        })),

      // Devices
      devices: MOCK_DEVICES,
      updateDevice: (deviceId, updates) =>
        set((state) => ({
          devices: state.devices.map((d) =>
            d.device_id === deviceId ? { ...d, ...updates } : d
          ),
        })),

      // Audit logs
      auditLogs: MOCK_AUDIT_LOGS,
      addAuditEvent: (event) =>
        set((state) => ({ auditLogs: [event, ...state.auditLogs] })),

      // Alerts
      alerts: [],
      addAlert: (alert) =>
        set((state) => ({ alerts: [alert, ...state.alerts] })),
      acknowledgeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.alert_id === alertId
              ? { ...a, status: 'acknowledged' as const, acknowledged_at: new Date().toISOString() }
              : a
          ),
        })),

      // Notifications
      notifications: MOCK_NOTIFICATIONS,
      addNotification: (notif) =>
        set((state) => ({ notifications: [notif, ...state.notifications] })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        })),
      getUnreadCount: () => get().notifications.filter((n) => !n.read).length,

      // Demo
      demoRunning: false,
      demoStep: 0,
      demoPaused: false,
      setDemoRunning: (running) => set({ demoRunning: running }),
      setDemoStep: (step) => set({ demoStep: step }),
      setDemoPaused: (paused) => set({ demoPaused: paused }),

      // Robot detection
      robotDetectionActive: false,
      robotDetectionConfirmed: false,
      setRobotDetectionActive: (active) => set({ robotDetectionActive: active }),
      setRobotDetectionConfirmed: (confirmed) => set({ robotDetectionConfirmed: confirmed }),

      // System status
      realtimeConnected: true,
      cloudSyncActive: true,
      setRealtimeConnected: (connected) => set({ realtimeConnected: connected }),
      setCloudSyncActive: (active) => set({ cloudSyncActive: active }),

      // Station
      selectedStation: 'Chennai Central',
      setSelectedStation: (station) => set({ selectedStation: station }),

      // Reset
      resetToDefaults: () =>
        set({
          incidents: MOCK_INCIDENTS,
          evidence: MOCK_EVIDENCE,
          incidentEvents: MOCK_EVENTS,
          fieldUnits: MOCK_FIELD_UNITS,
          devices: MOCK_DEVICES,
          auditLogs: MOCK_AUDIT_LOGS,
          notifications: MOCK_NOTIFICATIONS,
          demoRunning: false,
          demoStep: 0,
          demoPaused: false,
        }),
    }),
    {
      name: 'detectx-storage',
      partialize: (state) => ({
        theme: state.theme,
        incidents: state.incidents,
        evidence: state.evidence,
        incidentEvents: state.incidentEvents,
        fieldUnits: state.fieldUnits,
        auditLogs: state.auditLogs,
        notifications: state.notifications,
      }),
    }
  )
);
