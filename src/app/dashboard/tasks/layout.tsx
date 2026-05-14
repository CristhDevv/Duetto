import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tareas — Duetto",
  description: "Gestiona las tareas compartidas de tu hogar, asigna responsabilidades y gana puntos.",
};

export default function TasksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
