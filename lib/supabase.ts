import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export type OcrLabel = {
  id: number;
  filename: string;
  label: string;
  class: string;
  verified: boolean;
  updated_at: string;
  updated_by: string | null;
  assigned_to: string | null;
  assigned_at: string | null;
};
