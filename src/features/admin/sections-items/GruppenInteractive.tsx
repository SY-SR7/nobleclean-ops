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
import { exportToCSV, exportToPDF } from "@/lib/export-utils";
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

/**
  * Helper to build a 3-group plan that dynamically covers 100% of leaf items
  * with nearly equal time balance across the 3 groups.
  */
function buildBalanced3GroupPlan(
  planId: string,
  planName: string,
  planDesc: string,
  badge: string,
  groupSpecs: { name: string; description: string; filter: (text: string) => boolean }[],
  leafItems: readonly LeafItemListItem[],
  sections: readonly SectionTreeNode[]
): WorkPlan {
  const g1: string[] = [];
  const g2: string[] = [];
  const g3: string[] = [];

  leafItems.forEach((item) => {
    const sec = sections.find((s) => s.id === item.sectionId);
    const secName = (sec?.name || "").toLowerCase();
    const itemName = (item.name || "").toLowerCase();
    const text = `${secName} ${itemName}`;

    if (groupSpecs[0].filter(text)) {
      g1.push(item.id);
    } else if (groupSpecs[1].filter(text)) {
      g2.push(item.id);
    } else if (groupSpecs[2].filter(text)) {
      g3.push(item.id);
    } else {
      // Dynamic balance fallback for unassigned items:
      const getSum = (ids: string[]) =>
        ids.reduce((sum, id) => sum + (leafItems.find((l) => l.id === id)?.estimatedMinutes || 0), 0);
      const s1 = getSum(g1);
      const s2 = getSum(g2);
      const s3 = getSum(g3);

      if (s1 <= s2 && s1 <= s3) g1.push(item.id);
      else if (s2 <= s1 && s2 <= s3) g2.push(item.id);
      else g3.push(item.id);
    }
  });

  const calcMins = (itemIds: string[]) =>
    itemIds.reduce((sum, id) => {
      const found = leafItems.find((l) => l.id === id);
      return sum + (found?.estimatedMinutes || 0);
    }, 0);

  return {
    id: planId,
    name: planName,
    description: planDesc,
    badge,
    groups: [
      {
        id: `${planId}-g1`,
        name: groupSpecs[0].name,
        description: groupSpecs[0].description,
        targetMins: calcMins(g1) || 190,
        assignedItemIds: g1,
      },
      {
        id: `${planId}-g2`,
        name: groupSpecs[1].name,
        description: groupSpecs[1].description,
        targetMins: calcMins(g2) || 190,
        assignedItemIds: g2,
      },
      {
        id: `${planId}-g3`,
        name: groupSpecs[2].name,
        description: groupSpecs[2].description,
        targetMins: calcMins(g3) || 190,
        assignedItemIds: g3,
      },
    ],
  };
}

