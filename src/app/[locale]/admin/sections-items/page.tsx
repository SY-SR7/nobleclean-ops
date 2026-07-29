import { Image as ImageIcon } from "lucide-react";
import { notFound } from "next/navigation";

import {
  Button,
  ObjectTreeRow,
  PriorityStatusBadge,
  TaskItemCard,
  ToolStepCard,
} from "@/components/ui";
import {
  DeleteToolStepForm,
  DeleteEntityForm,
  LeafItemForm,
  ReferenceImageForm,
  SectionForm,
  ToolStepForm,
  type SectionsItemsFormCopy,
} from "@/features/admin/sections-items/SectionsItemsForms";
import {
  getSectionsItemsData,
  type LeafItemListItem,
  type SectionTreeNode,
} from "@/features/admin/sections-items/queries";
import type { ItemTag } from "@/features/admin/sections-items/schema";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminSectionsItemsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    clientId?: string | string[];
    sectionId?: string | string[];
  }>;
}>;

type SectionsItemsPageCopy = Readonly<{
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
}>;

function firstSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
}

function formCopy(
  messages: ReturnType<typeof getMessages>,
): SectionsItemsFormCopy {
  return {
    attachImage: t(messages, "sectionsItems.actions.attachImage"),
    createLeafTitle: t(messages, "sectionsItems.createLeafTitle"),
    createSectionTitle: t(messages, "sectionsItems.createSectionTitle"),
    deleteLeaf: t(messages, "sectionsItems.actions.deleteLeaf"),
    deleteSection: t(messages, "sectionsItems.actions.deleteSection"),
    deleteToolStep: t(messages, "sectionsItems.actions.deleteToolStep"),
    editLeafTitle: t(messages, "sectionsItems.editLeafTitle"),
    editSectionTitle: t(messages, "sectionsItems.editSectionTitle"),
    editToolStepTitle: t(messages, "sectionsItems.editToolStepTitle"),
    estimatedMinutesLabel: t(messages, "sectionsItems.fields.estimatedMinutes"),
    fieldError: t(messages, "validation.generic"),
    imageAttached: t(messages, "sectionsItems.feedback.imageAttached"),
    imageLabel: t(messages, "sectionsItems.fields.referenceImage"),
    leafNameLabel: t(messages, "sectionsItems.fields.leafName"),
    mandatoryLabel: t(messages, "sectionsItems.mandatory"),
    notesLabel: t(messages, "sectionsItems.fields.notes"),
    optionalLabel: t(messages, "sectionsItems.optional"),
    parentSectionLabel: t(messages, "sectionsItems.fields.parentSection"),
    quantityLabel: t(messages, "sectionsItems.fields.quantity"),
    recurrenceDaysLabel: t(messages, "sectionsItems.fields.recurrenceDays"),
    rootParent: t(messages, "sectionsItems.rootParent"),
    save: t(messages, "actions.save"),
    saved: t(messages, "sectionsItems.feedback.saved"),
    saveError: t(messages, "sectionsItems.feedback.error"),
    sectionLabel: t(messages, "sectionsItems.fields.section"),
    sectionNameLabel: t(messages, "sectionsItems.fields.sectionName"),
    stepEstimatedMinutesLabel: t(
      messages,
      "sectionsItems.fields.stepEstimatedMinutes",
    ),
    stepNotesLabel: t(messages, "sectionsItems.fields.stepNotes"),
    stepRecurrenceDaysLabel: t(
      messages,
      "sectionsItems.fields.stepRecurrenceDays",
    ),
    stepSequenceLabel: t(messages, "sectionsItems.fields.sequenceOrder"),
    sortOrderLabel: t(messages, "sectionsItems.fields.sortOrder"),
    tagComplaint: t(messages, "sectionsItems.tags.complaint"),
    tagHighPriority: t(messages, "sectionsItems.tags.highPriority"),
    tagLabel: t(messages, "sectionsItems.fields.tag"),
    tagNormal: t(messages, "sectionsItems.tags.normal"),
    toolNameLabel: t(messages, "sectionsItems.fields.toolName"),
    toolStepCreateTitle: t(messages, "sectionsItems.toolStepCreateTitle"),
  };
}

