"use client";

import {
  Clock,
  ArrowRight,
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
import { ViewToggle, useViewMode } from "@/components/ui/view-toggle";
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
  selectedSectionId,
  onSelectSection,
  copy,
  tagLabels,
}: SectionsInteractiveProps) {
  const { open } = useDetailDrawer();
  const [viewMode, setViewMode] = useViewMode("sections", "grid");

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
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-on-surface-variant text-sm">
          {sections.length} Bereich{sections.length !== 1 ? "e" : ""}
        </p>
        <ViewToggle mode={viewMode} onChange={setViewMode} />
      </div>

      {viewMode === "grid" ? (
        /* ── Grid View with real section photos ── */
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => {
            const isSelected = section.id === selectedSectionId;
            const sectionImg = getSectionImage(section.name);
            return (
              <button
                key={section.id}
                type="button"
                className={[
                  "group flex flex-col overflow-hidden rounded-2xl border text-left shadow-sm transition-all hover:shadow-xl hover:-translate-y-0.5 cursor-pointer",
                  isSelected
                    ? "border-secondary ring-2 ring-secondary/30"
                    : "border-outline-variant hover:border-secondary",
                ].join(" ")}
                onClick={() => {
                  if (onSelectSection) onSelectSection(section.id);
                  openSectionDrawer(section);
                }}
              >
                {/* Photo area */}
                <div className="relative h-32 w-full overflow-hidden bg-surface-container">
                  {sectionImg && (
                    <Image
                      src={sectionImg}
                      alt={section.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  {/* depth badge */}
                  {section.depth > 0 && (
                    <span className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full backdrop-blur-sm">
                      {"›".repeat(section.depth)} Unterbereich
                    </span>
                  )}
                  {section.hasReferenceImage && (
                    <div className="absolute top-2 right-2 bg-secondary/80 text-on-secondary rounded-full p-1 backdrop-blur-sm">
                      <ImageIcon className="size-3" />
                    </div>
                  )}
                </div>
                {/* Body */}
                <div className="flex flex-col gap-1.5 p-4 bg-surface-container-lowest flex-1">
                  <p className={[
                    "font-bold text-sm leading-tight transition-colors",
                    isSelected ? "text-secondary" : "text-on-surface group-hover:text-secondary",
                  ].join(" ")}>
                    {section.name}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-on-surface-variant text-xs flex items-center gap-1">
                      <CheckCircle2 className="size-3" />
                      {section.leafCount} {copy.leafCount}
                    </span>
                    <span className="text-on-surface-variant text-xs flex items-center gap-1">
                      <Clock className="size-3" />
                      {section.totalEstimatedMinutes} {copy.minutes}
                    </span>
                  </div>
                </div>
                <div className={["h-1 transition-colors", isSelected ? "bg-secondary" : "bg-surface-container group-hover:bg-secondary/60"].join(" ")} />
              </button>
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
              <button
                key={section.id}
                className={[
                  "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all border cursor-pointer",
                  isSelected
                    ? "border-secondary bg-secondary/10"
                    : "border-outline-variant hover:border-secondary/50 hover:bg-surface-container",
                ].join(" ")}
                style={{ paddingLeft: `${(section.depth * 16) + 12}px` }}
                onClick={() => {
                  if (onSelectSection) onSelectSection(section.id);
                  openSectionDrawer(section);
                }}
                type="button"
              >
                {/* Thumbnail */}
                <div className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-surface-container">
                  {sectionImg ? (
                    <Image src={sectionImg} alt={section.name} fill className="object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Layers className="size-5 text-secondary" />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={["text-sm font-semibold truncate transition-colors", isSelected ? "text-secondary" : "text-on-surface group-hover:text-secondary"].join(" ")}>
                    {section.name}
                  </p>
                  <p className="text-on-surface-variant text-xs mt-0.5">
                    {section.leafCount} {copy.leafCount} · {section.totalEstimatedMinutes} {copy.minutes}
                  </p>
                </div>
                <ChevronRight className={["size-4 shrink-0", isSelected ? "text-secondary" : "text-on-surface-variant"].join(" ")} />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