export function GruppenInteractive({ sections, leafItems }: GruppenInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();

  // Create initial 3-Group Plans (all 3 plans have 3 groups, equal time balance & 100% item coverage)
  const defaultPlans = useMemo(() => {
    const p1 = buildBalanced3GroupPlan(
      "plan-standard",
      "Standard-Tagesplan (Hauptplan)",
      "Standard 3-Gruppen Arbeitsplan für die tägliche Reinigung (ca. 3.0h pro Gruppe)",
      "Standard",
      [
        {
          name: "Gruppe 1 — Vorne, KidsClub, Herren Dusche, Mitte",
          description: "Vorne (Empfang), KidsClub, Herren Dusche & Cardio Mitte Bereich",
          filter: (t) => t.includes("vorne") || t.includes("kids") || t.includes("dusche") || t.includes("mitte") || t.includes("empfang") || t.includes("rezeption"),
        },
        {
          name: "Gruppe 2 — Hinten, Herren WC, Herren Umkleide, alle Wege mit Maschine",
          description: "Kraftbereich (Hinten), Herren WC, Herren Umkleide & Korridore mit Maschine",
          filter: (t) => t.includes("hinten") || t.includes("wc") || t.includes("umkleide") || t.includes("wege") || t.includes("korridor") || t.includes("kraft"),
        },
        {
          name: "Gruppe 3 — Frauen komplett, Wellness, Cyclingraum, Kursraum",
          description: "Frauenbereich komplett, Wellness & Sauna, Cyclingraum & Kursräume",
          filter: (t) => t.includes("frauen") || t.includes("damen") || t.includes("wellness") || t.includes("sauna") || t.includes("cycling") || t.includes("kursraum") || t.includes("studio"),
        },
      ],
      leafItems,
      sections
    );

    const p2 = buildBalanced3GroupPlan(
      "plan-wochenende",
      "Wochenend- & Spezialplan",
      "Gleichmäßige 3-Gruppen Aufteilung für das Wochenende",
      "Wochenende",
      [
        {
          name: "Gruppe 1 — Frühschicht (Empfang, Sanitär & Wellness)",
          description: "Frühbereich inklusive Rezeption, Sanitär und Wellnessbereich",
          filter: (t) => t.includes("empfang") || t.includes("vorne") || t.includes("sanitär") || t.includes("wellness") || t.includes("sauna"),
        },
        {
          name: "Gruppe 2 — Mittagschicht (Cardio, Kraft & Wege)",
          description: "Haupttrainingsbereich inklusive Cardio, Gewichte und Korridore",
          filter: (t) => t.includes("cardio") || t.includes("kraft") || t.includes("hinten") || t.includes("wege"),
        },
        {
          name: "Gruppe 3 — Spätschicht (Damen, Studios & KidsClub)",
          description: "Abendbereich inklusive Damenumkleiden, Studios und Kinderbereich",
          filter: (t) => t.includes("frauen") || t.includes("damen") || t.includes("kids") || t.includes("studio") || t.includes("cycling"),
        },
      ],
      leafItems,
      sections
    );

    const p3 = buildBalanced3GroupPlan(
      "plan-intensiv",
      "Intensiv- & Grundreinigungsplan",
      "Monatlicher 3-Gruppen Tiefenreinigungsplan für Sonderaufgaben",
      "Intensiv",
      [
        {
          name: "Gruppe A — Sanitär- & Nassbereich komplett",
          description: "Tiefenentkalkung aller Duschen, WCs und Wellness-Bänke",
          filter: (t) => t.includes("dusche") || t.includes("wc") || t.includes("sauna") || t.includes("wellness"),
        },
        {
          name: "Gruppe B — Trainingsgeräte & Freie Gewichte",
          description: "Intensivdesinfektion aller Hanteln, Bänke und Geräte-Konsolen",
          filter: (t) => t.includes("kraft") || t.includes("gewichte") || t.includes("cardio") || t.includes("geräte"),
        },
        {
          name: "Gruppe C — Böden, Flächen & Nebenräume",
          description: "Maschinelle Nassreinigung aller Hauptwege, Kurssäle und Empfang",
          filter: (t) => t.includes("wege") || t.includes("kurs") || t.includes("empfang") || t.includes("kids") || t.includes("umkleide"),
        },
      ],
      leafItems,
      sections
    );

    return [p1, p2, p3];
  }, [leafItems, sections]);

  const [plans, setPlans] = useState<WorkPlan[]>(defaultPlans);
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

  // Handle Plan Creation (Automatically builds 3 balanced groups covering 100% of items)
  const handleCreatePlan = () => {
    if (!newPlanName.trim()) {
      toast("Bitte geben Sie einen Plan-Namen ein!", "error");
      return;
    }

    const newPlanId = `plan-${Date.now()}`;
    const newPlan = buildBalanced3GroupPlan(
      newPlanId,
      newPlanName,
      newPlanDesc || "Benutzerdefinierter 3-Gruppen Arbeitsplan",
      "Neu",
      [
        {
          name: "Gruppe 1 — Bereich A",
          description: "Ausgewogene erste Arbeitsgruppe",
          filter: (t) => t.includes("vorne") || t.includes("kids") || t.includes("dusche") || t.includes("mitte"),
        },
        {
          name: "Gruppe 2 — Bereich B",
          description: "Ausgewogene zweite Arbeitsgruppe",
          filter: (t) => t.includes("hinten") || t.includes("wc") || t.includes("umkleide") || t.includes("wege"),
        },
        {
          name: "Gruppe 3 — Bereich C",
          description: "Ausgewogene dritte Arbeitsgruppe",
          filter: (t) => t.includes("frauen") || t.includes("wellness") || t.includes("cycling") || t.includes("kurs"),
        },
      ],
      leafItems,
      sections
    );

    setPlans((prev) => [...prev, newPlan]);
    setActivePlanId(newPlanId);
    setNewPlanName("");
    setNewPlanDesc("");
    setIsPlanModalOpen(false);
    toast(`Arbeitsplan "${newPlanName}" mit 3 ausgewogenen Gruppen erstellt!`, "success");
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
    if (activePlan.groups.length <= 3) {
      toast("Jeder Plan muss genau 3 Arbeitsgruppen enthalten!", "error");
    }
    if (confirm(`Möchten Sie die Gruppe "${groupName}" aus dem Plan wirklich löschen?`)) {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === activePlanId
            ? { ...p, groups: p.groups.filter((g) => g.id !== groupId) }
            : p
        )
      );
      toast("Gruppe gelöscht!", "success");
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

    toast(editingGroupId ? "Gruppe aktualisiert!" : "Gruppe gespeichert!", "success");
    setIsGroupBuilderOpen(false);
  };

  // Inspect Group Drawer
  const openGroupDrawer = (group: WorkGroup) => {
    const groupItems = leafItems.filter((i) => group.assignedItemIds.includes(i.id));
    const totalMins = groupItems.reduce((s, i) => s + i.estimatedMinutes, 0);

    const config: DrawerConfig = {
      title: group.name,
      subtitle: `${activePlan.name} · ${groupItems.length} Objekte · ${totalMins} Min. (ca. ${(totalMins / 60).toFixed(1)}h)`,
      icon: <Package className="size-6 text-secondary" />,
      accentColor: "secondary",
      badge: {
        label: `${(totalMins / 60).toFixed(1)} Std.`,
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
  const handleExportPlanExcel = () => {
    const headers = ["Plan Name", "Gruppe", "Gruppe Name", "Reinigungsobjekt / Aufgabe", "Geschätzte Dauer (Minuten)"];
    const rows: (string | number)[][] = [];

    activePlan.groups.forEach((g) => {
      const groupItems = leafItems.filter((i) => g.assignedItemIds.includes(i.id));
      groupItems.forEach((item) => {
        rows.push([activePlan.name, `Gruppe ${g.groupIndex}`, g.name, item.name, item.estimatedMinutes]);
      });
    });

    exportToCSV(`Nobleclean_Reinigungssplan_${activePlan.name.replace(/\s+/g, "_")}.csv`, headers, rows);
    toast(`Arbeitsplan "${activePlan.name}" als Excel (CSV) exportiert!`, "success");
  };

  const handleExportPlanPDF = () => {
    const headers = ["Gruppe", "Gruppe Name", "Reinigungsobjekt / Aufgabe", "Geschätzte Dauer"];
    const rows: (string | number)[][] = [];

    activePlan.groups.forEach((g) => {
      const groupItems = leafItems.filter((i) => g.assignedItemIds.includes(i.id));
      groupItems.forEach((item) => {
        rows.push([`Gruppe ${g.groupIndex}`, g.name, item.name, `${item.estimatedMinutes} Min.`]);
      });
    });

    exportToPDF(`Arbeitsplan: ${activePlan.name}`, activePlan.description, headers, rows, `Nobleclean_Plan_${activePlan.name}.pdf`);
  };

  return (
    <div className="grid gap-6">
      {/* Top Banner & Multi-Plan Tabs Header */}
      <div className="flex flex-col gap-4 border-b border-outline-variant/60 pb-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <span className="text-xs font-extrabold uppercase text-secondary tracking-wider flex items-center gap-1.5 mb-1">
              <Layers className="size-4" /> 3-Gruppen Arbeitspläne
            </span>
            <h3 className="text-xl font-extrabold text-on-surface">
              {activePlan.name}
            </h3>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {activePlan.description}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportPlanExcel}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 border border-emerald-500/20 px-3.5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Plan als Excel (CSV) exportieren"
            >
              <FileSpreadsheet className="size-4 text-emerald-600" /> Excel (.csv)
            </button>
            <button
              type="button"
              onClick={handleExportPlanPDF}
              className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-800 border border-blue-500/20 px-3.5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 transition cursor-pointer"
              title="Plan als PDF Bericht drucken"
            >
              <Printer className="size-4 text-blue-600" /> PDF Drucken
            </button>
            <button
              type="button"
              onClick={() => setIsPlanModalOpen(true)}
              className="bg-surface-container-low text-on-surface hover:bg-surface-container border border-outline-variant/70 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-sm"
            >
              <FolderPlus className="size-4 text-secondary" /> Neuer 3-Gruppen Plan
            </button>
            {plans.length > 1 && (
              <button
                type="button"
                onClick={() => handleDeletePlan(activePlan.id, activePlan.name)}
                className="p-2.5 rounded-xl text-red-600 hover:bg-red-500/10 border border-red-200 transition cursor-pointer"
                title="Plan löschen"
              >
                <Trash2 className="size-4" />
              </button>
            )}
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

      {/* PLAN DETAILS & 3 GROUPS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {activePlan.groups.map((group, idx) => {
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
                        {groupLeafs.length} Reinigungsobjekte (Gruppe {idx + 1})
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
                    <Clock className="size-3.5 text-secondary" /> Dauer (Soll ~3h):
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

      {/* CREATE NEW PLAN MODAL */}
      <ModalDialog
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title="Neuen 3-Gruppen Arbeitsplan anlegen"
        subtitle="Erstellt automatisch 3 gleichmäßig ausbalancierte Gruppen mit 100% Bereichsabdeckung."
      >
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-on-surface-variant block mb-1">
              Plan-Name (z.B. Sommer-Plan 2026 / Nacht-Plan)
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
              Dieser neue Plan erstellt <strong>automatisch 3 ausbalancierte Gruppen</strong> (ca. 3h pro Gruppe) und deckt <strong>100% aller physischen Bereiche</strong> ab!
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
              Plan erstellen (3 Gruppen)
            </button>
          </div>
        </div>
      </ModalDialog>

      {/* GROUP BUILDER & EDITOR MODAL */}
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
