// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { supabase } from "../../integrations/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data, error } = await supabase.from("casts").select("*").eq("recast", false).limit(100).order('timestamp', { ascending: false });

  return res.status(200).json(data);
}
