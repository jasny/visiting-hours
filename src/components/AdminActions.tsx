"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pencil, MoreVertical } from "lucide-react";
import { Menu } from "primereact/menu";
import type { MenuItem } from "primereact/menuitem";
import { confirmDialog } from "primereact/confirmdialog";
import { deletePage } from "@/services/pageService"
import { Toast } from "primereact/toast"

export default function AdminActions({ reference }: { reference: string }) {
  const menuRef = useRef<Menu | null>(null);
  const toast = useRef<Toast | null>(null);
  const router = useRouter();

  const confirmDelete = useCallback(() => {
    confirmDialog({
      message: "Weet je zeker dat je deze pagina wilt verwijderen?",
      header: "Bevestigen",
      icon: "pi pi-exclamation-triangle",
      acceptLabel: "Verwijderen",
      rejectLabel: "Annuleren",
      acceptClassName: "p-button-danger",
      accept: async () => {
        try {
          const success = await deletePage(reference);
          if (success) {
            toast.current?.show({ severity: 'success', summary: 'Pagina verwijderd', life: 2000 });
            setTimeout(() => router.push("/"), 1500);
          }
        } catch (e) {
          console.error(e);
        }
      },
    });
  }, [reference, router]);

  const items: MenuItem[] = [
    {
      label: "Verwijderen",
      icon: "pi pi-trash",
      command: () => {
        confirmDelete();
      },
    },
  ];

  return <>
    <Toast ref={toast} />
    <div className="flex items-center gap-2 z-50">
      <Link
        href={`/edit/${reference}`}
        className="inline-flex items-center gap-2 rounded-full bg-white/90 backdrop-blur border border-[var(--divider)] px-3 py-2 text-[var(--theme-700)] shadow-sm hover:bg-white hover:text-[var(--theme-800)]"
        aria-label="Pagina bewerken"
      >
        <Pencil className="w-4 h-4" />
        <span className="hidden sm:inline">Bewerken</span>
      </Link>

      <button
        type="button"
        onClick={(e) => menuRef.current?.toggle(e)}
        className="inline-flex items-center justify-center cursor-pointer p-2 text-gray-400"
        aria-label="Meer opties"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      <Menu model={items} popup ref={menuRef} />
    </div>
  </>
}
