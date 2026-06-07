import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Client cho phía browser (dùng anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client cho phía server với quyền admin (dùng service_role key)
// KHÔNG dùng cái này ở browser
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Types khớp với bảng trong Supabase
export type RoleType = 'ADMIN' | 'STAFF' | 'CUSTOMER';

export interface Profile {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: RoleType;
  created_at: string;
  updated_at: string;
}
