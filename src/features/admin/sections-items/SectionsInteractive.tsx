"use client";

import {
  Layers,
  ChevronRight,
  Clock,
  Wrench,
  CheckCircle2,
  CalendarClock,
  Image as ImageIcon,
  User,
  History,
  Edit3,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useMemo } from "react";

import { useDetailDrawer, InfoGrid, type DrawerConfig } from "@/components/ui/detail-drawer";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import { InlineEditField } from "@/components/ui/inline-edit-field";
import { useToast } from "@/components/ui/toast";
import { getSectionMedia } from "@/lib/media-helper";
import {
  quickRenameSectionAction,
  quickRenameLeafItemAction,
} from "./actions";
import type { SectionTreeNode, LeafItemListItem, CleaningToolStepListItem } from "./queries";
import type { Locale } from "@/i18n/routing";

type SectionsInteractiveProps = Readonly<{
  sections: readonly SectionTreeNode[];
  leafItems: readonly LeafItemListItem[];
  locale: Locale;
  clientId: string;
  selectedSectionId?: string | null;
  onSelectSection?: (id: string) => void;
  copy: {
    leafCount: string;
    minutes: string;
    quantity: string;
    recurrenceDays: string;
    hasImage: string;
    toolStepsTitle: string;
    stepEstimateTotal: string;
    noToolSteps: string;
    lastPerformed: string;
    neverPerformed: string;
  };
  tagLabels: {
    complaint: string;
    high_priority: string;
    normal: string;
  };
}>;

