import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
import styles from "@/styles/Home.module.css";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import TimeAgo from "timeago-react";
import useSWR from "swr";
import { Mono } from "@/components/Typography";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

// @ts-ignore
const fetcher = (...args) => fetch(...args).then((res) => res.json());

export default function Home() {
  const { data } = useSWR("/api/feed", fetcher);

  return (
    <>
      <Head>
        <title>DEF Farcaster Feed</title>
        <meta name="description" content="Tinkering on the edge of the internet." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col">
              <Image
                src="/def-logo.svg"
                width={80}
                height={37}
                alt="def logo"
              />
              <div className="flex flex-row pt-2">
                <Mono className="mr-2">Farcaster Feed</Mono>
                <Mono subdued ><Link href={"/links"}>top links</Link></Mono>

              </div>
            </div>
          </div>
          {data &&
            data.map((item: any, index: number) => (
              <div
                key={index}
                className="flex flex-col gap-2 max-w-lg border border-neutral-800 rounded-2xl p-4"
              >
                <div className="text-sm flex gap-2 font-mono">
                  <p className="text-neutral-400">@{item.author_username}</p>
                  <p className="">-</p>
                  <TimeAgo
                    className="text-purple-300"
                    datetime={item.timestamp}
                  />
                </div>
                <p className="break-words">{item.text}</p>
                <div className="flex gap-4 text-xs text-purple-200 font-mono">
                  <p>Hearts: {item.reactions}</p>
                  <p>Recasts: {item.recasts}</p>
                  <p>Replies: {item.replies}</p>
                </div>
              </div>
            ))}
        </div>
      </main>
    </>
  );
}
