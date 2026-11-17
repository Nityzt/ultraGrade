import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// `/demo` is intentionally usable in a static preview with no Supabase
// credentials. The AuthProvider bypasses all requests on that route; these
// inert values simply keep module evaluation safe while the normal app still
// requires real environment variables to authenticate or sync.
export const supabase = createClient(
  supabaseUrl || 'https://ultragrade-demo.invalid',
  supabaseAnonKey || 'demo-anon-key',
);
