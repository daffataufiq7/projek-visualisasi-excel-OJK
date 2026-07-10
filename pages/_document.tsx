import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="id">
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="description" content="FINSIGHT - Financial Data Visualization Dashboard OJK Jawa Barat" />
      </Head>
      <body className="bg-slate-50 text-slate-800 font-sans antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
