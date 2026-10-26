import { useState, useRef } from 'react';
import {
  User, Shield, MapPin, Mail, Phone, Building, Clock, Cpu,
  Upload, Camera, CheckCircle, Edit3, Save, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DEMO_USER } from '@/constants/mockData';
import { formatDateTime } from '@/lib/utils';
import { uploadEvidenceFile } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Profile() {
  const { devices } = useAppStore();
  const [editing, setEditing] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState({
    name: DEMO_USER.name,
    contact: DEMO_USER.contact,
    email: DEMO_USER.email,
  });

  async function handleAvatarUpload(file: File) {
    setUploading(true);
    const { url, error } = await uploadEvidenceFile(file, 'profile-images', 'avatars');
    setUploading(false);
    if (error) {
      // Use local preview for demo
      setAvatar(URL.createObjectURL(file));
      toast.success('Profile photo updated (local preview)');
    } else {
      setAvatar(url ?? URL.createObjectURL(file));
      toast.success('Profile photo updated');
    }
  }

  const roleColors: Record<string, string> = {
    control_room: 'text-dx-cyan bg-[#00b4d8]/10 border-[#00b4d8]/30',
    field_unit: 'text-dx-green bg-green-500/10 border-green-500/30',
    admin: 'text-dx-amber bg-amber-500/10 border-amber-500/30',
  };

  return (
    <div className="p-4 lg:p-6 max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground font-display tracking-tight mb-1">User Profile</h1>
        <p className="text-sm text-muted-foreground">DETECT-X 2.0 — Operator account and identity</p>
      </div>

      {/* Profile card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-navy-800 to-navy-600" style={{ background: 'linear-gradient(135deg, #0a1224, #121f30)' }} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-xl border-4 border-background overflow-hidden bg-dx-cyan/10 flex items-center justify-center">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-dx-cyan" />
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-dx-cyan border-2 border-background flex items-center justify-center hover:bg-[#0090aa] transition-colors"
              >
                {uploading ? (
                  <div className="w-3 h-3 border border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-3 h-3 text-black" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleAvatarUpload(e.target.files[0])}
              />
            </div>

            <div className="flex-1 pb-1">
              <p className="text-xl font-bold text-foreground font-display">{DEMO_USER.name}</p>
              <span className={cn('text-[10px] font-bold tracking-widest border rounded px-2 py-0.5 inline-block mt-1', roleColors[DEMO_USER.role])}>
                {DEMO_USER.role_label.toUpperCase()}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => { if (editing) { toast.success('Profile updated'); } setEditing(!editing); }}
              className="pb-1"
            >
              {editing ? <><Save className="w-3.5 h-3.5 mr-1.5" /> Save</> : <><Edit3 className="w-3.5 h-3.5 mr-1.5" /> Edit</>}
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Demo / Official ID', value: DEMO_USER.demo_id, icon: Shield, editable: false },
              { label: 'Department', value: DEMO_USER.department, icon: Building, editable: false },
              { label: 'Unit', value: DEMO_USER.unit, icon: Shield, editable: false },
              { label: 'Assigned Station', value: DEMO_USER.station, icon: MapPin, editable: false },
              { label: 'Contact', value: profile.contact, icon: Phone, editable: true, key: 'contact' },
              { label: 'Email', value: profile.email, icon: Mail, editable: true, key: 'email' },
            ].map((field) => (
              <div key={field.label} className="space-y-1">
                <Label className="text-[10px] font-semibold text-muted-foreground tracking-widest uppercase flex items-center gap-1.5">
                  <field.icon className="w-3 h-3" />
                  {field.label}
                </Label>
                {editing && field.editable && field.key ? (
                  <Input
                    value={profile[field.key as keyof typeof profile]}
                    onChange={(e) => setProfile((p) => ({ ...p, [field.key!]: e.target.value }))}
                    className="text-sm h-8"
                  />
                ) : (
                  <p className="text-sm text-foreground">{field.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account status */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Account Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <p className="text-muted-foreground">Account Status</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full bg-dx-green" />
              <p className="font-semibold text-dx-green uppercase">Active</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground">Last Login</p>
            <p className="font-medium text-foreground mt-1">{formatDateTime(DEMO_USER.last_login)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Active Devices</p>
            <p className="font-medium text-foreground mt-1">{devices.filter((d) => d.status !== 'offline').length} devices connected</p>
          </div>
          <div>
            <p className="text-muted-foreground">Access Level</p>
            <p className="font-medium text-dx-cyan mt-1">Control Room — Full Access</p>
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Permissions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[
            'Create Incidents', 'Review Evidence', 'Verify Incidents',
            'Assign Field Units', 'Forward to Response', 'View Reports',
            'View Audit Logs', 'Manage Devices', 'Download PDFs',
          ].map((perm) => (
            <div key={perm} className="flex items-center gap-2 text-xs">
              <CheckCircle className="w-3 h-3 text-dx-green shrink-0" />
              <span className="text-foreground">{perm}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-dx-amber/5 border border-dx-amber/20 rounded-lg px-4 py-3 text-xs text-muted-foreground">
        <span className="text-dx-amber font-semibold">SIH 2026 Demo Mode: </span>
        This profile uses simulated identity data for demonstration purposes. No real personal data is stored or displayed.
      </div>
    </div>
  );
}
