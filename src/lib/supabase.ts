const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL não definido.");
}

export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey ?? "",
  restUrl: `${supabaseUrl}/rest/v1`,
};

export const supabaseHeaders = {
  apikey: supabaseConfig.anonKey,
  Authorization: `Bearer ${supabaseConfig.anonKey}`,
  "Content-Type": "application/json",
};
