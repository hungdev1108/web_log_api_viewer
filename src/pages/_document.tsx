import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="vi">
      <Head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <meta name="title" content="SOFIPOS API" />
        <meta
          name="description"
          content="SOFIPOS API - Xem và khám phá API documentation"
        />
        <meta name="keywords" content="SOFIPOS, API, documentation" />
        <meta name="author" content="SOFIPOS DEV" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow" />
        <meta name="google" content="notranslate" />
        <meta name="google" content="notranslate" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
