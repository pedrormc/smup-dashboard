import type { Metadata } from "next";
import { NavBar } from "@/components/nav-bar";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMUP · Dashboard Comercial",
  description:
    "Dashboard comercial SMUP — funil de vendas em tempo real, integrado ao Google Sheets. Operado pela Singular Group.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <NavBar />
        <main className="mx-auto max-w-[1400px] px-6 py-8">{children}</main>
        <footer className="mx-auto max-w-[1400px] px-6 py-6 text-xs text-gray-500">
          © Singular Group · SMUP Dashboard · código aberto em{" "}
          <a
            href="https://github.com/pedrormc/smup-dashboard"
            className="underline"
            target="_blank"
            rel="noreferrer"
          >
            github.com/pedrormc/smup-dashboard
          </a>
        </footer>
      </body>
    </html>
  );
}
