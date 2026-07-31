"use client";

import { useState } from "react";
import { Image as ImageIcon, Layers, Plus, Edit2, CheckSquare } from "lucide-react";

import { Button, PriorityStatusBadge, TaskItemCard, ToolStepCard } from "@/components/ui";
import { SectionPortalTabs } from "@/components/ui/section-portal-tabs";
import {
  DeleteToolStepForm,
  DeleteEntityForm,
  LeafItemForm,
  ReferenceImageForm,
  SectionForm,
  ToolStepForm,
  type SectionsItemsFormCopy,
} from "./SectionsItemsForms";
import { SectionsInteractive } from "./SectionsInteractive";
import type {
  SectionsItemsData,
  LeafItemListItem,
  SectionTreeNode,
} from "./queries";
import type { Locale } from "@/i18n/routing";
import { useAdminSpa } from "@/context/admin-spa-context";

type SectionsTabClientProps = Readonly<{
  data: SectionsItemsData;
  forms: SectionsItemsFormCopy;
  copy: {
    clientLabel: string;
    edit: string;
    emptyClients: string;
    emptyLeafItems: string;
    emptySections: string;
    hasImage: string;
    inactive: string;
    leafCount: string;
    leafItemsTitle: string;
    lastPerformed: string;
    loadError: string;
    minutes: string;
    neverPerformed: string;
    noToolSteps: string;
    optional: string;
    quantity: string;
    recurrenceDays: string;
    selectClient: string;
    selectedSectionTitle: string;
    stepEstimateTotal: string;
    toolStepsTitle: string;
    title: string;
    treeTitle: string;
  };
  locale: Locale;
}>;

function descendantIds(sections: readonly SectionTreeNode[], sectionId: string) {
  const byParent = new Map<string, SectionTreeNode[]>();
  sections.forEach((section) => {
    if (!section.parentSectionId) return;
    byParent.set(section.parentSectionId, [
      ...(byParent.get(section.parentSectionId) ?? []),
      section,
    ]);
  });
  const ids = new Set<string>();
  function walk(parentId: string) {
    (byParent.get(parentId) ?? []).forEach((child) => {
      ids.add(child.id);
      walk(child.id);
    });
  }
  walk(sectionId);
  return ids;
}

