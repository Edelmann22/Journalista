/**
 * Config · online play credentials
 * ================================
 *
 * Paste your Supabase project URL and anon (public) key here.
 * Supabase dashboard: Project Settings > API. No tables are needed: the game
 * only uses Realtime broadcast channels.
 *
 * When either value is empty, multiplayer falls back to a local test mode that
 * only works between tabs of the same browser (see js/modes/multiplayer.js).
 */

const SUPABASE_URL = "https://wfixgjpmzmcugavvwjxo.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8-6ASu9uPThW0fCsdp4yIQ_WYxpmjKW";

/**
 * Quick matches are played against a simulated opponent for now (js/modes/bot.js).
 * Set to true to show "(bot)" after the opponent's name.
 */
const LABEL_BOTS = false;
