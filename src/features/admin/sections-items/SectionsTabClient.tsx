"use client";

import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

import { Button, PriorityStatusBadge, TaskItemCard, ToolStepCard } from "@/components/ui";
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
  const { selectedClientId: spaClientId, selectedSectionId: spaSectionId, setSelectedSectionId } = useAdminSpa();

  // Active client ID and section ID in SPA state
  const selectedClientId = spaClientId || data.selectedClientId || data.clients[0]?.id || "";
  const currentSectionId = spaSectionId || data.selectedSectionId || data.sections[0]?.id || null;

  const selectedSection = data.sections.find((s) => s.id === currentSectionId) || data.sections[0] || null;

  const blockedParentIds = selectedSection
    ? descendantIds(data.sections, selectedSection.id)
    : new Set<string>();
  const editSectionOptions = selectedSection
    ? data.sectionOptions.filter((option) => !blockedParentIds.has(option.id))
    : data.sectionOptions;

  // Filter leaf items for currently selected section
  const currentLeafItems = selectedSection
    ? data.leafItems.filter((item) => item.sectionId === selectedSection.id)
    : data.leafItems;

  return (
    <div className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">{copy.title}</h1>

      {!data.ok && (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.loadError}
        </p>
      )}

      {data.clients.length === 0 && (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
          {copy.emptyClients}
        </p>
      )}

      {selectedClientId ? (
        <>
          {/* Client select form */}
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <input type="hidden" name="tab" value="sections" />
            <div className="grid gap-2 sm:min-w-80">
              <label className="text-on-surface-variant text-xs font-bold uppercase tracking-wide" htmlFor="sections-client">
                {copy.clientLabel}
              </label>
              <select
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm outline-none transition"
                defaultValue={selectedClientId}
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
            <Button type="submit">{copy.selectClient}</Button>
          </form>

          <div className="grid gap-6 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
            {/* Left: Section Tree & Section Form */}
            <div className="grid h-fit gap-6">
              <aside className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                <SectionForm
                  clientId={selectedClientId}
                  copy={forms}
                  locale={locale}
                  mode="create"
                  sectionOptions={data.sectionOptions}
                />
              </aside>
              <section className="grid gap-3">
                <h2 className="font-heading text-primary-container text-xl font-bold">{copy.treeTitle}</h2>
                {data.sections.length > 0 ? (
                  <SectionsInteractive
                    sections={data.sections}
                    leafItems={data.leafItems}
                    locale={locale}
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
                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                    {copy.emptySections}
                  </p>
                )}
              </section>
            </div>

            {/* Right: Selected Section Details & Tasks */}
            <div className="grid min-w-0 gap-6">
              {selectedSection && (
                <>
                  <section className="border-outline-variant bg-surface-container-lowest grid gap-5 rounded border p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wide">
                          {copy.selectedSectionTitle}
                        </p>
                        <h2 className="font-heading text-primary-container mt-1 text-xl font-bold">
                          {selectedSection.name}
                        </h2>
                      </div>
                      <DeleteEntityForm
                        clientId={selectedClientId}
                        copy={forms}
                        entityId={selectedSection.id}
                        kind="section"
                        locale={locale}
                      />
                    </div>
                    <div className="grid gap-5 2xl:grid-cols-2">
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
                  </section>

                  <aside className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                    <LeafItemForm
                      clientId={selectedClientId}
                      copy={forms}
                      locale={locale}
                      mode="create"
                      sectionOptions={data.sectionOptions}
                      selectedSectionId={selectedSection.id}
                    />
                  </aside>
                </>
              )}

              <section className="grid gap-3">
                <h2 className="font-heading text-primary-container text-xl font-bold">{copy.leafItemsTitle}</h2>
                {selectedSection && currentLeafItems.length > 0 ? (
                  <div className="grid gap-3">
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
                        <details className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                          <summary className="text-primary-container cursor-pointer text-sm font-bold uppercase tracking-wide">
                            {copy.edit}
                          </summary>
                          <div className="mt-4 grid gap-5">
                            <LeafItemForm
                              clientId={selectedClientId}
                              copy={forms}
                              leafItem={item}
                              locale={locale}
                              mode="update"
                              sectionOptions={data.sectionOptions}
                              selectedSectionId={selectedSection.id}
                            />
                            <ReferenceImageForm
                              clientId={selectedClientId}
                              copy={forms}
                              entityId={item.id}
                              kind="leafItem"
                              locale={locale}
                            />
                            {/* Tool steps */}
                            <section className="grid gap-4">
                              <div>
                                <h3 className="font-heading text-primary-container text-lg font-bold">{copy.toolStepsTitle}</h3>
                                <p className="text-on-surface-variant mt-1 text-sm">
                                  {copy.stepEstimateTotal}: {item.stepEstimateMinutes} {copy.minutes}
                                </p>
                              </div>
                              <div className="grid gap-3">
                                {item.toolSteps.length > 0 ? (
                                  item.toolSteps.map((step) => (
                                    <div key={step.id} className="grid gap-2">
                                      <ToolStepCard
                                        actions={
                                          <DeleteToolStepForm
                                            clientId={selectedClientId}
                                            copy={forms}
                                            leafItemId={item.id}
                                            locale={locale}
                                            stepId={step.id}
                                          />
                                        }
                                        duration={`${step.estimatedMinutes} ${copy.minutes}`}
                                        isMandatory={step.isMandatory}
                                        mandatoryLabel={forms.mandatoryLabel}
                                        notes={
                                          <span className="grid gap-1">
                                            <span>
                                              {copy.lastPerformed}:{" "}
                                              {step.lastPerformedAt
                                                ? new Date(step.lastPerformedAt).toLocaleDateString(
                                                    locale === "de" ? "de-DE" : "en-GB",
                                                  )
                                                : copy.neverPerformed}
                                            </span>
                                            {step.notes ? <span>{step.notes}</span> : null}
                                          </span>
                                        }
                                        optionalLabel={forms.optionalLabel}
                                        recurrence={`${copy.recurrenceDays}: ${step.recurrenceDays}`}
                                        sequenceOrder={step.sequenceOrder}
                                        title={step.toolName}
                                      />
                                      <details className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                                        <summary className="text-primary-container cursor-pointer text-sm font-bold uppercase tracking-wide">
                                          {copy.edit}
                                        </summary>
                                        <div className="mt-4">
                                          <ToolStepForm
                                            clientId={selectedClientId}
                                            copy={forms}
                                            leafItemId={item.id}
                                            locale={locale}
                                            mode="update"
                                            step={step}
                                          />
                                        </div>
                                      </details>
                                    </div>
                                  ))
                                ) : (
                                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-5 text-sm">
                                    {copy.noToolSteps}
                                  </p>
                                )}
                              </div>
                              <div className="border-outline-variant bg-surface-container-low rounded border p-4">
                                <ToolStepForm
                                  clientId={selectedClientId}
                                  copy={forms}
                                  leafItemId={item.id}
                                  locale={locale}
                                  mode="create"
                                  nextSequenceOrder={
                                    item.toolSteps.reduce((max, s) => Math.max(max, s.sequenceOrder), 0) + 1
                                  }
                                />
                              </div>
                            </section>
                          </div>
                        </details>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                    {copy.emptyLeafItems}
                  </p>
                )}
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
