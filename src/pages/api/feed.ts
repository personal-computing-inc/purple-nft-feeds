// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";

import { supabase } from "../../integrations/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { data, error } = await supabase
    .from("casts")
    .select("*")
    .limit(100)
    .order("timestamp", { ascending: false })
    .filter("text", "ilike", "%https%");

  if (error) {
    console.log(error);
  }

  if (data) {
    // extract the first link from each cast
    data.forEach((cast) => {
      const link = cast.text.match(/https?:\/\/[^\s]+/g)[0];
      cast.link = link;
    });
  }

  return res.status(200).json(data);
}
