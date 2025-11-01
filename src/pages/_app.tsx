import type { AppProps } from "next/app";
import { ApiProvider } from "@/context/ApiContext";
import { ThemeProvider } from "@/context/ThemeContext";
import "@/styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider>
      <ApiProvider>
        <Component {...pageProps} />
      </ApiProvider>
    </ThemeProvider>
  );
}
