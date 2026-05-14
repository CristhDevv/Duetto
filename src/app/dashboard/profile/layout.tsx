import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfil — Duetto",
  description: "Personaliza tu perfil, consulta tus logros y gestiona tu hogar compartido.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
