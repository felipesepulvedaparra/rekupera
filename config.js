// ════════════════════════════════════════
// REKUPERA — CONFIGURACIÓN SUPABASE
// Reemplaza estos valores con los tuyos de supabase.com
// ════════════════════════════════════════
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co'
const SUPABASE_ANON_KEY = 'TU_ANON_KEY_AQUI'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
