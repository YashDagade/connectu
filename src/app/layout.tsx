import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ConnectU - Connect Through Meaningful Questions",
  description: "Create forms with thoughtful questions to connect people with similar values and perspectives.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <main className="flex-grow pt-4 pb-8">{children}</main>
          <footer className="bg-duke-blue text-white py-6">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                  <p className="text-sm">© 2024 ConnectU. All rights reserved.</p>
                </div>
                <div className="flex space-x-4">
                  <a href="#" className="text-white hover:text-gray-300 text-sm">Privacy Policy</a>
                  <a href="#" className="text-white hover:text-gray-300 text-sm">Terms of Service</a>
                  <a href="#" className="text-white hover:text-gray-300 text-sm">Contact Us</a>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
