"use client";

import {
  Clock,
  Home,
  Layers,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  Wrench,
  CalendarClock,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig, InfoGrid } from "@/components/ui/detail-drawer";
import { InlineEditField, useToast } from "@/components/ui";
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
import {
  quickRenameSectionAction,
  quickRenameLeafItemAction,
} from "./actions";
import type {
  SectionTreeNode,
  LeafItemListItem,
  CleaningToolStepListItem,
} from "./queries";
import type { Locale } from "@/i18n/routing";

type SectionsInteractiveProps = Readonly<{
  sections: readonly SectionTreeNode[];
  leafItems: readonly LeafItemListItem[];
  locale: Locale;
  clientId: string;
  selectedSectionId: string | null;
  onSelectSection?: (sectionId: string) => void;
  copy: {
    minutes: string;
    leafCount: string;
    lastPerformed: string;
    neverPerformed: string;
    recurrenceDays: string;
    optional: string;
    quantity: string;
    toolStepsTitle: string;
    stepEstimateTotal: string;
    hasImage: string;
    noToolSteps: string;
  };
  tagLabels: {
    normal: string;
    complaint: string;
    high_priority: string;
  };
}>;

/** Maps section name keywords to a section image path */
function getSectionImage(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes("cardio") || n.includes("ausdauer") || n.includes("cycling")) return "/images/sections/cardio.jpg";
  if (n.includes("eingang") || n.includes("entrance") || n.includes("lobby") || n.includes("empfang")) return "/images/sections/entrance.jpg";
  if (n.includes("sanitar") || n.includes("sanitär") || n.includes("toilette") || n.includes("wc") || n.includes("dusche") || n.includes("umkleide")) return "/images/sections/sanitary.jpg";
  if (n.includes("sauna") || n.includes("dampf") || n.includes("wellness")) return "/images/sections/sauna.jpg";
  if (n.includes("kraft") || n.includes("weight") || n.includes("gym") || n.includes("freih") || n.includes("gerät")) return "/images/sections/strength.jpg";
  // fallback — cycle through available images based on name hash
  const images = ["/images/sections/entrance.jpg", "/images/sections/strength.jpg", "/images/sections/cardio.jpg", "/images/sections/sanitary.jpg", "/images/sections/sauna.jpg"];
  const hash = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return images[hash % images.length];
}

/** Maps tool name keywords to a tool image */
function getToolImage(toolName: string): string | null {
  const n = toolName.toLowerCase();
  if (n.includes("mopp") || n.includes("mop") || n.includes("wischer") || n.includes("wischm")) return "/images/tools/mop.jpg";
  if (n.includes("schrubb") || n.includes("bürst") || n.includes("scrub")) return "/images/tools/scrubber.jpg";
  if (n.includes("desinfekt") || n.includes("reiniger") || n.includes("spray") || n.includes("mittel")) return "/images/tools/disinfectant.jpg";
  return null;
}

function formatTimestamp(value: string | null, locale: Locale, fallback: string) {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

type BreadcrumbStep = Readonly<{ id: string; name: string }>;

function buildBreadcrumb(
  sections: readonly SectionTreeNode[],
  selectedId: string | null,
): readonly BreadcrumbStep[] {
  if (!selectedId) return [];
  const byId = new Map(sections.map((s) => [s.id, s]));
  const path: BreadcrumbStep[] = [];
  let current = byId.get(selectedId);
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    current = current.parentSectionId ? byId.get(current.parentSectionId) : undefined;
  }
  return path;
}

