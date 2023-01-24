// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import data from "public/sampledata.json";

import { supabase } from "../../integrations/supabase";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  data.forEach(async (item) => {
    console.log('processing', item.hash);

    const { data, error } = await supabase.from("casts").upsert({
      timestamp: new Date(item.timestamp),
      hash: item.hash,
      thread_hash: item.threadHash,
      author_fid: item.author.fid,
      author_username: item.author.username,
      author_display_name: item.author.displayName,
      author_pfp_url: item.author.pfp.url,
      text: item.text,
      replies: item.replies.count,
      reactions: item.reactions.count,
      recasts: item.recasts.count,
    }, {
        onConflict: 'hash'
    });

    if (data) {console.log(data)}
    if (error) {console.log(error)}
  });

  return res.status(200).json({});
}