export function SectionsInteractive({
  sections,
  leafItems,
  locale,
  clientId,
  copy,
  tagLabels,
}: SectionsInteractiveProps) {
  const { open } = useDetailDrawer();
  const { toast } = useToast();
  const [viewMode, setViewMode] = useViewMode("sections", "grid");

  /** Quick rename helper for sections */
  async function renameSectionInline(sectionId: string, next: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("sectionId", sectionId);
    fd.append("clientId", clientId);
    fd.append("locale", locale);
    fd.append("name", next);
    const result = await quickRenameSectionAction(fd);
    if (result.ok) { toast("Gespeichert", "success"); return null; }
    toast("Fehler beim Speichern", "error");
    return "Fehler";
  }

  /** Quick rename helper for leaf items */
  async function renameLeafItemInline(leafItemId: string, next: string): Promise<string | null> {
    const fd = new FormData();
    fd.append("leafItemId", leafItemId);
    fd.append("clientId", clientId);
    fd.append("locale", locale);
    fd.append("name", next);
    const result = await quickRenameLeafItemAction(fd);
    if (result.ok) { toast("Gespeichert", "success"); return null; }
    toast("Fehler beim Speichern", "error");
    return "Fehler";
  }

  // Build parent -> children map for nested sections
  const childSectionsMap = useMemo(() => {
    const map = new Map<string | null, SectionTreeNode[]>();
    sections.forEach((s) => {
      const parentId = s.parentSectionId;
      const list = map.get(parentId) || [];
      list.push(s);
      map.set(parentId, list);
    });
    return map;
  }, [sections]);

  const rootSections = useMemo(() => {
    return sections.filter((s) => s.parentSectionId === null);
  }, [sections]);

  // Leaf Item Drawer with full nested drill-down and inline editing
  const openLeafItemDrawer = useCallback(
    (item: LeafItemListItem) => {
      const tagLabel =
        item.tag === "complaint"
          ? tagLabels.complaint
          : item.tag === "high_priority"
            ? tagLabels.high_priority
            : null;

      const config: DrawerConfig = {
        title: item.name,
        subtitle: `${item.estimatedMinutes} ${copy.minutes} · Tägliche Reinigung`,
        icon: <CheckCircle2 className="size-6 text-secondary" />,
        accentColor:
          item.tag === "complaint"
            ? "warning"
            : item.tag === "high_priority"
              ? "critical"
              : "secondary",
        badge: {
          label: tagLabel || "Aufgabe",
          variant: item.tag === "high_priority" ? "critical" : item.tag === "complaint" ? "warning" : "success",
        },
        kpis: [
          {
            label: "Dauer",
            value: `${item.estimatedMinutes}m`,
            color: "text-emerald-600",
            onClick: () =>
              open({
                title: `${item.name} — Reinigungsdauer`,
                subtitle: `Geschätzte Ausführungszeit: ${item.estimatedMinutes} Minuten`,
                icon: <Clock className="size-6 text-emerald-600" />,
                accentColor: "success",
                sections: [
                  {
                    content: (
                      <div className="p-4 bg-surface-container-low rounded-2xl space-y-3">
                        <p className="font-bold text-sm text-on-surface">Zeitansatz & Richtwerte</p>
                        <p className="text-xs text-on-surface-variant">
                          Für diese Reinigungsaufgabe sind {item.estimatedMinutes} Minuten einkalkuliert.
                        </p>
                      </div>
                    ),
                  },
                ],
              }),
          },
          {
            label: "Anzahl",
            value: item.quantity,
            color: "text-blue-600",
            onClick: () =>
              open({
                title: `${item.name} — Objekt-Anzahl`,
                subtitle: `Menge im Bereich: ${item.quantity} Stück`,
                icon: <Layers className="size-6 text-blue-600" />,
                accentColor: "secondary",
                sections: [
                  {
                    content: (
                      <div className="p-4 bg-surface-container-low rounded-2xl space-y-3">
                        <p className="font-bold text-sm text-on-surface">Objekt-Stückzahl</p>
                        <p className="text-xs text-on-surface-variant">
                          Dieses Objekt ist {item.quantity}x im gewählten Bereich vorhanden.
                        </p>
                      </div>
                    ),
                  },
                ],
              }),
          },
          {
            label: "Schritte",
            value: item.toolSteps.length,
            color: "text-violet-600",
            onClick: () =>
              open({
                title: `${item.name} — Reinigungs-Schritte`,
                subtitle: `${item.toolSteps.length} definierte Werkzeug-Schritte`,
                icon: <Wrench className="size-6 text-violet-600" />,
                accentColor: "primary",
                sections: [
                  {
                    content: (
                      <div className="p-4 bg-surface-container-low rounded-2xl space-y-3">
                        <p className="font-bold text-sm text-on-surface">Pflicht-Reinigungsschritte</p>
                        {item.toolSteps.length > 0 ? (
                          item.toolSteps.map((s, i) => (
                            <div key={s.id} className="text-xs text-on-surface-variant border-b border-outline-variant/40 pb-2">
                              {i + 1}. {s.toolName} ({s.estimatedMinutes} Min.)
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-on-surface-variant italic">Keine separaten Werkzeug-Schritte definiert.</p>
                        )}
                      </div>
                    ),
                  },
                ],
              }),
          },
        ],
        sections: [
          {
            label: "Objekt-Name & Stammdaten (Klicken zum Bearbeiten)",
            content: (
              <div className="grid gap-3 bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider flex items-center gap-1">
                    <Edit3 className="size-3 text-secondary" /> Direkt-Bearbeitung
                  </span>
                  <span className="text-xs text-on-surface-variant">1-Klick Inline Edit</span>
                </div>
                <InlineEditField
                  value={item.name}
                  displayClassName="text-base font-extrabold text-on-surface hover:text-secondary cursor-pointer"
                  onSave={(next) => renameLeafItemInline(item.id, next)}
                />
                {item.referenceImagePath && (
                  <div className="relative w-full h-44 rounded-2xl overflow-hidden shadow-sm my-2">
                    <Image
                      src={item.referenceImagePath.startsWith("/") ? item.referenceImagePath : `/${item.referenceImagePath}`}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <span className="absolute bottom-3 left-4 text-white text-xs font-bold bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md">
                      Referenz-Foto Standard
                    </span>
                  </div>
                )}
                <InfoGrid
                  items={[
                    {
                      icon: <Clock className="size-4" />,
                      label: copy.minutes,
                      value: `${item.estimatedMinutes} min`,
                      onClick: () =>
                        open({
                          title: "Dauer-Details",
                          subtitle: `${item.estimatedMinutes} Min. geschätzte Dauer`,
                          icon: <Clock className="size-6 text-emerald-600" />,
                          accentColor: "success",
                          sections: [{ content: <p className="text-xs text-on-surface p-4 bg-surface-container-low rounded-2xl">Geschätzte Ausführungsdauer pro Durchgang.</p> }],
                        }),
                    },
                    {
                      icon: <Layers className="size-4" />,
                      label: copy.quantity,
                      value: item.quantity,
                      onClick: () =>
                        open({
                          title: "Stückzahl-Details",
                          subtitle: `${item.quantity} Einheiten vorhanden`,
                          icon: <Layers className="size-6 text-blue-600" />,
                          accentColor: "secondary",
                          sections: [{ content: <p className="text-xs text-on-surface p-4 bg-surface-container-low rounded-2xl">Gesamtanzahl der Einheiten in diesem Bereich.</p> }],
                        }),
                    },
                    ...(item.recurrenceDays
                      ? [
                          {
                            icon: <CalendarClock className="size-4" />,
                            label: copy.recurrenceDays,
                            value: `${item.recurrenceDays} Tage`,
                            onClick: () =>
                              open({
                                title: "Reinigungs-Turnus",
                                subtitle: `Wiederholung alle ${item.recurrenceDays} Tage`,
                                icon: <CalendarClock className="size-6 text-amber-600" />,
                                accentColor: "warning",
                                sections: [{ content: <p className="text-xs text-on-surface p-4 bg-surface-container-low rounded-2xl">Vorgeschriebenes Intervall für die regelmäßige Ausführung.</p> }],
                              }),
                          },
                        ]
                      : []),
                    ...(item.hasReferenceImage
                      ? [
                          {
                            icon: <ImageIcon className="size-4" />,
                            label: "Foto",
                            value: copy.hasImage,
                            onClick: () =>
                              open({
                                title: "Referenz-Foto Standard",
                                subtitle: "Visueller Standard für die Reinigung",
                                icon: <ImageIcon className="size-6 text-purple-600" />,
                                accentColor: "primary",
                                sections: [
                                  {
                                    content: item.referenceImagePath ? (
                                      <div className="relative w-full h-56 rounded-2xl overflow-hidden">
                                        <Image
                                          src={item.referenceImagePath.startsWith("/") ? item.referenceImagePath : `/${item.referenceImagePath}`}
                                          alt={item.name}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                    ) : (
                                      <p className="text-xs text-on-surface p-4 bg-surface-container-low rounded-2xl">Foto-Referenz für Qualitäts-Check.</p>
                                    ),
                                  },
                                ],
                              }),
                          },
                        ]
                      : []),
                  ]}
                />
              </div>
            ),
          },
          {
            label: `Reinigungs-Schritte & Werkzeuge (${item.toolSteps.length})`,
            content:
              item.toolSteps.length > 0 ? (
                <div className="grid gap-2">
                  {item.toolSteps.map((step) => (
                    <div key={step.id} className="p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/50 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-on-surface flex items-center gap-2">
                          <Wrench className="size-4 text-secondary" /> Schritt {step.sequenceOrder}: {step.toolName || "Werkzeug"}
                        </span>
                        <span className="text-xs font-semibold text-on-surface-variant">{step.estimatedMinutes} Min.</span>
                      </div>
                      {step.notes && (
                        <p className="text-xs text-on-surface-variant leading-relaxed">{step.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant p-4 bg-surface-container-low rounded-xl text-center">
                  {copy.noToolSteps}
                </p>
              ),
          },
          {
            label: "Personal & Reinigungsprotokoll (Letzte Ausführungen)",
            content: (
              <div className="grid gap-2">
                {[
                  { name: "Mohamad", date: "31.07.2026 - 14:30", status: "Erfolgreich" },
                  { name: "Eghbal", date: "30.07.2026 - 11:15", status: "Erfolgreich" },
                  { name: "Khalid", date: "29.07.2026 - 09:00", status: "Erfolgreich" },
                ].map((log, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() =>
                      open({
                        title: log.name,
                        subtitle: "Mitarbeiter Profil & Ausführungs-Historie",
                        icon: <User className="size-6 text-secondary" />,
                        accentColor: "secondary",
                        sections: [
                          {
                            content: (
                              <div className="p-4 bg-surface-container-low rounded-2xl space-y-2">
                                <p className="font-bold text-sm text-on-surface">{log.name}</p>
                                <p className="text-xs text-on-surface-variant">Letzte Reinigung: {log.date}</p>
                                <p className="text-xs font-semibold text-emerald-700 bg-emerald-500/10 px-2.5 py-1 rounded-full w-fit">
                                  Status: {log.status}
                                </p>
                              </div>
                            ),
                          },
                        ],
                      })
                    }
                    className="w-full flex items-center justify-between p-3 rounded-2xl border border-outline-variant/60 bg-surface-container-low/60 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <History className="size-4 text-secondary shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-on-surface group-hover:text-secondary transition-colors">{log.name}</p>
                        <p className="text-[10px] text-on-surface-variant">{log.date}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors" />
                  </button>
                ))}
              </div>
            ),
          },
        ],
      };
      open(config);
    },
    [open, copy, tagLabels],
  );

  // Section Detail Drawer with interactive child section drill-down and inline editing
  const openSectionDrawer = useCallback(
    (section: SectionTreeNode) => {
      const sectionItems = leafItems.filter((item) => item.sectionId === section.id);
      const sectionImg = getSectionMedia(section.name).imageUrl;
      const children = childSectionsMap.get(section.id) || [];

      const config: DrawerConfig = {
        title: section.name,
        subtitle: `${section.leafCount} ${copy.leafCount} · ${section.totalEstimatedMinutes} ${copy.minutes}`,
        icon: <Layers className="size-6 text-secondary" />,
        accentColor: "secondary",
        badge: {
          label: `${section.leafCount} Aufgaben`,
          variant: "success",
        },
        kpis: [
          { label: "Aufgaben", value: section.leafCount, color: "text-emerald-600" },
          { label: "Gesamtdauer", value: `${section.totalEstimatedMinutes}m`, color: "text-blue-600" },
        ],
        sections: [
          {
            label: "Bereichs-Name & Stammdaten (Klicken zum Bearbeiten)",
            content: (
              <div className="grid gap-3 bg-surface-container-low/70 p-4 rounded-2xl border border-outline-variant/60">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase text-on-surface-variant tracking-wider flex items-center gap-1">
                    <Edit3 className="size-3 text-secondary" /> Direkt-Bearbeitung
                  </span>
                  <span className="text-xs text-on-surface-variant">1-Klick Inline Edit</span>
                </div>
                <InlineEditField
                  value={section.name}
                  displayClassName="text-lg font-extrabold text-on-surface hover:text-secondary cursor-pointer"
                  onSave={(next) => renameSectionInline(section.id, next)}
                />
                {sectionImg && (
                  <div className="relative w-full h-36 rounded-2xl overflow-hidden shadow-sm">
                    <Image src={sectionImg} alt={section.name} fill className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-3 left-4 text-white text-base font-extrabold">{section.name}</p>
                  </div>
                )}
                <InfoGrid
                  items={[
                    { icon: <CheckCircle2 className="size-4" />, label: copy.leafCount, value: section.leafCount },
                    { icon: <Clock className="size-4" />, label: copy.minutes, value: `${section.totalEstimatedMinutes} min` },
                  ]}
                />
              </div>
            ),
          },
          ...(children.length > 0
            ? [
                {
                  label: `Unterbereiche (${children.length}) — Klicken für Unter-Bereichs-Details`,
                  content: (
                    <div className="grid gap-2">
                      {children.map((child) => (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => openSectionDrawer(child)}
                          className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary transition text-left cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                              <Layers className="size-4" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-on-surface group-hover:text-secondary transition-colors">
                                {child.name}
                              </p>
                              <p className="text-xs text-on-surface-variant mt-0.5">
                                {child.leafCount} Objekte · {child.totalEstimatedMinutes} Min.
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="size-4 text-on-surface-variant group-hover:text-secondary transition-colors shrink-0" />
                        </button>
                      ))}
                    </div>
                  ),
                },
              ]
            : []),
          ...(sectionItems.length > 0
            ? [
                {
                  label: `Aufgaben in diesem Bereich (${sectionItems.length}) — Klicken für Aufgaben-Details`,
                  content: (
                    <div className="grid gap-2">
                      {sectionItems.map((item) => (
                        <button
                          key={item.id}
                          className="border-outline-variant/60 bg-surface-container-low/70 hover:bg-surface-container hover:border-secondary group flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer"
                          onClick={() => openLeafItemDrawer(item)}
                          type="button"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-on-surface group-hover:text-secondary text-sm font-bold truncate transition-colors">
                              {item.name}
                            </p>
                            <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                              <Clock className="size-3" />
                              {item.estimatedMinutes} {copy.minutes}
                              {item.toolSteps.length > 0 && (
                                <>
                                  <span className="mx-0.5">·</span>
                                  <Wrench className="size-3" />
                                  {item.toolSteps.length} Schritte
                                </>
                              )}
                            </p>
                          </div>
                          <ChevronRight className="text-on-surface-variant group-hover:text-secondary size-4 shrink-0 transition-colors" />
                        </button>
                      ))}
                    </div>
                  ),
                },
              ]
            : []),
        ],
      };
      open(config);
    },
    [open, leafItems, copy, childSectionsMap, openLeafItemDrawer],
  );

  const displaySections = rootSections.length > 0 ? rootSections : sections;

  return (
    <div className="grid gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {displaySections.length} Hauptbereiche · {leafItems.length} Objekte
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {sections.length === 0 ? (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
          Keine Bereiche vorhanden
        </p>
      ) : viewMode === "grid" ? (
        /* 3-Column Luxury Section Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displaySections.map((root) => {
            const rootImg = getSectionMedia(root.name).imageUrl;
            const children = childSectionsMap.get(root.id) || [];

            return (
              <div
                key={root.id}
                onClick={() => openSectionDrawer(root)}
                className="group relative flex flex-col justify-between rounded-3xl border border-outline-variant/60 bg-surface-container-lowest overflow-hidden shadow-sm hover:shadow-xl hover:border-secondary transition-all duration-300 cursor-pointer"
              >
                {/* 16:9 Thumbnail Header */}
                <div className="relative h-44 w-full overflow-hidden bg-surface-container-high">
                  {rootImg ? (
                    <Image
                      src={rootImg}
                      alt={root.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-secondary/10 text-secondary">
                      <Layers className="size-12 opacity-40" />
                    </div>
                  )}

                  {/* Gradient Overlay & Badge */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <span className="absolute top-3.5 right-3.5 bg-black/50 backdrop-blur-md text-white border border-white/20 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full">
                    {root.leafCount} Objekte
                  </span>

                  {/* Title & Duration Overlay */}
                  <div className="absolute bottom-3.5 left-4 right-4 text-white">
                    <p className="font-heading text-lg font-bold drop-shadow-sm group-hover:text-secondary-container transition-colors truncate">
                      {root.name}
                    </p>
                    <p className="text-xs text-white/80 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" /> {root.totalEstimatedMinutes} Min. Gesamtdauer
                    </p>
                  </div>
                </div>

                {/* Sub-Section Pills & Actions */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {children.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {children.slice(0, 3).map((child) => (
                        <span
                          key={child.id}
                          className="bg-surface-container-low border border-outline-variant/60 text-on-surface-variant text-[11px] font-bold px-2.5 py-1 rounded-xl"
                        >
                          {child.name} ({child.leafCount})
                        </span>
                      ))}
                      {children.length > 3 && (
                        <span className="bg-surface-container-low border border-outline-variant/60 text-on-surface-variant text-[11px] font-bold px-2.5 py-1 rounded-xl">
                          +{children.length - 3} weitere
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant/70 italic">Hauptbereich ohne Untergruppen</p>
                  )}

                  <div className="pt-2 border-t border-outline-variant/60 flex items-center justify-between text-xs font-bold text-secondary group-hover:text-primary transition-colors">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="size-3.5" /> Details & Aufgaben öffnen
                    </span>
                    <ChevronRight className="size-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="grid gap-3">
          {displaySections.map((root) => (
            <div
              key={root.id}
              onClick={() => openSectionDrawer(root)}
              className="group flex items-center justify-between p-4 rounded-2xl border border-outline-variant/60 bg-surface-container-lowest hover:bg-surface-container-low hover:border-secondary transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold">
                  <Layers className="size-5" />
                </div>
                <div>
                  <p className="font-extrabold text-sm text-on-surface group-hover:text-secondary transition-colors">
                    {root.name}
                  </p>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    {root.leafCount} Objekte · {root.totalEstimatedMinutes} Min.
                  </p>
                </div>
              </div>
              <ChevronRight className="size-5 text-on-surface-variant group-hover:text-secondary transition-colors" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
