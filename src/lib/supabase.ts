import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadEvidenceFile(
  file: File,
  bucket: 'incident-evidence' | 'field-evidence' | 'profile-images',
  path: string
): Promise<{ url: string | null; path: string | null; error: string | null }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

  const blob = await fetch(URL.createObjectURL(file)).then((r) => r.blob());

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, blob, {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return { url: null, path: null, error: error.message };
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return { url: publicData.publicUrl, path: data.path, error: null };
}

export async function saveIncidentToDb(incident: Record<string, unknown>) {
  const { data, error } = await supabase.from('incidents').insert(incident).select().single();
  if (error) {
    console.error('DB insert error:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function updateIncidentInDb(incidentId: string, updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('incidents')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('incident_id', incidentId)
    .select()
    .single();
  if (error) {
    console.error('DB update error:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function saveEvidenceToDb(evidence: Record<string, unknown>) {
  const { data, error } = await supabase.from('evidence').insert(evidence).select().single();
  if (error) {
    console.error('Evidence DB insert error:', error);
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function saveAuditEventToDb(event: Record<string, unknown>) {
  const { error } = await supabase.from('audit_logs').insert(event);
  if (error) {
    console.error('Audit log error:', error);
  }
}

export async function saveIncidentEventToDb(event: Record<string, unknown>) {
  const { error } = await supabase.from('incident_events').insert(event);
  if (error) {
    console.error('Incident event error:', error);
  }
}
