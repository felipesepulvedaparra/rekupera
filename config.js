// ════════════════════════════════════════
// REKUPERA — CONFIGURACIÓN SUPABASE
// Reemplaza estos valores con los tuyos de supabase.com
// ════════════════════════════════════════
const SUPABASE_URL = 'https://hcasldnytemihjpeuhgp.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjYXNsZG55dGVtaWhqcGV1aGdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNjM1MDQsImV4cCI6MjEwMDczOTUwNH0.7Kli6MA26YrzreA-H1ONc1B5PEQtO3wMbEvwmWkk9os'

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
