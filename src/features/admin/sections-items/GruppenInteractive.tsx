"use client";

import { useState, useMemo } from "react";
import {
  Package,
  Clock,
  CheckCircle2,
  Lock,
  Plus,
  Info,
  Layers,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Image from "next/image";

import { useDetailDrawer, InfoGrid, type DrawerConfig } from "@/components/ui/detail-drawer";
import { useToast } from "@/components/ui/toast";
import { ModalDialog } from "@/components/ui/modal-dialog";
import type { SectionTreeNode, LeafItemListItem } from "./queries";

export type WorkGroup = {
  id: string;
  name: string;
  description: string;
  targetMins: number;
  assignedItemIds: string[];
};

type GruppenInteractiveProps = Readonly<{
  sections: readonly SectionTreeNode[];
  leafItems: readonly LeafItemListItem[];
  copy: {
    minutes: string;
  };
}>;

// Predefined 3 Groups with items assigned
const INITIAL_GROUPS: WorkGroup[] = [
  {
    id: "group-1",
    name: "Gruppe 1 — Vorne, KidsClub, Herren Dusche, Mitte",
    description: "Vorne (Empfang), KidsClub, Herren Dusche & Cardio Mitte Bereich",
    targetMins: 195,
    assignedItemIds: [
      "item-01", "item-02", "item-03", "item-04", "item-05", "item-06"
    ],
  },
  {
    id: "group-2",
    name: "Gruppe 2 — Hinten, Herren WC, Herren Umkleide, Wege",
    description: "Kraftbereich (Hinten), Herren WC, Herren Umkleide & Korridore mit Maschine",
    targetMins: 190,
    assignedItemIds: [
      "item-07", "item-08", "item-09", "item-10", "item-11"
    ],
  },
  {
    id: "group-3",
    name: "Gruppe 3 — Frauen komplett, Wellness, Cycling, Kursraum",
    description: "Frauenbereich komplett, Wellness & Sauna, Cyclingraum & Kursräume",
    targetMins: 185,
    assignedItemIds: [
      "item-12", "item-13", "item-14", "item-15"
    ],
  },
];

export function GruppenInteractive({ sections, leafItems, copy }: GruppenInteractiveProps) {
  const [groups, setGroups] = useState<WorkGroup[]>(INITIAL_GROUPS);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedItemsForGroup, setSelectedItemsForGroup] = useState<string[]>([]);
  const { open } = useDetailDrawer();
  const { toast } = useToast();

  // Create a map of leafItemId -> assigned group name for non-overlap enforcement
  const assignedItemToGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    groups.forEach((g) => {
      // If we are currently editing this group, don't block its own items
      if (editingGroupId && g.id === editingGroupId) return;
      g.assignedItemIds.forEach((itemId) => {
        map.set(itemId, { groupId: g.id, groupName: g.name.split("—")[0].trim() });
      });
    });
    return map;
  }, [groups, editingGroupId]);

  // Delete group
  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (confirm(`Möchten Sie die Gruppe "${groupName}" wirklich löschen?`)) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast("Gruppe erfolgreich gelöscht!", "success");
      setIsBuilderOpen(false);
    }
  };

  // Open builder for creating a new group
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setNewGroupName(`Gruppe ${groups.length + 1}`);
    setSelectedItemsForGroup([]);
    setIsBuilderOpen(true);
  };

  // Open builder for editing an existing group
  const handleOpenEditGroup = (group: WorkGroup) => {
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setSelectedItemsForGroup([...group.assignedItemIds]);
    setIsBuilderOpen(true);
  };

  // Toggle whole section items
  const handleToggleSectionItems = (mainSectionId: string) => {
    const subSecs = sections.filter((s) => s.parentSectionId === mainSectionId);
    const subSecIds = new Set([mainSectionId, ...subSecs.map((ss) => ss.id)]);
    const secItems = leafItems.filter((i) => subSecIds.has(i.sectionId));
    const secItemIds = secItems.map((i) => i.id);

    if (secItemIds.length === 0) {
      toast("Keine Objekte in diesem Bereich gefunden!", "error");
      return;
    }

    // Filter out items that are already assigned to OTHER groups
    const availableSecItemIds = secItemIds.filter((id) => !assignedItemToGroupMap.has(id));

    if (availableSecItemIds.length === 0) {
      toast("Alle Objekte in diesem Bereich sind bereits in anderen Gruppen belegt!", "error");
      return;
    }

    const allSelected = availableSecItemIds.every((id) => selectedItemsForGroup.includes(id));

    if (allSelected) {
      // Deselect all
      setSelectedItemsForGroup((prev) => prev.filter((id) => !availableSecItemIds.includes(id)));
    } else {
      // Select all available
      setSelectedItemsForGroup((prev) => Array.from(new Set([...prev, ...availableSecItemIds])));
    }
  };

  // Toggle single item
  const handleToggleSingleItem = (itemId: string) => {
    const currentGroup = assignedItemToGroupMap.get(itemId);
    if (currentGroup) {
      toast(`Dieses Objekt ist bereits der ${currentGroup.groupName} zugewiesen!`, "error");
      return;
    }

    setSelectedItemsForGroup((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Save Group
  const handleSaveGroup = () => {
    if (!newGroupName.trim()) {
      toast("Bitte geben Sie einen Gruppen-Namen ein!", "error");
      return;
    }
    if (selectedItemsForGroup.length === 0) {
      toast("Bitte wählen Sie mindestens 1 Objekt für diese Gruppe aus!", "error");
      return;
    }

    // Compute total time
    const selectedObjList = leafItems.filter((i) => selectedItemsForGroup.includes(i.id));
    const totalTime = selectedObjList.reduce((sum, i) => sum + i.estimatedMinutes, 0);

    if (editingGroupId) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === editingGroupId
            ? { ...g, name: newGroupName, targetMins: totalTime, assignedItemIds: selectedItemsForGroup }
            : g
        )
      );
      toast("Gruppe erfolgreich aktualisiert!", "success");
    } else {
      const newGroup: WorkGroup = {
        id: `group-${Date.now()}`,
        name: newGroupName,
        description: `Vorgeschlagene Arbeitsgruppe mit ${selectedItemsForGroup.length} Objekten`,
        targetMins: totalTime,
        assignedItemIds: selectedItemsForGroup,
      };
      setGroups((prev) => [...prev, newGroup]);
      toast("Neue Arbeitsgruppe erfolgreich erstellt!", "success");
    }

    setIsBuilderOpen(false);
  };

  // Drawer for inspecting a group
  const openGroupDrawer = (group: WorkGroup) => {
    const groupItems = leafItems.filter((i) => group.assignedItemIds.includes(i.id));
    const totalMins = groupItems.reduce((s, i) => s + i.estimatedMinutes, 0);

    const config: DrawerConfig = {
      title: group.name,
      subtitle: `${groupItems.length} Objekte · ${totalMins} Min. Gesamtdauer (+3 Std.)`,
      icon: <Package className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${(totalMins / 60).toFixed(1)} Stunden`,
        variant: totalMins >= 180 ? "success" : "warning",
      },
      kpis: [
        { label: "Objekte", value: groupItems.length, color: "text-emerald-600" },
        { label: "Gesamtdauer", value: `${totalMins}m`, color: "text-blue-600" },
        { label: "Tages-Soll", value: "3.0h+", color: "text-purple-600" },
      ],
      sections: [
        {
          label: "Enthaltene Reinigungsobjekte & Aufgaben",
          content: (
            <div className="grid gap-2">
              {groupItems.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {item.referenceImagePath ? (
                      <div className="relative size-10 rounded-xl overflow-hidden shrink-0 border border-outline-variant/40">
                        <Image
                          src={item.referenceImagePath.startsWith("/") ? item.referenceImagePath : `/${item.referenceImagePath}`}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="size-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold shrink-0">
                        <CheckCircle2 className="size-5" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-sm text-on-surface">{item.name}</p>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <Clock className="size-3" /> {item.estimatedMinutes} Min.
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full shrink-0">
                    Zugewiesen
                  </span>
                </div>
              ))}
            </div>
          ),
        },
      ],
    };
    open(config);
  };

  return (
    <div className="grid gap-6">
      {/* Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-secondary/10 via-surface-container-low to-surface-container-lowest border border-outline-variant/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg font-bold text-on-surface flex items-center gap-2">
            <Package className="size-5 text-secondary" /> Arbeitsgruppen & Vorlagen (Gruppen / Plans)
          </h3>
          <p className="text-xs text-on-surface-variant mt-1 max-w-2xl leading-relaxed">
            Hinterlegen Sie vordefinierte Tages-Arbeitsgruppen (+3 Std.), die von Mitarbeitern gewählt oder vom Admin zugewiesen werden.
            <span className="font-bold text-secondary ml-1">Keine Überschneidungen:</span> Jedes Objekt kann nur einer Gruppe zugewiesen werden.
          </p>
        </div>
        <button
          type="button"
          onClick={handleOpenCreateGroup}
          className="bg-secondary text-on-secondary flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold shadow-md hover:opacity-90 transition cursor-pointer shrink-0"
        >
          <Plus className="size-4" /> Neue Gruppe erstellen
        </button>
      </div>

      {/* Group Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {groups.map((group) => {
          const items = leafItems.filter((i) => group.assignedItemIds.includes(i.id));
          const totalMins = items.reduce((s, i) => s + i.estimatedMinutes, 0);

          return (
            <div
              key={group.id}
              className="group relative flex flex-col justify-between rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm hover:shadow-xl hover:border-secondary transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-extrabold text-sm shrink-0">
                      <Package className="size-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-on-surface group-hover:text-secondary transition-colors line-clamp-1">
                        {group.name}
                      </h4>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1.5 mt-0.5">
                        <Clock className="size-3.5 text-blue-600" />
                        <span className="font-bold text-on-surface">{totalMins} Min.</span> Gesamtdauer
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed bg-surface-container-low/50 p-3 rounded-2xl border border-outline-variant/40">
                  {group.description}
                </p>

                {/* Contained Items List */}
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider block">
                    Enthaltene Objekte ({items.length})
                  </span>
                  <div className="grid gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-2 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 flex items-center justify-between"
                      >
                        <span className="font-medium text-on-surface truncate">{item.name}</span>
                        <span className="text-[10px] font-bold text-on-surface-variant shrink-0">{item.estimatedMinutes}m</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-4 border-t border-outline-variant/60 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openGroupDrawer(group)}
                  className="flex-1 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-xl py-2 px-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Info className="size-3.5 text-secondary" /> Details
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditGroup(group)}
                  className="bg-secondary/10 hover:bg-secondary/20 text-secondary rounded-xl py-2 px-3 text-xs font-bold transition cursor-pointer"
                >
                  Anpassen
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteGroup(group.id, group.name)}
                  title="Gruppe löschen"
                  className="bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-xl p-2 text-xs font-bold transition cursor-pointer"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* GROUP BUILDER MODAL */}
      <ModalDialog
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        title={editingGroupId ? "Gruppe anpassen & bearbeiten" : "Neue Arbeitsgruppe erstellen"}
        subtitle="Wählen Sie ganze Bereiche oder einzelne Objekte aus. Bereits belegte Objekte sind gesperrt."
      >
        <div className="space-y-5">
          {/* Name Field */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-1.5">
              Gruppen-Bezeichnung
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="z.B. Gruppe 4 — Cardio & Eingang"
              className="w-full h-11 px-4 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:border-secondary outline-none transition"
            />
          </div>

          {/* Non-Overlap Summary Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
            <ShieldAlert className="size-5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-900 font-medium">
              Ausgewählt: <span className="font-bold">{selectedItemsForGroup.length} Objekte</span> (
              {leafItems.filter((i) => selectedItemsForGroup.includes(i.id)).reduce((s, i) => s + i.estimatedMinutes, 0)} Min.
              ). Objekte in anderen Gruppen sind mit <Lock className="inline size-3 text-amber-700" /> gesperrt.
            </p>
          </div>

          {/* Section Selection List */}
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {sections
              .filter((s) => s.parentSectionId === null)
              .map((mainSec) => {
                const subSecs = sections.filter((s) => s.parentSectionId === mainSec.id);
                const allSecItems = leafItems.filter((i) => i.sectionId === mainSec.id || subSecs.some((ss) => ss.id === i.sectionId));

                return (
                  <div key={mainSec.id} className="p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-on-surface flex items-center gap-2">
                        <Layers className="size-4 text-secondary" /> {mainSec.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleSectionItems(mainSec.id)}
                        className="text-xs font-bold text-secondary hover:underline cursor-pointer"
                      >
                        Ganzen Bereich wählen ({allSecItems.length})
                      </button>
                    </div>

                    {/* Items Grid */}
                    <div className="grid gap-1.5 pt-1">
                      {allSecItems.map((item) => {
                        const isSelected = selectedItemsForGroup.includes(item.id);
                        const assignedOther = assignedItemToGroupMap.get(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={() => !assignedOther && handleToggleSingleItem(item.id)}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition ${
                              assignedOther
                                ? "bg-surface-container/60 border-outline-variant/40 opacity-60 cursor-not-allowed"
                                : isSelected
                                ? "bg-secondary/15 border-secondary text-on-surface cursor-pointer"
                                : "bg-surface-container-lowest border-outline-variant/60 hover:border-secondary cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={Boolean(assignedOther)}
                                readOnly
                                className="rounded border-outline-variant text-secondary focus:ring-secondary size-4"
                              />
                              <span className="font-medium truncate">{item.name}</span>
                            </div>

                            {assignedOther ? (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                                <Lock className="size-3" /> {assignedOther.groupName}
                              </span>
                            ) : (
                              <span className="font-bold text-on-surface-variant shrink-0">{item.estimatedMinutes} Min.</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-outline-variant/60">
            <button
              type="button"
              onClick={() => setIsBuilderOpen(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-container transition cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleSaveGroup}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-secondary text-on-secondary shadow-md hover:opacity-90 transition cursor-pointer"
            >
              Gruppe Speichern
            </button>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
