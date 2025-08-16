import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

// Primary font for headings and branding - Modern, geometric, premium feel
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

// Body text font - Clean, highly readable, professional
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Monospace font for technical elements, code, and IDs
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Aika - AI Music Generator",
    template: "%s | Aika AI Music Generator"
  },
  description: "Transform any idea into professional music tracks using AI. Create songs from descriptions, custom lyrics, or AI-generated lyrics with Aika's powerful music generation technology.",
  keywords: [
    "AI music generator",
    "artificial intelligence music",
    "music creation tool",
    "AI composer",
    "generate music online",
    "custom lyrics to song",
    "music production AI",
    "Aika music generator",
    "automated music creation",
    "AI songwriting"
  ],
  authors: [{ name: "Aika Music Generator" }],
  creator: "Aika AI",
  publisher: "Aika AI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aika-music.vercel.app", // Update with your actual domain
    siteName: "Aika - AI Music Generator",
    title: "Aika - Transform Ideas into Professional Music with AI",
    description: "Create unique songs instantly! Generate professional music from descriptions, custom lyrics, or AI-created lyrics. Join the future of music creation with Aika AI.",
    images: [
      {
        url: "/og-image.jpg", // You'll want to create this
        width: 1200,
        height: 630,
        alt: "Aika AI Music Generator - Create music with artificial intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aika - AI Music Generator",
    description: "Transform any idea into professional music tracks using AI. Create songs instantly with Aika's powerful music generation technology.",
    images: ["/og-image.jpg"], // Same as OpenGraph image
    creator: "@curiousAkash09", // Update with your Twitter handle
  },
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23a855f7'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M2%2013a2%202%200%200%200%202-2V7a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V4a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V7a2%202%200%200%201%204%200v4a2%202%200%200%200%202%202Z'/%3e%3c/svg%3e",
        sizes: "16x16",
        type: "image/svg+xml",
      },
      {
        url: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23a855f7'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M2%2013a2%202%200%200%200%202-2V7a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V4a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V7a2%202%200%200%201%204%200v4a2%202%200%200%200%202%202Z'/%3e%3c/svg%3e",
        sizes: "32x32",
        type: "image/svg+xml",
      },
    ],
    shortcut: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23a855f7'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M2%2013a2%202%200%200%200%202-2V7a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V4a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V7a2%202%200%200%201%204%200v4a2%202%200%200%200%202%202Z'/%3e%3c/svg%3e",
    apple: "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20width='24'%20height='24'%20viewBox='0%200%2024%2024'%20fill='none'%20stroke='%23a855f7'%20stroke-width='2'%20stroke-linecap='round'%20stroke-linejoin='round'%3e%3cpath%20d='M2%2013a2%202%200%200%200%202-2V7a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V4a2%202%200%200%201%204%200v13a2%202%200%200%200%204%200V7a2%202%200%200%201%204%200v4a2%202%200%200%200%202%202Z'/%3e%3c/svg%3e",
  },
  metadataBase: new URL("https://aika-music.vercel.app"), // Update with your actual domain
  alternates: {
    canonical: "/",
  },
  category: "music",
  classification: "AI Music Generation Tool",
  other: {
    "msapplication-TileColor": "#a855f7",
    "theme-color": "#a855f7",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Additional meta tags for better SEO and user experience */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Aika" />
        <meta name="application-name" content="Aika" />
        <meta name="msapplication-TileColor" content="#a855f7" />
        <meta name="theme-color" content="#a855f7" />

        {/* Font preloading for better performance */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&display=swap"
          as="style"
        />
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          as="style"
        />

        {/* Structured Data for better search understanding */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "Aika - AI Music Generator",
              "description": "Transform any idea into professional music tracks using AI. Create songs from descriptions, custom lyrics, or AI-generated lyrics.",
              "url": "https://aika-music.vercel.app/", // Update with your actual domain
              "applicationCategory": "MultimediaApplication",
              "operatingSystem": "Any",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "creator": {
                "@type": "Organization",
                "name": "Aika AI"
              },
              "featureList": [
                "AI Music Generation",
                "Custom Lyrics to Song",
                "Music from Description",
                "AI-Generated Lyrics",
                "Professional Audio Quality",
                "Instant Music Creation"
              ]
            })
          }}
        />

        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      </head>
      <body
        className={`${manrope.variable} ${inter.variable} ${jetbrainsMono.variable} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}