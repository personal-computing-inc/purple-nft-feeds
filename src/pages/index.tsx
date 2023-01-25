import Head from "next/head";
import Image from "next/image";
import { Inter } from "@next/font/google";
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
  const { data } = useSWR("/api/links", fetcher);

  // const [data, setData] = useState();

  // useEffect(() => {
  //   fetch("/api/feed")
  //     .then((res) => res.json())
  //     .then((data) => setData(data));
  // }, []);

  return (
    <>
      <Head>
        <title>Def Links</title>
        <meta name="description" content="links from Def" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex md:pt-8 md:pl-4 md:pr-4 md:max-w-[1200px] ml-auto mr-auto">
        <div className="flex flex-col bg-stone-900">
          <div className="flex flex-row bg-violet-800	text-white p-2">
            {/* <Image src="/def-logo.svg" width={80} height={37} alt="def logo" /> */}
            <Mono className="font-bold	text-white mr-2">Def Links</Mono>
            <Mono subdued>
              <Link href={"/feed"}>raw feed</Link>
            </Mono>
          </div>
          <div className="mt-4 w-full">
            {data &&
              data.map((cast: any, index: number) => (
                <div key={index} className="flex flex-row mb-3 pl-4 pr-4">
                  <div className="text-sm font-mono mr-2 mt-1 text-neutral-400">
                    {index + 1}.
                  </div>
                  <div className="flex flex-col w-full">
                    <p>
                      <Link href={cast.link} className="break-all">
                        {cast.text}
                      </Link>
                      <span className="break-all text-neutral-400">
                        ({cast.domain})
                      </span>
                    </p>
                    <div className="flex gap-4 text-xs font-mono mt-2">
                      <p className="text-neutral-400">
                        {cast.reactions} hearts | cast by @
                        {cast.author_username} |
                        {/* <p>{new dayjs(cast.timestamp)}</p> */}{" "}
                        <Link href={cast.farcasterLink}>
                          <TimeAgo
                            className="text-neutral-400 hover:underline"
                            datetime={cast.timestamp}
                          />
                        </Link>{" "}
                        | {cast.recasts} recasts | {cast.replies} replies
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </>
  );
}
