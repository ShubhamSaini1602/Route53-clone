import "@cloudscape-design/global-styles/index.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Amazon Route 53 Console",
  description: "AWS Route 53 Web Console Clone",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