function SectionBreadcrumb({
  sections,
  selectedSectionId,
  onSelectSection,
}: Readonly<{
  sections: readonly SectionTreeNode[];
  selectedSectionId: string | null;
  onSelectSection?: (id: string) => void;
}>) {
  const crumbs = buildBreadcrumb(sections, selectedSectionId);
  if (crumbs.length <= 1) return null;

  return (
    <nav className="flex items-center gap-1 flex-wrap text-xs font-semibold mb-1">
      <button
        type="button"
        className="inline-flex items-center gap-1 text-on-surface-variant hover:text-secondary transition-colors"
        onClick={() => onSelectSection?.(sections.find((s) => s.parentSectionId === null)?.id ?? "")}
      >
        <Home className="size-3" />
        <span>Root</span>
      </button>
      {crumbs.map((crumb, i) => (
        <span key={crumb.id} className="inline-flex items-center gap-1">
          <ChevronRight className="size-3 text-on-surface-variant/40" />
          {i === crumbs.length - 1 ? (
            <span className="text-secondary">{crumb.name}</span>
          ) : (
            <button
              type="button"
              className="text-on-surface-variant hover:text-secondary transition-colors"
              onClick={() => onSelectSection?.(crumb.id)}
            >
              {crumb.name}
            </button>
          )}
        </span>
      ))}
    </nav>
  );
}

