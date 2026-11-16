import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer";
import SiteChrome from "@/components/SiteChrome";
import VisitorTracker from "@/components/VisitorTracker";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "UPPILIEES — Pure Nature. Pure Goodness.",
  description:
    "Authentic Kerala homestead produce: herbal wellness, traditional Kerala foods, and handloom.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${montserrat.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans font-normal">
        <VisitorTracker />
        <SiteChrome>
          <Navbar />
        </SiteChrome>
        {children}
        <SiteChrome>
          <Footer />
        </SiteChrome>
      </body>
    </html>
  );
}
