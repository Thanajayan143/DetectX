export type IncidentStatus =
  | 'detected'
  | 'created'
  | 'pending_verification'
  | 'verified'
  | 'field_unit_assigned'
  | 'responding'
  | 'arrived'
  | 'inspection'
  | 'evidence_collected'
  | 'field_work_completed'
  | 'return_report_submitted'
  | 'case_closed';

export type IncidentPriority = 'critical' | 'high' | 'medium' | 'low';

export type SourceType = 'robot' | 'handheld' | 'officer' | 'manual';

export type ThreatCategory = 'narcotics' | 'explosives' | 'suspicious_package' | 'chemical' | 'other';

export interface Incident {
  id: string;
  incident_id: string;
  created_at: string;
  updated_at: string;
  source_type: SourceType;
  device_id?: string;
  station: string;
  platform?: string;
  zone?: string;
  latitude: number;
  longitude: number;
  detection_type?: string;
  threat_category: ThreatCategory;
  sensor_mox?: number;
  sensor_saw?: number;
  sensor_qcl?: number;
  fusion_confidence?: number;
  description?: string;
  status: IncidentStatus;
  verification_status: 'pending' | 'verified' | 'rejected';
  verified_by?: string;
  verified_at?: string;
  verification_remarks?: string;
  assigned_unit?: string;
  assigned_at?: string;
  arrived_at?: string;
  completed_at?: string;
  priority: IncidentPriority;
  evidence_hash?: string;
  blockchain_status?: string;
  return_report_submitted?: boolean;
  case_closed?: boolean;
  additional_notes?: string;
  evidence?: Evidence[];
  events?: IncidentEvent[];
}

export interface Evidence {
  id: string;
  evidence_id: string;
  incident_id: string;
  file_type: 'image' | 'video' | 'document';
  file_name: string;
  file_size?: number;
  file_url?: string;
  storage_path?: string;
  captured_at: string;
  captured_by?: string;
  latitude?: number;
  longitude?: number;
  hash?: string;
  status: 'verified' | 'pending' | 'rejected';
  evidence_type: 'original' | 'field' | 'supplementary';
  created_at: string;
}

export interface IncidentEvent {
  id: string;
  incident_id: string;
  event_type: string;
  event_label: string;
  event_data?: Record<string, unknown>;
  created_by?: string;
  created_at: string;
}

export interface FieldUnit {
  id: string;
  unit_id: string;
  name: string;
  status: 'available' | 'on_patrol' | 'responding' | 'at_scene' | 'off_duty';
  location_name?: string;
  latitude: number;
  longitude: number;
  last_update: string;
  assigned_incident_id?: string;
  officer_name?: string;
  contact?: string;
}

export interface FieldAssignment {
  id: string;
  assignment_id: string;
  incident_id: string;
  field_unit: string;
  assigned_at: string;
  acknowledged_at?: string;
  arrived_at?: string;
  completed_at?: string;
  findings?: string;
  action_taken?: string;
  remarks?: string;
  completion_remarks?: string;
  arrival_latitude?: number;
  arrival_longitude?: number;
  completion_latitude?: number;
  completion_longitude?: number;
  status: 'assigned' | 'acknowledged' | 'en_route' | 'arrived' | 'inspection' | 'completed';
  return_report?: ReturnReport;
}

export interface ReturnReport {
  incident_id: string;
  field_unit: string;
  officer_name: string;
  station: string;
  location: string;
  arrival_time: string;
  completion_time: string;
  original_detection: string;
  sensor_confidence: number;
  observed_condition: string;
  verification_result: string;
  action_taken: string;
  remarks: string;
  gps_arrival: string;
  gps_completion: string;
  digital_acknowledgement: boolean;
  submitted_at: string;
}

export interface Device {
  id: string;
  device_id: string;
  name: string;
  type: 'robot' | 'handheld' | 'fixed';
  status: 'online' | 'offline' | 'patrolling' | 'detecting' | 'maintenance';
  battery_level: number;
  signal_strength: 'strong' | 'medium' | 'weak' | 'none';
  location_name?: string;
  latitude?: number;
  longitude?: number;
  last_seen: string;
  current_mission?: string;
  sensor_types?: string[];
  firmware_version?: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  user_name: string;
  role: string;
  action: string;
  incident_id?: string;
  device_id?: string;
  details?: Record<string, unknown>;
  status: 'success' | 'failed' | 'warning';
}

export interface Alert {
  id: string;
  alert_id: string;
  incident_id?: string;
  type: 'detection' | 'verification' | 'assignment' | 'completion' | 'system' | 'priority';
  message: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'active' | 'acknowledged' | 'dismissed';
  created_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'detection' | 'verification' | 'assignment' | 'completion' | 'system';
  priority: 'high' | 'medium' | 'low';
  read: boolean;
  created_at: string;
  incident_id?: string;
}

export interface DemoUser {
  id: string;
  name: string;
  demo_id: string;
  role: 'control_room' | 'field_unit' | 'admin';
  role_label: string;
  department: string;
  unit: string;
  station: string;
  contact: string;
  email: string;
  avatar?: string;
  account_status: 'active' | 'inactive';
  last_login: string;
}

export interface StationCoordinate {
  name: string;
  lat: number;
  lng: number;
}

export type Theme = 'dark' | 'light';