function pageCopy(
  messages: ReturnType<typeof getMessages>,
): SectionsItemsPageCopy {
  return {
    clientLabel: t(messages, "sectionsItems.clientLabel"),
    edit: t(messages, "actions.edit"),
    emptyClients: t(messages, "sectionsItems.emptyClients"),
    emptyLeafItems: t(messages, "sectionsItems.emptyLeafItems"),
    emptySections: t(messages, "sectionsItems.emptySections"),
    hasImage: t(messages, "sectionsItems.hasImage"),
    inactive: t(messages, "adminClients.status.inactive"),
    leafCount: t(messages, "sectionsItems.leafCount"),
    leafItemsTitle: t(messages, "sectionsItems.leafItemsTitle"),
    lastPerformed: t(messages, "sectionsItems.lastPerformed"),
    loadError: t(messages, "sectionsItems.feedback.loadError"),
    minutes: t(messages, "sectionsItems.minutes"),
    neverPerformed: t(messages, "sectionsItems.neverPerformed"),
    noToolSteps: t(messages, "sectionsItems.noToolSteps"),
    optional: t(messages, "sectionsItems.optional"),
    quantity: t(messages, "sectionsItems.quantity"),
    recurrenceDays: t(messages, "sectionsItems.recurrenceDays"),
    selectClient: t(messages, "sectionsItems.actions.selectClient"),
    selectedSectionTitle: t(messages, "sectionsItems.selectedSectionTitle"),
    stepEstimateTotal: t(messages, "sectionsItems.stepEstimateTotal"),
    toolStepsTitle: t(messages, "sectionsItems.toolStepsTitle"),
    title: t(messages, "navigation.admin.sectionsItems"),
    treeTitle: t(messages, "sectionsItems.treeTitle"),
  };
}

function tagBadge(
  item: LeafItemListItem,
  messages: ReturnType<typeof getMessages>,
) {
  const tagMap = {
    complaint: {
      label: t(messages, "sectionsItems.tags.complaint"),
      tone: "warning",
    },
    high_priority: {
      label: t(messages, "sectionsItems.tags.highPriority"),
      tone: "critical",
    },
    normal: null,
  } satisfies Record<
    ItemTag,
    {
      label: string;
      tone: "critical" | "warning";
    } | null
  >;
  const badge = tagMap[item.tag];

  return badge ? (
    <PriorityStatusBadge label={badge.label} tone={badge.tone} />
  ) : null;
}

function sectionMeta(section: SectionTreeNode, copy: SectionsItemsPageCopy) {
  return `${section.leafCount} ${copy.leafCount} · ${section.totalEstimatedMinutes} ${copy.minutes}`;
}

