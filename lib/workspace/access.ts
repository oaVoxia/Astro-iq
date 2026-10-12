import type { SupabaseClient } from '@supabase/supabase-js';
import { hasActiveEntitlement } from '@/lib/entitlements/access';

export async function assertActiveAccess(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('entitlements')
    .select('status,starts_at,expires_at')
    .eq('user_id', userId)
    .eq('status', 'active');
  if (error) return { ok: false as const, status: 500, error: 'Unable to verify access.' };
  if (!hasActiveEntitlement(data)) {
    return { ok: false as const, status: 402, error: 'Active access required.' };
  }
  return { ok: true as const };
}

export async function getWorkspace(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from('workspaces')
    .select('id,user_id,name,currency,created_at,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) return { ok: false as const, error: 'Unable to load workspace.' };
  if (!data) return { ok: false as const, error: 'Workspace not found.' };
  return { ok: true as const, workspace: data };
}
