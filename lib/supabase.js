import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://vrgqmtrcnubxtnqbdajj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_ZcTwvNvZlg4-S5746Cgn8w_5n9WFTk8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