function formatTimestamp(
  value: string | null,
  locale: Locale,
  fallback: string,
) {
  if (!value) {
    return fallback;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function descendantIds(
  sections: readonly SectionTreeNode[],
  sectionId: string,
) {
  const byParent = new Map<string, SectionTreeNode[]>();

  sections.forEach((section) => {
    if (!section.parentSectionId) {
      return;
    }

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

function TreeSelector({
  copy,
  locale,
  sections,
  selectedClientId,
  selectedSectionId,
}: Readonly<{
  copy: SectionsItemsPageCopy;
  locale: Locale;
  sections: readonly SectionTreeNode[];
  selectedClientId: string;
  selectedSectionId: string | null;
}>) {
  return (
    <div className="border-outline-variant bg-surface-container-lowest overflow-hidden rounded border">
      {sections.map((section) => (
        <form action={`/${locale}/admin/sections-items`} key={section.id}>
          <input name="clientId" type="hidden" value={selectedClientId} />
          <input name="sectionId" type="hidden" value={section.id} />
          <ObjectTreeRow
            active={section.id === selectedSectionId}
            expanded
            hasChildren={sections.some(
              (candidate) => candidate.parentSectionId === section.id,
            )}
            kind="section"
            level={section.depth}
            meta={sectionMeta(section, copy)}
            title={section.name}
            trailing={
              section.hasReferenceImage ? (
                <span className="text-secondary inline-flex items-center gap-1 text-xs font-bold tracking-normal uppercase">
                  <ImageIcon aria-hidden="true" className="size-4" />
                  {copy.hasImage}
                </span>
              ) : null
            }
            type="submit"
          />
        </form>
      ))}
    </div>
  );
}

function ToolStepsEditor({
  clientId,
  copy,
  formCopy,
  item,
  locale,
}: Readonly<{
  clientId: string;
  copy: SectionsItemsPageCopy;
  formCopy: SectionsItemsFormCopy;
  item: LeafItemListItem;
  locale: Locale;
}>) {
  const nextSequenceOrder =
    item.toolSteps.reduce(
      (maxOrder, step) => Math.max(maxOrder, step.sequenceOrder),
      0,
    ) + 1;

  return (
    <section className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-heading text-primary-container text-lg font-bold">
            {copy.toolStepsTitle}
          </h3>
          <p className="text-on-surface-variant mt-1 text-sm">
            {copy.stepEstimateTotal}: {item.stepEstimateMinutes} {copy.minutes}
          </p>
        </div>
      </div>

      <div className="grid gap-3">
        {item.toolSteps.length > 0 ? (
          item.toolSteps.map((step) => (
            <div className="grid gap-2" key={step.id}>
              <ToolStepCard
                actions={
                  <DeleteToolStepForm
                    clientId={clientId}
                    copy={formCopy}
                    leafItemId={item.id}
                    locale={locale}
                    stepId={step.id}
                  />
                }
                duration={`${step.estimatedMinutes} ${copy.minutes}`}
                isMandatory={step.isMandatory}
                mandatoryLabel={formCopy.mandatoryLabel}
                notes={
                  <span className="grid gap-1">
                    <span>
                      {copy.lastPerformed}:{" "}
                      {formatTimestamp(
                        step.lastPerformedAt,
                        locale,
                        copy.neverPerformed,
                      )}
                    </span>
                    {step.notes ? <span>{step.notes}</span> : null}
                  </span>
                }
                optionalLabel={formCopy.optionalLabel}
                recurrence={`${copy.recurrenceDays}: ${step.recurrenceDays}`}
                sequenceOrder={step.sequenceOrder}
                title={step.toolName}
              />
              <details className="border-outline-variant bg-surface-container-lowest rounded border p-4">
                <summary className="text-primary-container cursor-pointer text-sm font-bold tracking-normal uppercase">
                  {copy.edit}
                </summary>
                <div className="mt-4">
                  <ToolStepForm
                    clientId={clientId}
                    copy={formCopy}
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
          clientId={clientId}
          copy={formCopy}
          leafItemId={item.id}
          locale={locale}
          mode="create"
          nextSequenceOrder={nextSequenceOrder}
        />
      </div>
    </section>
  );
}

function LeafItemCard({
  clientId,
  copy,
  formCopy,
  item,
  locale,
  messages,
  sectionOptions,
  selectedSectionId,
}: Readonly<{
  clientId: string;
  copy: SectionsItemsPageCopy;
  formCopy: SectionsItemsFormCopy;
  item: LeafItemListItem;
  locale: Locale;
  messages: ReturnType<typeof getMessages>;
  sectionOptions: readonly { depth: number; id: string; name: string }[];
  selectedSectionId: string;
}>) {
  return (
    <div className="grid gap-2">
      <TaskItemCard
        actions={
          <DeleteEntityForm
            clientId={clientId}
            copy={formCopy}
            entityId={item.id}
            kind="leafItem"
            locale={locale}
          />
        }
        badge={tagBadge(item, messages)}
        estimatedMinutes={`${item.estimatedMinutes} ${copy.minutes}`}
        lastCleaned={
          item.recurrenceDays
            ? `${copy.recurrenceDays}: ${item.recurrenceDays}`
            : undefined
        }
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
        <summary className="text-primary-container cursor-pointer text-sm font-bold tracking-normal uppercase">
          {copy.edit}
        </summary>
        <div className="mt-4 grid gap-5">
          <LeafItemForm
            clientId={clientId}
            copy={formCopy}
            leafItem={item}
            locale={locale}
            mode="update"
            sectionOptions={sectionOptions}
            selectedSectionId={selectedSectionId}
          />
          <ReferenceImageForm
            clientId={clientId}
            copy={formCopy}
            entityId={item.id}
            kind="leafItem"
            locale={locale}
          />
          <ToolStepsEditor
            clientId={clientId}
            copy={copy}
            formCopy={formCopy}
            item={item}
            locale={locale}
          />
        </div>
      </details>
    </div>
  );
}

export default async function AdminSectionsItemsPage({
  params,
  searchParams,
}: AdminSectionsItemsPageProps) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const messages = getMessages(locale);
  const copy = pageCopy(messages);
  const forms = formCopy(messages);
  const data = await getSectionsItemsData(
    locale,
    firstSearchValue(resolvedSearchParams.clientId),
    firstSearchValue(resolvedSearchParams.sectionId),
  );
  const selectedSection = data.sections.find(
    (section) => section.id === data.selectedSectionId,
  );
  const selectedClientId = data.selectedClientId;
  const blockedParentIds = selectedSection
    ? descendantIds(data.sections, selectedSection.id)
    : new Set<string>();
  const editSectionOptions = selectedSection
    ? data.sectionOptions.filter((option) => !blockedParentIds.has(option.id))
    : data.sectionOptions;

  return (
    <section className="grid gap-6">
      <h1 className="font-heading text-primary-container text-2xl font-bold">
        {copy.title}
      </h1>

      {!data.ok ? (
        <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
          {copy.loadError}
        </p>
      ) : null}

      {data.clients.length === 0 ? (
        <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
          {copy.emptyClients}
        </p>
      ) : null}

      {selectedClientId ? (
        <>
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="grid gap-2 sm:min-w-80">
              <label
                className="text-on-surface-variant text-xs font-bold tracking-normal uppercase"
                htmlFor="sections-client"
              >
                {copy.clientLabel}
              </label>
              <select
                className="border-outline-variant bg-surface-container-lowest text-on-surface focus:border-secondary h-12 rounded border px-3 text-sm transition outline-none"
                defaultValue={selectedClientId}
                id="sections-client"
                name="clientId"
              >
                {data.clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.isActive
                      ? client.name
                      : `${client.name} (${copy.inactive})`}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit">{copy.selectClient}</Button>
          </form>

          <div className="grid gap-6 xl:grid-cols-[minmax(22rem,28rem)_minmax(0,1fr)]">
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
                <h2 className="font-heading text-primary-container text-xl font-bold">
                  {copy.treeTitle}
                </h2>
                {data.sections.length > 0 ? (
                  <TreeSelector
                    copy={copy}
                    locale={locale}
                    sections={data.sections}
                    selectedClientId={selectedClientId}
                    selectedSectionId={data.selectedSectionId}
                  />
                ) : (
                  <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
                    {copy.emptySections}
                  </p>
                )}
              </section>
            </div>

            <div className="grid min-w-0 gap-6">
              {selectedSection ? (
                <section className="border-outline-variant bg-surface-container-lowest grid gap-5 rounded border p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
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
              ) : null}

              {selectedSection ? (
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
              ) : null}

              <section className="grid gap-3">
                <h2 className="font-heading text-primary-container text-xl font-bold">
                  {copy.leafItemsTitle}
                </h2>
                {selectedSection && data.leafItems.length > 0 ? (
                  <div className="grid gap-3">
                    {data.leafItems.map((item) => (
                      <LeafItemCard
                        clientId={selectedClientId}
                        copy={copy}
                        formCopy={forms}
                        item={item}
                        key={item.id}
                        locale={locale}
                        messages={messages}
                        sectionOptions={data.sectionOptions}
                        selectedSectionId={selectedSection.id}
                      />
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
    </section>
  );
}
