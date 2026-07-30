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
import { useCallback } from "react";

import { useDetailDrawer, type DrawerConfig } from "@/components/ui/detail-drawer";
import { PriorityStatusBadge } from "@/components/ui";
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
  return (
    <div className="border-outline-variant bg-surface-container rounded-lg border p-3 flex gap-3">
      <div className="bg-secondary/10 text-secondary flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold">
        {step.sequenceOrder}
      </div>
      <div className="min-w-0">
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

  const openSectionDrawer = useCallback(
    (section: SectionTreeNode) => {
      const sectionItems = leafItems.filter((item) => item.sectionId === section.id);

      const config: DrawerConfig = {
        title: section.name,
        subtitle: `${section.leafCount} ${copy.leafCount} · ${section.totalEstimatedMinutes} ${copy.minutes}`,
        icon: <Layers className="size-5" />,
        accentColor: "secondary",
        sections: [
          {
            label: "Überblick",
            content: (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.leafCount}
                  </p>
                  <p className="font-heading text-on-surface text-xl font-bold mt-0.5">
                    {section.leafCount}
                  </p>
                </div>
                <div className="bg-surface-container rounded-lg p-3">
                  <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                    {copy.minutes}
                  </p>
                  <p className="font-heading text-on-surface text-xl font-bold mt-0.5">
                    {section.totalEstimatedMinutes}
                  </p>
                </div>
                {section.hasReferenceImage && (
                  <div className="col-span-2 flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2">
                    <ImageIcon className="text-secondary size-4 shrink-0" />
                    <span className="text-secondary text-xs font-semibold">{copy.hasImage}</span>
                  </div>
                )}
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
                          className="border-outline-variant hover:bg-surface-container group flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                          onClick={() => openLeafItemDrawer(item)}
                          type="button"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-on-surface group-hover:text-secondary text-sm font-medium truncate transition-colors">
                              {item.name}
                            </p>
                            <p className="text-on-surface-variant text-xs flex items-center gap-1 mt-0.5">
                              <Clock className="size-3" />
                              {item.estimatedMinutes} {copy.minutes}
                              {item.toolSteps.length > 0 && (
                                <>
                                  {" · "}
                                  <Wrench className="size-3" />
                                  {item.toolSteps.length}
                                </>
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
    [open, leafItems, copy, locale],
  );

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
        icon: <CheckCircle2 className="size-5" />,
        accentColor:
          item.tag === "complaint"
            ? "warning"
            : item.tag === "high_priority"
              ? "critical"
              : "secondary",
        sections: [
          {
            label: "Details",
            content: (
              <div className="grid gap-3">
                {tagLabel && (
                  <div
                    className={
                      item.tag === "high_priority"
                        ? "bg-error-container text-on-error-container rounded-lg px-3 py-2 text-xs font-bold"
                        : "bg-warning-container text-on-warning-container rounded-lg px-3 py-2 text-xs font-bold"
                    }
                  >
                    {tagLabel}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container rounded-lg p-3">
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.minutes}
                    </p>
                    <p className="font-heading text-on-surface text-xl font-bold mt-0.5">
                      {item.estimatedMinutes}
                    </p>
                  </div>
                  <div className="bg-surface-container rounded-lg p-3">
                    <p className="text-on-surface-variant text-xs font-semibold uppercase tracking-wide">
                      {copy.quantity}
                    </p>
                    <p className="font-heading text-on-surface text-xl font-bold mt-0.5">
                      {item.quantity}
                    </p>
                  </div>
                </div>
                {item.recurrenceDays && (
                  <div className="flex items-center gap-2 rounded-lg bg-surface-container px-3 py-2">
                    <CalendarClock className="text-secondary size-4 shrink-0" />
                    <span className="text-on-surface text-xs">
                      {copy.recurrenceDays}: <strong>{item.recurrenceDays}</strong>
                    </span>
                  </div>
                )}
                {item.notes && (
                  <p className="text-on-surface-variant border-outline-variant rounded-lg border p-3 text-sm italic">
                    {item.notes}
                  </p>
                )}
                {item.hasReferenceImage && (
                  <div className="flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-2">
                    <ImageIcon className="text-secondary size-4" />
                    <span className="text-secondary text-xs font-semibold">{copy.hasImage}</span>
                  </div>
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
                  <div className="text-on-surface-variant border-outline-variant rounded-lg border px-3 py-2 text-xs">
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

  return (
    <div className="grid gap-2">
      {sections.map((section) => {
        const isSelected = section.id === selectedSectionId;
        const hasChildren = sections.some(
          (candidate) => candidate.parentSectionId === section.id,
        );

        return (
          <button
            key={section.id}
            className={[
              "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-all",
              "border",
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
            <Layers
              className={[
                "size-4 shrink-0 transition-colors",
                isSelected ? "text-secondary" : "text-on-surface-variant group-hover:text-secondary",
              ].join(" ")}
            />
            <div className="min-w-0 flex-1">
              <p
                className={[
                  "text-sm font-medium truncate transition-colors",
                  isSelected ? "text-secondary font-semibold" : "text-on-surface group-hover:text-secondary",
                ].join(" ")}
              >
                {section.name}
              </p>
              <p className="text-on-surface-variant text-xs mt-0.5">
                {section.leafCount} {copy.leafCount} · {section.totalEstimatedMinutes} {copy.minutes}
                {section.hasReferenceImage && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5">
                    <ImageIcon className="size-3" />
                  </span>
                )}
              </p>
            </div>
            <ChevronRight
              className={[
                "size-4 shrink-0 transition-colors",
                isSelected ? "text-secondary" : "text-on-surface-variant",
              ].join(" ")}
            />
          </button>
        );
      })}
    </div>
  );
}
