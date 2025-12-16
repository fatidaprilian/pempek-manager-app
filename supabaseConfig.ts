import { createClient } from '@supabase/supabase-js';

// Ganti dengan URL dan Key dari Dashboard Supabase Anda
const SUPABASE_URL = 'https://zulfmdpnhqnkgtrfekmd.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp1bGZtZHBuaHFua2d0cmZla21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4OTE2MzYsImV4cCI6MjA3OTQ2NzYzNn0.dxocwupBKoUCvZDTzlyIvb4yCpxyUj9JiGogNKhMRxw';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);