// ========================================================
// CONFIGURACIÓN DE SUPABASE CLIENT (VANILLA JS)
// ========================================================
// Reemplaza estas dos constantes con los valores de tu proyecto en Supabase:
// Panel Supabase -> Project Settings -> API -> Project URL & anon/public Key

const SUPABASE_URL = window.ENV_SUPABASE_URL || "https://npexwuliagbobqteosxk.supabase.co";
const SUPABASE_ANON_KEY = window.ENV_SUPABASE_ANON_KEY || "sb_publishable_PIJjfOOBmiloy4gO2UlGGQ_a4ziMI_Z";

let supabaseClient = null;

function getSupabaseClient() {
  if (!supabaseClient) {
    if (typeof supabase === "undefined") {
      console.error("El script de Supabase CDN no se ha cargado correctamente.");
      return null;
    }
    
    // Intentar obtener credenciales de localStorage si el usuario las configuró en pantalla
    const storedUrl = localStorage.getItem("time_tracker_supabase_url") || SUPABASE_URL;
    const storedKey = localStorage.getItem("time_tracker_supabase_key") || SUPABASE_ANON_KEY;

    try {
      supabaseClient = supabase.createClient(storedUrl, storedKey);
    } catch (e) {
      console.error("Error al inicializar cliente de Supabase:", e);
    }
  }
  return supabaseClient;
}
