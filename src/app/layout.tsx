import "./globals.css";
import type { Metadata } from "next";
import { UserProvider } from "./context/UserContext";

export const metadata: Metadata = {
  title: "Bulldog Mapping",
  description: "Interactive campus map for Fresno State",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative">
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