function ToolStepDetail({
  step,
  locale,
  copy,
}: {
  step: CleaningToolStepListItem;
  locale: Locale;
  copy: { minutes: string; lastPerformed: string; neverPerformed: string; recurrenceDays: string };
}) {
  const toolImg = getToolImage(step.toolName);
  return (
    <div className="border-outline-variant bg-surface-container rounded-xl border p-3 flex gap-3 items-start">
      <div className="relative h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-surface-container-highest">
        {toolImg ? (
          <Image src={toolImg} alt={step.toolName} fill className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-secondary/10 text-secondary font-bold text-sm">
            {step.sequenceOrder}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-on-surface text-sm font-semibold truncate">{step.toolName}</p>
          {step.isMandatory ? (
            <CheckCircle2 className="text-status-success size-3.5 shrink-0" />
          ) : (
            <Circle className="text-on-surface-variant size-3.5 shrink-0" />
          )}
        </div>
        <p className="text-on-surface-variant text-xs mt-0.5 flex items-center gap-1">
          <Clock className="size-3" />
          {step.estimatedMinutes} {copy.minutes}
          {" · "}
          {copy.lastPerformed}:{" "}
          {formatTimestamp(step.lastPerformedAt, locale, copy.neverPerformed)}
        </p>
        {step.notes && (
          <p className="text-on-surface-variant text-xs mt-1 italic">{step.notes}</p>
        )}
      </div>
    </div>
  );
}

export function SectionsInteractive({
  sections,
  leafItems,
  locale,
  clientId,
  selectedSectionId,
  onSelectSection,
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
        subtitle: `${item.estimatedMinutes} ${copy.minutes}`,
        icon: <CheckCircle2 className="size-6" />,
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
          { label: "Dauer", value: `${item.estimatedMinutes}m`, color: "text-emerald-600" },
          { label: "Anzahl", value: item.quantity, color: "text-blue-600" },
          { label: "Schritte", value: item.toolSteps.length, color: "text-violet-600" },
        ],
        sections: [
          {
            label: "Details",
            content: (
              <div className="grid gap-3">
                <InfoGrid
                  items={[
                    { icon: <Clock className="size-4" />, label: copy.minutes, value: `${item.estimatedMinutes} min` },
                    { icon: <Layers className="size-4" />, label: copy.quantity, value: item.quantity },
                    ...(item.recurrenceDays ? [{ icon: <CalendarClock className="size-4" />, label: copy.recurrenceDays, value: `${item.recurrenceDays} Tage` }] : []),
                    ...(item.hasReferenceImage ? [{ icon: <ImageIcon className="size-4" />, label: "Foto", value: copy.hasImage }] : []),
                  ]}
                />
                {item.notes && (
                  <p className="text-on-surface-variant border-outline-variant rounded-xl border p-3.5 text-sm italic">{item.notes}</p>
                )}
              </div>
            ),
          },
          {
            label: `${copy.toolStepsTitle} (${item.toolSteps.length})`,
            content:
              item.toolSteps.length > 0 ? (
                <div className="grid gap-2">
                  {item.toolSteps.map((step) => (
                    <ToolStepDetail
                      key={step.id}
                      step={step}
                      locale={locale}
                      copy={{
                        minutes: copy.minutes,
                        lastPerformed: copy.lastPerformed,
                        neverPerformed: copy.neverPerformed,
                        recurrenceDays: copy.recurrenceDays,
                      }}
                    />
                  ))}
                  <div className="text-on-surface-variant border-outline-variant rounded-xl border px-3.5 py-2.5 text-xs">
                    {copy.stepEstimateTotal}: <strong>{item.stepEstimateMinutes} {copy.minutes}</strong>
                  </div>
                </div>
              ) : (
                <p className="text-on-surface-variant text-sm">{copy.noToolSteps}</p>
              ),
          },
        ],
      };
      open(config);
    },
    [open, copy, locale, tagLabels],
  );

  const openSectionDrawer = useCallback(
    (section: SectionTreeNode) => {
      const sectionItems = leafItems.filter((item) => item.sectionId === section.id);
      const sectionImg = getSectionImage(section.name);

      const config: DrawerConfig = {
        title: section.name,
        subtitle: `${section.leafCount} ${copy.leafCount} · ${section.totalEstimatedMinutes} ${copy.minutes}`,
        icon: <Layers className="size-6" />,
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
            label: "Überblick",
            content: (
              <div className="grid gap-3">
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
          ...(sectionItems.length > 0
            ? [
                {
                  label: `Aufgaben (${sectionItems.length})`,
                  content: (
                    <div className="grid gap-2">
                      {sectionItems.map((item) => (
                        <button
                          key={item.id}
                          className="border-outline-variant hover:bg-surface-container group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors cursor-pointer"
                          onClick={() => openLeafItemDrawer(item)}
                          type="button"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-on-surface group-hover:text-secondary text-sm font-medium truncate transition-colors">{item.name}</p>
                            <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                              <Clock className="size-3" />
                              {item.estimatedMinutes} {copy.minutes}
                              {item.toolSteps.length > 0 && (
                                <><span className="mx-0.5">·</span><Wrench className="size-3" />{item.toolSteps.length}</>
                              )}
                            </p>
                          </div>
                          <ChevronRight className="text-on-surface-variant size-4 shrink-0" />
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
    [open, leafItems, copy, locale, openLeafItemDrawer],
  );

  return (
    <div className="grid gap-4">
      {/* Breadcrumb */}
      <SectionBreadcrumb
        sections={sections}
        selectedSectionId={selectedSectionId}
        onSelectSection={onSelectSection}
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {sections.length} Bereich{sections.length !== 1 ? "e" : ""}
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        /* ── Grid View: root sections with their children grouped below ── */
        <div className="grid gap-6">
          {sections
            .filter((s) => s.parentSectionId === null)
            .map((root) => {
              const children = sections.filter((s) => s.parentSectionId === root.id);
              const isRootSelected = root.id === selectedSectionId;
              const rootImg = getSectionImage(root.name);
              return (
                <div key={root.id} className="grid gap-2">
                  {/* Root card */}
                  <button
                    type="button"
                    className={[
                      "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer",
                      isRootSelected
                        ? "border-secondary ring-2 ring-secondary/30"
                        : "border-outline-variant hover:border-secondary",
                    ].join(" ")}
                    onClick={() => {
                      if (onSelectSection) onSelectSection(root.id);
                      openSectionDrawer(root);
                    }}
                  >
                    <div className="relative h-36 w-full overflow-hidden bg-surface-container">
                      {rootImg && (
                        <Image
                          src={rootImg}
                          alt={root.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      {root.hasReferenceImage && (
                        <div className="absolute top-2 right-2 bg-secondary/80 text-on-secondary rounded-full p-1 backdrop-blur-sm">
                          <ImageIcon className="size-3" />
                        </div>
                      )}
                      <p className="absolute bottom-3 left-4 text-white text-base font-extrabold drop-shadow">{root.name}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-surface-container-lowest">
                      <div className="flex items-center gap-3">
                        <span className="text-on-surface-variant text-xs flex items-center gap-1">
                          <CheckCircle2 className="size-3" />
                          {root.leafCount} {copy.leafCount}
                        </span>
                        <span className="text-on-surface-variant text-xs flex items-center gap-1">
                          <Clock className="size-3" />
                          {root.totalEstimatedMinutes} {copy.minutes}
                        </span>
                      </div>
                      {children.length > 0 && (
                        <span className="text-on-surface-variant text-xs">
                          {children.length} Unterbereiche
                        </span>
                      )}
                    </div>
                    <div className={["h-1 transition-colors", isRootSelected ? "bg-secondary" : "bg-surface-container group-hover:bg-secondary/60"].join(" ")} />
                  </button>

                  {/* Children sub-grid */}
                  {children.length > 0 && (
                    <div className="ml-4 pl-3 border-l-2 border-secondary/20 grid gap-2 sm:grid-cols-2">
                      {children.map((child) => {
                        const isChildSelected = child.id === selectedSectionId;
                        const childImg = getSectionImage(child.name);
                        return (
                          <button
                            key={child.id}
                            type="button"
                            className={[
                              "group flex flex-col overflow-hidden rounded-xl border text-left shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                              isChildSelected
                                ? "border-secondary ring-2 ring-secondary/20"
                                : "border-outline-variant hover:border-secondary",
                            ].join(" ")}
                            onClick={() => {
                              if (onSelectSection) onSelectSection(child.id);
                              openSectionDrawer(child);
                            }}
                          >
                            <div className="relative h-24 w-full overflow-hidden bg-surface-container">
                              {childImg && (
                                <Image
                                  src={childImg}
                                  alt={child.name}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                              <p className="absolute bottom-2 left-3 text-white text-sm font-bold drop-shadow">{child.name}</p>
                            </div>
                            <div className="flex items-center gap-3 px-3 py-2 bg-surface-container-lowest">
                              <span className="text-on-surface-variant text-xs flex items-center gap-1">
                                <CheckCircle2 className="size-3" />
                                {child.leafCount}
                              </span>
                              <span className="text-on-surface-variant text-xs flex items-center gap-1">
                                <Clock className="size-3" />
                                {child.totalEstimatedMinutes} {copy.minutes}
                              </span>
                            </div>
                            <div className={["h-0.5 transition-colors", isChildSelected ? "bg-secondary" : "bg-surface-container group-hover:bg-secondary/60"].join(" ")} />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      ) : (
        /* ── List View ── */
        <div className="grid gap-2">
          {sections.map((section) => {
            const isSelected = section.id === selectedSectionId;
            const sectionImg = getSectionImage(section.name);
            return (
              <div
                key={section.id}
                className={[
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all border",
                  isSelected
                    ? "border-secondary bg-secondary/10"
                    : "border-outline-variant hover:border-secondary/50 hover:bg-surface-container",
                ].join(" ")}
                style={{ paddingLeft: `${(section.depth * 16) + 12}px` }}
              >
                {/* Thumbnail — click to open drawer */}
                <button
                  type="button"
                  className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-surface-container cursor-pointer"
                  onClick={() => {
                    if (onSelectSection) onSelectSection(section.id);
                    openSectionDrawer(section);
                  }}
                >
                  {sectionImg ? (
                    <Image src={sectionImg} alt={section.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Layers className="size-5 text-secondary" />
                    </div>
                  )}
                </button>

                {/* Inline-editable name + meta */}
                <div className="min-w-0 flex-1">
                  <InlineEditField
                    value={section.name}
                    displayClassName={[
                      "text-sm font-semibold truncate transition-colors",
                      isSelected ? "text-secondary" : "text-on-surface",
                    ].join(" ")}
                    onSave={(next) => renameSectionInline(section.id, next)}
                  />
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    {section.leafCount} {copy.leafCount} · {section.totalEstimatedMinutes} {copy.minutes}
                  </p>
                </div>

                {/* Arrow — click to open drawer */}
                <button
                  type="button"
                  className="cursor-pointer p-1 rounded-lg hover:bg-surface-container transition-colors"
                  onClick={() => {
                    if (onSelectSection) onSelectSection(section.id);
                    openSectionDrawer(section);
                  }}
                >
                  <ChevronRight className={["size-4 shrink-0", isSelected ? "text-secondary" : "text-on-surface-variant"].join(" ")} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
