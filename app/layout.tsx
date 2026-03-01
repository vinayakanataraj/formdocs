import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Formdocs",
  description: "A Notion-style form builder. Deploy in 60 seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