export function SectionsTabClient({ data, forms, copy, locale }: SectionsTabClientProps) {
  const { selectedClientId: spaClientId, selectedSectionId: spaSectionId, setSelectedSectionId, setActiveTab } = useAdminSpa();
  const [activePortal, setActivePortal] = useState("overview");

  const selectedClientId = spaClientId || data.selectedClientId || data.clients[0]?.id || "";
  const currentSectionId = spaSectionId || data.selectedSectionId || data.sections[0]?.id || null;

  const selectedSection = data.sections.find((s) => s.id === currentSectionId) || data.sections[0] || null;

  const blockedParentIds = selectedSection
    ? descendantIds(data.sections, selectedSection.id)
    : new Set<string>();
  const editSectionOptions = selectedSection
    ? data.sectionOptions.filter((option) => !blockedParentIds.has(option.id))
    : data.sectionOptions;

  const currentLeafItems = selectedSection
    ? data.leafItems.filter((item) => item.sectionId === selectedSection.id)
    : data.leafItems;

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">{copy.title}</h1>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded-xl border px-4 py-3 text-sm">
          {copy.loadError}
        </p>
      )}

      {data.clients.length === 0 && (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
          {copy.emptyClients}
        </p>
      )}

      {selectedClientId ? (
        <div className="grid gap-6">
          {/* Client Selector */}
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={(e) => e.preventDefault()}>
            <input type="hidden" name="tab" value="sections" />
            <div className="grid gap-2 sm:min-w-80">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="sections-client">
                {copy.clientLabel}
              </label>
              <select
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded-xl border px-3.5 text-sm outline-none transition"
                value={selectedClientId}
                onChange={(e) => {
                  const newId = e.target.value;
                  setActiveTab("sections", newId, "");
                }}
                id="sections-client"
                name="clientId"
              >
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.isActive ? client.name : `${client.name} (${copy.inactive})`}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" onClick={() => setActiveTab("sections", selectedClientId)}>{copy.selectClient}</Button>
          </form>

          {/* Sub-Tab Portals Bar */}
          <SectionPortalTabs
            activeTabId={activePortal}
            onChange={setActivePortal}
            tabs={[
              {
                id: "overview",
                label: `Bereiche & Übersicht (${data.sections.length})`,
                icon: <Layers className="size-4" />,
                content: (
                  <div className="grid gap-8 w-full">
                    {/* Full Width Sections Grid */}
                    <section className="grid gap-4 w-full">
                      <div className="flex items-center justify-between">
                        <h2 className="font-heading text-primary-container text-xl font-bold">{copy.treeTitle}</h2>
                        <button
                          type="button"
                          onClick={() => setActivePortal("create-section")}
                          className="bg-secondary text-on-secondary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold shadow-sm transition-all hover:opacity-90 cursor-pointer"
                        >
                          <Plus className="size-4" /> Neuer Bereich
                        </button>
                      </div>
                      {data.sections.length > 0 ? (
                        <SectionsInteractive
                          sections={data.sections}
                          leafItems={data.leafItems}
                          locale={locale}
                          clientId={selectedClientId}
                          selectedSectionId={selectedSection?.id ?? null}
                          onSelectSection={(secId) => setSelectedSectionId(secId)}
                          copy={{
                            minutes: copy.minutes,
                            leafCount: copy.leafCount,
                            lastPerformed: copy.lastPerformed,
                            neverPerformed: copy.neverPerformed,
                            recurrenceDays: copy.recurrenceDays,
                            optional: copy.optional,
                            quantity: copy.quantity,
                            toolStepsTitle: copy.toolStepsTitle,
                            stepEstimateTotal: copy.stepEstimateTotal,
                            hasImage: copy.hasImage,
                            noToolSteps: copy.noToolSteps,
                          }}
                          tagLabels={{
                            normal: forms.tagNormal,
                            complaint: forms.tagComplaint,
                            high_priority: forms.tagHighPriority,
                          }}
                        />
                      ) : (
                        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
                          {copy.emptySections}
                        </p>
                      )}
                    </section>

                    {/* Leaf Items list for selected section */}
                    {selectedSection && (
                      <section className="grid gap-4 w-full border-t border-outline-variant/60 pt-6">
                        <div className="flex items-center justify-between">
                          <h2 className="font-heading text-primary-container text-xl font-bold">
                            {copy.leafItemsTitle} ({selectedSection.name})
                          </h2>
                          <button
                            type="button"
                            onClick={() => setActivePortal("create-task")}
                            className="bg-secondary/10 text-secondary flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all hover:bg-secondary/20 cursor-pointer"
                          >
                            <Plus className="size-4" /> Neue Aufgabe
                          </button>
                        </div>
                        {currentLeafItems.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {currentLeafItems.map((item) => (
                              <div key={item.id} className="grid gap-2">
                                <TaskItemCard
                                  badge={
                                    item.tag !== "normal" ? (
                                      <PriorityStatusBadge
                                        label={item.tag === "complaint" ? forms.tagComplaint : forms.tagHighPriority}
                                        tone={item.tag === "complaint" ? "warning" : "critical"}
                                      />
                                    ) : null
                                  }
                                  estimatedMinutes={`${item.estimatedMinutes} ${copy.minutes}`}
                                  lastCleaned={item.recurrenceDays ? `${copy.recurrenceDays}: ${item.recurrenceDays}` : undefined}
                                  thumbnail={
                                    item.hasReferenceImage ? (
                                      <span className="text-secondary flex size-full items-center justify-center">
                                        <ImageIcon aria-hidden="true" className="size-5" />
                                      </span>
                                    ) : null
                                  }
                                  title={item.name}
                                />
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded-2xl border px-5 py-8 text-sm">
                            {copy.emptyLeafItems}
                          </p>
                        )}
                      </section>
                    )}
                  </div>
                ),
              },
              {
                id: "create-section",
                label: "Neuer Bereich",
                icon: <Plus className="size-4" />,
                content: (
                  <div className="w-full max-w-3xl border-outline-variant bg-surface-container-lowest rounded-3xl border p-6 shadow-sm">
                    <SectionForm
                      clientId={selectedClientId}
                      copy={forms}
                      locale={locale}
                      mode="create"
                      sectionOptions={data.sectionOptions}
                    />
                  </div>
                ),
              },
              ...(selectedSection
                ? [
                    {
                      id: "edit-section",
                      label: `Bereich bearbeiten (${selectedSection.name})`,
                      icon: <Edit2 className="size-4" />,
                      content: (
                        <div className="w-full max-w-3xl border-outline-variant bg-surface-container-lowest grid gap-6 rounded-3xl border p-6 shadow-sm">
                          <div className="flex items-center justify-between border-b border-outline-variant/60 pb-4">
                            <div>
                              <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">{copy.selectedSectionTitle}</p>
                              <h2 className="font-heading text-primary-container text-xl font-bold mt-0.5">{selectedSection.name}</h2>
                            </div>
                            <DeleteEntityForm
                              clientId={selectedClientId}
                              copy={forms}
                              entityId={selectedSection.id}
                              kind="section"
                              locale={locale}
                            />
                          </div>
                          <div className="grid gap-6 md:grid-cols-2">
                            <SectionForm
                              clientId={selectedClientId}
                              copy={forms}
                              locale={locale}
                              mode="update"
                              section={selectedSection}
                              sectionOptions={editSectionOptions}
                            />
                            <ReferenceImageForm
                              clientId={selectedClientId}
                              copy={forms}
                              entityId={selectedSection.id}
                              kind="section"
                              locale={locale}
                            />
                          </div>
                        </div>
                      ),
                    },
                    {
                      id: "create-task",
                      label: "Neue Aufgabe",
                      icon: <CheckSquare className="size-4" />,
                      content: (
                        <div className="w-full max-w-3xl border-outline-variant bg-surface-container-lowest rounded-3xl border p-6 shadow-sm">
                          <LeafItemForm
                            clientId={selectedClientId}
                            copy={forms}
                            locale={locale}
                            mode="create"
                            sectionOptions={data.sectionOptions}
                            selectedSectionId={selectedSection.id}
                          />
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}
