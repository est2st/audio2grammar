'use client'

import type { Metadata } from "next";
import { Providers } from './providers'
import { Inter } from "next/font/google";
import "./globals.css";
import { Box } from "@chakra-ui/react";

const inter = Inter({ subsets: ["latin"] });

const metadata: Metadata = {
  title: "Lang Checker",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
       <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={`${metadata.description}`} />
        <title>{`${metadata.title}`}</title>
      </head>
      <body className={inter.className}>
        <Providers>
            <>
              <Box minH="100vh">  
                {children}
              </Box>
            </>
        </Providers>
      </body>
    </html>
  );
}
