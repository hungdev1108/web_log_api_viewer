import type { AppProps } from "next/app";
import Head from "next/head";
import { ApiProvider } from "@/context/ApiContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import "@/styles/globals.css";
import "@/styles/print.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>SOFIPOS API</title>
      </Head>
      <ThemeProvider>
        <FavoritesProvider>
          <ApiProvider>
            <Component {...pageProps} />
          </ApiProvider>
        </FavoritesProvider>
      </ThemeProvider>
    </>
  );
}
