import {
  CookHistoryEntry,
  DietWeekRecord,
  FamilyPreferences,
  PantryItem,
  Recipe,
  ShoppingItem,
  WifeDietProfile,
} from '../types';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '');
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
const roomKey = (import.meta.env.VITE_FAMILY_ROOM_KEY as string) || 'bep-gia-dinh-default';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export interface SharedFamilyState {
  pantry: PantryItem[];
  shoppingList: ShoppingItem[];
  history: CookHistoryEntry[];
  customRecipes: Recipe[];
  prefs: FamilyPreferences;
  dietWeeks: DietWeekRecord[];
  wifeProfile: WifeDietProfile;
  clientUpdatedAt?: string;
}

function getHeaders() {
  return {
    apikey: supabaseAnonKey || '',
    Authorization: `Bearer ${supabaseAnonKey || ''}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchRemoteFamilyState(): Promise<SharedFamilyState | null> {
  if (!isSupabaseConfigured) return null;

  try {
    const url = `${supabaseUrl}/rest/v1/family_sync?room_key=eq.${encodeURIComponent(
      roomKey
    )}&select=payload`;
    const res = await fetch(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{ payload?: SharedFamilyState }>;
    if (!rows || rows.length === 0 || !rows[0].payload) return null;
    return rows[0].payload;
  } catch {
    return null;
  }
}

export async function pushRemoteFamilyState(state: SharedFamilyState): Promise<void> {
  if (!isSupabaseConfigured) return;

  try {
    const url = `${supabaseUrl}/rest/v1/family_sync?on_conflict=room_key`;
    await fetch(url, {
      method: 'POST',
      headers: {
        ...getHeaders(),
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        room_key: roomKey,
        payload: {
          ...state,
          clientUpdatedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Bỏ qua lỗi mạng tạm thời, dữ liệu vẫn an toàn trong localStorage
  }
}
