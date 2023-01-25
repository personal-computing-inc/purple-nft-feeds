// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "../../integrations/supabase";

import { ethers } from "ethers";
import canonicalize from "canonicalize";

import fetch from "isomorphic-fetch";
import { resolve } from "path";

const EIP_191_PREFIX = "eip191:";
const TWO_DAYS_IN_MS = 60 * 60 * 24 * 1000;

// Given an Ethers Wallet and a JSON payload, generate the custody bearer token
const generateCustodyBearer = async (payload: any, wallet: any) => {
  const signature = await wallet.signMessage(canonicalize(payload));
  const signatureString = Buffer.from(
    ethers.utils.arrayify(signature)
  ).toString("base64");
  return EIP_191_PREFIX + signatureString;
};

// Given the custody bearer token, JSON payload and wallet address, verify that the bearer token is valid
const verifyCustodyBearer = async (
  custodyBearerToken: any,
  payload: any,
  address: any
) => {
  const recoveredAddress = ethers.utils.recoverAddress(
    // @ts-ignore
    ethers.utils.hashMessage(canonicalize(payload)),
    ethers.utils.hexlify(
      Buffer.from(custodyBearerToken.split(":")[1], "base64")
    )
  );
  return recoveredAddress === address;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // WARNING: Example only -- do not ever hard-code your real mnemonic in Replit, even in a fork!
  const wallet = ethers.Wallet.fromMnemonic(process.env.MNEMONIC!);

  const timestamp = Date.now();
  console.log('beginning ingestion at', new Date(timestamp).toISOString())

  const payload = {
    method: "generateToken",
    params: {
      timestamp,
      expiresAt: timestamp + TWO_DAYS_IN_MS,
    },
  };

  const custodyBearerToken = await generateCustodyBearer(payload, wallet);
  console.log(`Custody Bearer Token: ${custodyBearerToken}\n`);
  // Custody Bearer Token: eip191:V5Opo6K5M6JECBNurxHDtbts3Uqh/QpisEwm0ZSPqQdXrnTBvBZDZSME3HPeq/1pGP7ISwKJocGeWZESM8am8xs=

  const validity = await verifyCustodyBearer(
    custodyBearerToken,
    payload,
    wallet.address
  );
  console.log(`Valid signature: ${validity}\n`);
  // Valid signature: true

  if (validity) {
    // go fetch application bearer token

    const secret = await fetch("https://api.farcaster.xyz/v2/auth", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${custodyBearerToken}`,
      },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((res) => res.result.token.secret);

    console.log("App Bearer Token: " + secret);

    const owners = await fetch(
      "https://api.farcaster.xyz/v2/collection-owners?collectionId=def-memberships&limit=100",
      {
        method: "GET",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${secret}`,
        },
      }
    )
      .then((res) => res.json())
      .then((res) => res.result.users);

    // const promises = limitedOwners.map(async (owner: any) => {

    // console.log("FID", limitedOwners[0].fid);

    const allCasts = await Promise.all(
      owners.map(async (owner: any) => {
        return await fetch(
          `https://api.farcaster.xyz/v2/casts?fid=${owner.fid}&limit=25`,
          {
            method: "GET",
            headers: {
              accept: "application/json",
              authorization: `Bearer ${secret}`,
            },
          }
        )
          .then((res) => res.json())
          .then((res) => res.result.casts);
      })
    )
      .then((res) => res.flat())
      .then((res) => res.filter((cast: any) => !cast.parentHash));
    // .then((res) => res.sort((a: any, b: any) => b.timestamp - a.timestamp));

    // bulk insert casts into supabase

    const mappedForDB = allCasts.map((item: any) => {
      return {
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
      };
    });

    // remove duplicates
    const unique = mappedForDB.filter(
      (v, i, a) => a.findIndex((t) => t.hash === v.hash) === i
    );

    const dbResponse = await supabase.from("casts").upsert(unique, {
      onConflict: "hash",
    });

    console.log("dbResponse", dbResponse);

    return res.status(200).json(allCasts);
  }

  res.status(401).json({ status: "Unauthorized" });
}
