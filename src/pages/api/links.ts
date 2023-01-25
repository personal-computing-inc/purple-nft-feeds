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
    .eq("recast", false)
    // check for record containing https
    .filter("text", "ilike", "%https%")
    .limit(20)
    .order("timestamp", { ascending: false });

  if (data) {
    // extract the first link from each cast
    data.forEach((cast) => {
      const link = cast.text.match(/https?:\/\/[^\s]+/g)[0];
      cast.text = cast.text.replace(link, "");
      cast.domain = new URL(link).hostname;
      cast.link = link;
      cast.farcasterLink = `farcaster://casts/${cast.hash}/${cast.hash}`;
    });

    return res.status(200).json(data);
  } else {
    return res.status(500).json(error);
  }
}
