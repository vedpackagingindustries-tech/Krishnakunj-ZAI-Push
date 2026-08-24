"use client";
import { usePathname } from "next/navigation";
import FloatingWhatsApp from "./FloatingWhatsApp";

export default function FloatingWhatsAppWrapper() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  if (isAdmin) return null;
  return <FloatingWhatsApp />;
}
