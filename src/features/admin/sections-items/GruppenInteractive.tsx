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
  FolderPlus,
  FileSpreadsheet,
  Edit2,
} from "lucide-react";
import Image from "next/image";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
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

export type WorkPlan = {
  id: string;
  name: string;
  description: string;
  badge?: string;
  groups: WorkGroup[];
};

type GruppenInteractiveProps = Readonly<{
  sections: readonly SectionTreeNode[];
  leafItems: readonly LeafItemListItem[];
  copy: {
    minutes: string;
  };
}>;

export function GruppenInteractive({ sections, leafItems }: GruppenInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();

  // Dynamically map 100% of leaf items from DB to the 3 default groups for the Standard Plan
  const defaultGroupSet = useMemo(() => {
    const g1Items: string[] = [];
    const g2Items: string[] = [];
    const g3Items: string[] = [];

    leafItems.forEach((item) => {
      const sec = sections.find((s) => s.id === item.sectionId);
      const secName = (sec?.name || "").toLowerCase();
      const itemName = (item.name || "").toLowerCase();
      const text = `${secName} ${itemName}`;

      if (
        text.includes("vorne") ||
        text.includes("kids") ||
        text.includes("dusche") ||
        text.includes("mitte") ||
        text.includes("empfang") ||
        text.includes("rezeption")
      ) {
        g1Items.push(item.id);
      } else if (
        text.includes("hinten") ||
        text.includes("wc") ||
        text.includes("umkleide") ||
        text.includes("wege") ||
        text.includes("korridor") ||
        text.includes("kraft")
      ) {
        g2Items.push(item.id);
      } else if (
        text.includes("frauen") ||
        text.includes("damen") ||
        text.includes("wellness") ||
        text.includes("sauna") ||
        text.includes("cycling") ||
        text.includes("kursraum") ||
        text.includes("studio")
      ) {
        g3Items.push(item.id);
      } else {
        g1Items.push(item.id);
      }
    });

    const calcMins = (itemIds: string[]) =>
      itemIds.reduce((sum, id) => {
        const found = leafItems.find((l) => l.id === id);
        return sum + (found?.estimatedMinutes || 0);
      }, 0);

    return [
      {
        id: "group-1",
        name: "Gruppe 1 — Vorne, KidsClub, Herren Dusche, Mitte",
        description: "Vorne (Empfang), KidsClub, Herren Dusche & Cardio Mitte Bereich",
        targetMins: calcMins(g1Items) || 195,
        assignedItemIds: g1Items,
      },
      {
        id: "group-2",
        name: "Gruppe 2 — Hinten, Herren WC, Herren Umkleide, alle Wege mit Maschine",
        description: "Kraftbereich (Hinten), Herren WC, Herren Umkleide & Korridore mit Maschine",
        targetMins: calcMins(g2Items) || 190,
        assignedItemIds: g2Items,
      },
      {
        id: "group-3",
        name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum",
        description: "Frauenbereich komplett, Wellness & Sauna, Cyclingraum & Kursräume",
        targetMins: calcMins(g3Items) || 185,
        assignedItemIds: g3Items,
      },
    ];
  }, [leafItems, sections]);

  // Initial Multi-Plan state
  const [plans, setPlans] = useState<WorkPlan[]>(() => [
    {
      id: "plan-standard",
      name: "Standard-Tagesplan (Hauptplan)",
      description: "Standard 3-Gruppen Arbeitsplan für die tägliche Reinigung (3h pro Mitarbeiter)",
      badge: "Standard",
      groups: defaultGroupSet,
    },
    {
      id: "plan-wochenende",
      name: "Wochenend- & Spezialplan",
      description: "Unabhängiger Schichtplan für Wochenenden und Spezialreinigung",
      badge: "Wochenende",
      groups: [
        {
          id: "w-group-1",
          name: "Wochenend-Gruppe 1 — Frühbereich",
          description: "Frühschicht Reinigung (Empfang, Sanitär & Wellness)",
          targetMins: 180,
          assignedItemIds: defaultGroupSet[0]?.assignedItemIds || [],
        },
        {
          id: "w-group-2",
          name: "Wochenend-Gruppe 2 — Spätbereich",
          description: "Spätschicht Reinigung (Cardio, Kraft & Korridore)",
          targetMins: 210,
          assignedItemIds: defaultGroupSet[1]?.assignedItemIds || [],
        },
      ],
    },
    {
      id: "plan-intensiv",
      name: "Intensiv- & Grundreinigungsplan",
      description: "Monatlicher Tiefenreinigungsplan für Sonderaufgaben",
      badge: "Intensiv",
      groups: [
        {
          id: "i-group-1",
          name: "Intensiv-Gruppe A — Sanitär & Nassbereich",
          description: "Tiefenentkalkung und Grundreinigung aller Duschen & WCs",
          targetMins: 240,
          assignedItemIds: defaultGroupSet[2]?.assignedItemIds || [],
        },
      ],
    },
  ]);

  const [activePlanId, setActivePlanId] = useState<string>("plan-standard");

  // Plan creation modal
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanDesc, setNewPlanDesc] = useState("");

  // Group Builder State inside active plan
  const [isGroupBuilderOpen, setIsGroupBuilderOpen] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedItemsForGroup, setSelectedItemsForGroup] = useState<string[]>([]);

  // Get current active plan
  const activePlan = useMemo(() => {
    return plans.find((p) => p.id === activePlanId) || plans[0]!;
  }, [plans, activePlanId]);

  // Sync defaultGroupSet into standard plan if initial load had 0 items
  useMemo(() => {
    if (defaultGroupSet[0]?.assignedItemIds.length > 0) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === "plan-standard" && p.groups[0]?.assignedItemIds.length === 0
            ? { ...p, groups: defaultGroupSet }
            : p
        )
      );
    }
  }, [defaultGroupSet]);

  // Map leafItemId -> groupName strictly scoped WITHIN the ACTIVE PLAN
  const assignedItemToGroupMap = useMemo(() => {
    const map = new Map<string, { groupId: string; groupName: string }>();
    if (!activePlan) return map;

    activePlan.groups.forEach((g) => {
      // If currently editing this group, do not block its own items
      if (editingGroupId && g.id === editingGroupId) return;
      g.assignedItemIds.forEach((itemId) => {
        map.set(itemId, { groupId: g.id, groupName: g.name.split("—")[0].trim() });
      });
    });
    return map;
  }, [activePlan, editingGroupId]);

  // Handle Plan Creation
  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast("Bitte geben Sie einen Plan-Namen ein!", "error");
      return;
    }

    const newPlanId = `plan-${Date.now()}`;
    const newPlan: WorkPlan = {
      id: newPlanId,
      name: newPlanName,
      description: newPlanDesc || "Benutzerdefinierter Arbeitsplan",
      badge: "Neu",
      groups: [],
    };

    setPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newPlanId);
    setNewPlanName("");
    setNewPlanDesc("");
    setIsPlanModalOpen(false);
    toast(`Arbeitsplan "${newPlanName}" erfolgreich erstellt!`, "success");
  };

  // Delete Plan
  const handleDeletePlan = (planId: string, planName: string) => {
    if (plans.length <= 1) {
      toast("Es muss mindestens 1 Arbeitsplan im System verbleiben!", "error");
      return;
    }

    if (confirm(`Möchten Sie den Plan "${planName}" wirklich löschen?`)) {
      setPlans((prev) => prev.filter((p) => p.id !== planId));
      setActivePlanId(plans.find((p) => p.id !== planId)?.id || plans[0]!.id);
      toast("Arbeitsplan gelöscht!", "success");
    }
  };

  // Group Management within active plan
  const handleOpenCreateGroup = () => {
    setEditingGroupId(null);
    setNewGroupName(`Gruppe ${activePlan.groups.length + 1}`);
    setSelectedItemsForGroup([]);
    setIsGroupBuilderOpen(true);
  };

  const handleOpenEditGroup = (group: WorkGroup) => {
    setEditingGroupId(group.id);
    setNewGroupName(group.name);
    setSelectedItemsForGroup([...group.assignedItemIds]);
    setIsGroupBuilderOpen(true);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (confirm(`Möchten Sie die Gruppe "${groupName}" aus dem Plan wirklich löschen?`)) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === activePlanId
            ? { ...p, groups: p.groups.filter((g) => g.id !== groupId) }
            : p
        )
      );
      toast("Gruppe aus dem Plan gelöscht!", "success");
      setIsGroupBuilderOpen(false);
    }
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

    // Filter out items already assigned to OTHER groups IN THIS PLAN
    const availableSecItemIds = secItemIds.filter((id) => !assignedItemToGroupMap.has(id));

    if (availableSecItemIds.length === 0) {
      toast("Alle Objekte in diesem Bereich sind in diesem Plan bereits belegt!", "error");
      return;
    }

    const allSelected = availableSecItemIds.every((id) => selectedItemsForGroup.includes(id));

    if (allSelected) {
      setSelectedItemsForGroup((prev) => prev.filter((id) => !availableSecItemIds.includes(id)));
    } else {
      setSelectedItemsForGroup((prev) => Array.from(new Set([...prev, ...availableSecItemIds])));
    }
  };

  // Toggle single item
  const handleToggleSingleItem = (itemId: string) => {
    const currentGroup = assignedItemToGroupMap.get(itemId);
    if (currentGroup) {
      toast(`Dieses Objekt ist in diesem Plan bereits der ${currentGroup.groupName} zugewiesen!`, "error");
      return;
    }

    setSelectedItemsForGroup((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  // Save Group into Active Plan
  const handleSaveGroup = () => {
    if (!newGroupName.trim()) {
      toast("Bitte geben Sie einen Gruppen-Namen ein!", "error");
      return;
    }
    if (selectedItemsForGroup.length === 0) {
      toast("Bitte wählen Sie mindestens 1 Objekt für diese Gruppe aus!", "error");
      return;
    }

    const selectedObjList = leafItems.filter((i) => selectedItemsForGroup.includes(i.id));
    const totalTime = selectedObjList.reduce((sum, i) => sum + i.estimatedMinutes, 0);

    setPlans((prev) =>
      prev.map((p) => {
        if (p.id !== activePlanId) return p;

        let nextGroups: WorkGroup[];
        if (editingGroupId) {
          nextGroups = p.groups.map((g) =>
            g.id === editingGroupId
              ? { ...g, name: newGroupName, targetMins: totalTime, assignedItemIds: selectedItemsForGroup }
              : g
          );
        } else {
          const newGroup: WorkGroup = {
            id: `group-${Date.now()}`,
            name: newGroupName,
            description: `Gruppe in ${p.name} mit ${selectedItemsForGroup.length} Objekten`,
            targetMins: totalTime,
            assignedItemIds: selectedItemsForGroup,
          };
          nextGroups = [...p.groups, newGroup];
        }
        return { ...p, groups: nextGroups };
      })
    );

    toast(editingGroupId ? "Gruppe aktualisiert!" : "Neue Gruppe zum Plan hinzugefügt!", "success");
    setIsGroupBuilderOpen(false);
  };

  // Inspect Group Drawer
  const openGroupDrawer = (group: WorkGroup) => {
    const groupItems = leafItems.filter((i) => group.assignedItemIds.includes(i.id));
    const totalMins = groupItems.reduce((s, i) => s + i.estimatedMinutes, 0);

    const config: DrawerConfig = {
      title: group.name,
      subtitle: `${activePlan.name} · ${groupItems.length} Objekte · ${totalMins} Min. Gesamtdauer`,
      icon: <Package className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${(totalMins / 60).toFixed(1)} Stunden`,
        variant: totalMins >= 180 ? "success" : "warning",
      },
      kpis: [
        { label: "Objekte", value: groupItems.length, color: "text-emerald-600" },
        { label: "Gesamtdauer", value: `${totalMins}m`, color: "text-blue-600" },
        { label: "Plan", value: activePlan.name.split(" ")[0], color: "text-purple-600" },
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

  const activePlanTotalMins = useMemo(() => {
    return activePlan.groups.reduce((sum, g) => sum + g.targetMins, 0);
  }, [activePlan]);

  return (
    <div className="grid gap-6">
      {/* Top Banner & Multi-Plan Tabs Header */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary tracking-wider flex items-center gap-1.5 mb-1">
              <Layers className="size-4" /> Multi-Plan Arbeitsgruppen
            </span>
            <h3 className="text-xl font-extrabold text-on-surface">
              {activePlan.name}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {activePlan.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/70 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <FolderPlus className="size-4 text-secondary" /> Neuer Plan anlegen
            </button>
            <button
              type="button"
              onClick={handleOpenCreateGroup}
              className="bg-secondary text-on-secondary hover:opacity-90 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
            >
              <Plus className="size-4" /> Gruppe zu {activePlan.name.split(" ")[0]} hinzufügen
            </button>
          </div>
        </div>

        {/* PLAN SELECTOR TABS BAR */}
        <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
          {plans.map((plan) => {
            const isActive = plan.id === activePlanId;
            const planMins = plan.groups.reduce((s, g) => s + g.targetMins, 0);
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setActivePlanId(plan.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition cursor-pointer flex items-center gap-2.5 shrink-0 border ${
                  isActive
                    ? "bg-secondary text-on-secondary border-secondary shadow-md"
                    : "bg-surface-container-lowest text-on-surface-variant border-outline-variant/60 hover:bg-surface-container"
                }`}
              >
                <FileSpreadsheet className="size-4" />
                <span>{plan.name}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? "bg-on-secondary/20 text-on-secondary" : "bg-secondary/10 text-secondary"
                  }`}
                >
                  {plan.groups.length} Gruppen · {planMins}m
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* PLAN DETAILS & GROUPS GRID */}
      {activePlan.groups.length === 0 ? (
        <div className="p-8 rounded-3xl border border-dashed border-outline-variant text-center space-y-3 bg-surface-container-lowest">
          <Package className="size-10 text-on-surface-variant/40 mx-auto" />
          <h4 className="font-bold text-sm text-on-surface">
            Dieser Plan hat noch keine Arbeitsgruppen.
          </h4>
          <p className="text-xs text-on-surface-variant max-w-md mx-auto">
            Erstellen Sie die erste Gruppe für "{activePlan.name}" und weisen Sie Reinigungsobjekte aus den physischen Bereichten zu.
          </p>
          <button
            type="button"
            onClick={handleOpenCreateGroup}
            className="bg-secondary text-on-secondary px-4 py-2 rounded-xl text-xs font-bold shadow-sm inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="size-4" /> Erste Gruppe erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {activePlan.groups.map((group) => {
            const groupLeafs = leafItems.filter((i) => group.assignedItemIds.includes(i.id));
            const totalMins = groupLeafs.reduce((sum, i) => sum + i.estimatedMinutes, 0);

            return (
              <div
                key={group.id}
                className="group relative rounded-3xl border border-outline-variant/60 bg-surface-container-lowest p-5 shadow-sm hover:shadow-lg hover:border-secondary transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-11 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg shrink-0">
                        <Package className="size-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-on-surface group-hover:text-secondary transition-colors">
                          {group.name}
                        </h4>
                        <span className="text-[10px] text-on-surface-variant font-bold">
                          {groupLeafs.length} Reinigungsobjekte
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteGroup(group.id, group.name)}
                      className="p-2 rounded-xl text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                      title="Gruppe löschen"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  <p className="text-xs text-on-surface-variant line-clamp-2 mb-4">
                    {group.description}
                  </p>

                  {/* Items List Snippet */}
                  <div className="space-y-1.5 mb-4">
                    {groupLeafs.slice(0, 3).map((item) => (
                      <div
                        key={item.id}
                        className="text-xs p-2 rounded-xl bg-surface-container-low/70 border border-outline-variant/40 flex items-center justify-between"
                      >
                        <span className="font-semibold text-on-surface truncate pr-2">
                          {item.name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-bold shrink-0">
                          {item.estimatedMinutes}m
                        </span>
                      </div>
                    ))}
                    {groupLeafs.length > 3 && (
                      <p className="text-[10px] text-secondary font-bold text-center pt-1">
                        + {groupLeafs.length - 3} weitere Objekte
                      </p>
                    )}
                  </div>
                </div>

                {/* Footer KPI & Actions */}
                <div className="pt-3 border-t border-outline-variant/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-on-surface-variant flex items-center gap-1">
                      <Clock className="size-3.5 text-secondary" /> Gesamtdauer:
                    </span>
                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full">
                      {totalMins} Min. ({(totalMins / 60).toFixed(1)}h)
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => openGroupDrawer(group)}
                      className="w-full py-2 bg-surface-container-low text-on-surface hover:bg-surface-container font-bold text-xs rounded-xl transition cursor-pointer text-center"
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEditGroup(group)}
                      className="w-full py-2 bg-secondary text-on-secondary hover:opacity-90 font-bold text-xs rounded-xl transition cursor-pointer text-center flex items-center justify-center gap-1"
                    >
                      <Edit2 className="size-3" /> Bearbeiten
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE NEW PLAN MODAL */}
      <ModalDialog
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen}
        title="Neuen Arbeitsplan anlegen"
        subtitle="Erstellen Sie einen neuen unabhängigen Arbeitsplan mit eigenen Gruppen."
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
              Plan-Name (z.B. Sommerplan 2026 / Nachtschichtplan)
            </label>
            <input
              type="text"
              value={newPlanName}
              onChange={(e) => setNewPlanName(e.target.value)}
              placeholder="z.B. Spezial-Wochenendplan"
              className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none"
            />
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
              Beschreibung / Notizen
            </label>
            <textarea
              rows={3}
              value={newPlanDesc}
              onChange={(e) => setNewPlanDesc(e.target.value)}
              placeholder="Kurze Beschreibung des Verwendungszwecks..."
              className="w-full p-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-xs focus:border-secondary outline-none"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-secondary/10 border border-secondary/20 text-xs text-on-surface flex items-start gap-2.5">
            <Sparkles className="size-4 text-secondary shrink-0 mt-0.5" />
            <p>
              In diesem neuen Plan können Sie beliebige Reinigungsobjekte aus allen physischen Bereichen zuweisen, unabhängig von anderen Arbeitsplänen!
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleCreatePlan}
              className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold shadow-md hover:opacity-90 transition"
            >
              Plan erstellen
            </button>
          </div>
        </div>
      </ModalDialog>

      {/* GROUP BUILDER & EDITOR MODAL (Scoped to Active Plan) */}
      <ModalDialog
        isOpen={isGroupBuilderOpen}
        onClose={() => setIsGroupBuilderOpen(false)}
        title={editingGroupId ? `Gruppe bearbeiten (${activePlan.name})` : `Neue Gruppe zu ${activePlan.name} hinzufügen`}
        subtitle="Wählen Sie physische Bereiche oder einzelne Objekte aus, die dieser Gruppe in diesem Plan zugewiesen werden."
      >
        <div className="space-y-5">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
              Gruppen-Name
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="z.B. Gruppe 1 — Vorne & Sanitär"
              className="w-full h-11 px-3.5 rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface text-sm font-bold focus:border-secondary outline-none"
            />
          </div>

          {/* Section & Leaf Items Selection Tree */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block">
              Physische Bereiche & Reinigungsobjekte zuweisen ({selectedItemsForGroup.length} gewählt)
            </label>

            {sections
              .filter((s) => !s.parentSectionId)
              .map((mainSec) => {
                const subSecs = sections.filter((ss) => ss.parentSectionId === mainSec.id);
                const subSecIds = new Set([mainSec.id, ...subSecs.map((ss) => ss.id)]);
                const secItems = leafItems.filter((i) => subSecIds.has(i.sectionId));
                const secItemIds = secItems.map((i) => i.id);

                const availableSecItemIds = secItemIds.filter((id) => !assignedItemToGroupMap.has(id));
                const isFullySelected = availableSecItemIds.length > 0 && availableSecItemIds.every((id) => selectedItemsForGroup.includes(id));

                return (
                  <div key={mainSec.id} className="p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs text-on-surface">
                        {mainSec.name} ({secItems.length} Objekte)
                      </span>

                      <button
                        type="button"
                        onClick={() => handleToggleSectionItems(mainSec.id)}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition cursor-pointer ${
                          isFullySelected
                            ? "bg-secondary text-on-secondary border-secondary"
                            : "bg-surface-container-lowest text-secondary border-secondary/30 hover:bg-secondary/10"
                        }`}
                      >
                        {isFullySelected ? "✓ Ganzer Bereich gewählt" : "+ Ganzen Bereich wählen"}
                      </button>
                    </div>

                    {/* Leaf Items Checkboxes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-2">
                      {secItems.map((item) => {
                        const assignedToOther = assignedItemToGroupMap.get(item.id);
                        const isChecked = selectedItemsForGroup.includes(item.id);

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleToggleSingleItem(item.id)}
                            disabled={Boolean(assignedToOther)}
                            className={`p-2.5 rounded-xl border text-left text-xs transition cursor-pointer flex items-center justify-between ${
                              assignedToOther
                                ? "bg-surface-container/50 border-outline-variant/30 text-on-surface-variant/50 cursor-not-allowed"
                                : isChecked
                                ? "bg-secondary/15 border-secondary font-bold text-on-surface"
                                : "bg-surface-container-lowest border-outline-variant/50 hover:border-secondary text-on-surface"
                            }`}
                          >
                            <span className="truncate pr-1">{item.name}</span>
                            {assignedToOther ? (
                              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                in {assignedToOther.groupName}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-secondary">{item.estimatedMinutes}m</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/60">
            <span className="text-xs font-extrabold text-secondary">
              Gesamt: {leafItems.filter((i) => selectedItemsForGroup.includes(i.id)).reduce((s, i) => s + i.estimatedMinutes, 0)} Min.
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsGroupBuilderOpen(false)}
                className="px-4 py-2 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant hover:bg-surface-container transition"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveGroup}
                className="px-5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold shadow-md hover:opacity-90 transition"
              >
                {editingGroupId ? "Speichern" : "Gruppe hinzufügen"}
              </button>
            </div>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
}
