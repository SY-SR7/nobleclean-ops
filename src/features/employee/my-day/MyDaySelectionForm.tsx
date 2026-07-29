"use client";

import { CheckCircle2, Save } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  Button,
  PriorityStatusBadge,
  ProgressIndicator,
  TaskItemCard,
} from "@/components/ui";
import type { Locale } from "@/i18n/routing";

import {
  saveDailyPlanSelectionAction,
  submitDailyPlanCompletionAction,
} from "./actions";
import type {
  MyDayAdvisoryStatus,
  MyDayItem,
  MyDayPlan,
  MyDaySchedule,
} from "./queries";
import {
  initialMyDaySelectionActionState,
  type MyDaySelectionActionState,
} from "./schema";

export type MyDaySelectionCopy = Readonly<{
  completionSaved: string;
  currentPlan: string;
  emptyItems: string;
  error: string;
  itemListTitle: string;
  lastCleaned: string;
  minutes: string;
  neverCleaned: string;
  noPlan: string;
  plannedMinutes: string;
  quantity: string;
  readyToSave: string;
  remainingMinutes: string;
  markAllDone: string;
  saveSelection: string;
  saved: string;
  section: string;
  selectItem: string;
  submitCompletion: string;
  statusCritical: string;
  statusInProgress: string;
  statusRecent: string;
  statusSubmitted: string;
  statusWarning: string;
  tooShort: string;
}>;

type MyDaySelectionFormProps = Readonly<{
  copy: MyDaySelectionCopy;
  items: readonly MyDayItem[];
  locale: Locale;
  plan: MyDayPlan | null;
  schedule: MyDaySchedule;
}>;

function formatTimestamp(
  value: string | null,
  locale: Locale,
  copy: MyDaySelectionCopy,
) {
  if (!value) {
    return copy.neverCleaned;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return copy.neverCleaned;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
  }).format(date);
}

function advisoryLabel(status: MyDayAdvisoryStatus, copy: MyDaySelectionCopy) {
  switch (status) {
    case "critical":
      return copy.statusCritical;
    case "recent":
      return copy.statusRecent;
    case "warning":
      return copy.statusWarning;
    case null:
      return null;
  }
}

function feedbackMessage(
  state: MyDaySelectionActionState,
  copy: MyDaySelectionCopy,
) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <p
      className={
        state.status === "success"
          ? "border-secondary bg-secondary-container text-on-secondary-container rounded border px-3 py-2 text-sm"
          : "border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm"
      }
    >
      {state.status === "success"
        ? state.code === "COMPLETED"
          ? copy.completionSaved
          : copy.saved
        : state.code === "TOO_SHORT"
          ? copy.tooShort
          : copy.error}
    </p>
  );
}

export function MyDaySelectionForm({
  copy,
  items,
  locale,
  plan,
  schedule,
}: MyDaySelectionFormProps) {
  const [state, formAction, isPending] = useActionState(
    saveDailyPlanSelectionAction,
    initialMyDaySelectionActionState,
  );
  const [completionState, completionFormAction, isCompletionPending] =
    useActionState(
      submitDailyPlanCompletionAction,
      initialMyDaySelectionActionState,
    );
  const [selectedIds, setSelectedIds] = useState(
    () =>
      new Set(items.filter((item) => item.isSelected).map((item) => item.id)),
  );
  const [completedIds, setCompletedIds] = useState(
    () =>
      new Set(items.filter((item) => item.isCompleted).map((item) => item.id)),
  );
  const plannedMinutes = useMemo(
    () =>
      items
        .filter((item) => selectedIds.has(item.id))
        .reduce((total, item) => total + item.estimatedMinutes, 0),
    [items, selectedIds],
  );
  const selectedCount = selectedIds.size;
  const remainingMinutes = Math.max(
    schedule.allocatedMinutes - plannedMinutes,
    0,
  );
  const isSubmitted =
    plan?.status === "submitted" || completionState.status === "success";
  const progressLabel =
    remainingMinutes > 0
      ? `${copy.remainingMinutes}: ${remainingMinutes} ${copy.minutes}`
      : copy.readyToSave;

  function toggleItem(itemId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
        setCompletedIds((currentCompleted) => {
          const nextCompleted = new Set(currentCompleted);
          nextCompleted.delete(itemId);
          return nextCompleted;
        });
      } else {
        next.add(itemId);
      }

      return next;
    });
  }

  function toggleCompletedItem(itemId: string) {
    setCompletedIds((current) => {
      const next = new Set(current);

      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }

      return next;
    });
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      <input name="clientId" type="hidden" value={schedule.clientId} />
      <input name="locale" type="hidden" value={locale} />
      <input name="workDate" type="hidden" value={schedule.workDate} />

      <div className="border-outline-variant bg-surface-container-lowest grid gap-3 rounded border p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-primary-container text-xl font-bold">
              {copy.currentPlan}
            </h2>
            <p className="text-on-surface-variant mt-1 text-sm">
              {plan
                ? isSubmitted
                  ? copy.statusSubmitted
                  : copy.statusInProgress
                : copy.noPlan}
            </p>
          </div>
          {isSubmitted ? (
            <PriorityStatusBadge label={copy.statusSubmitted} tone="success" />
          ) : null}
        </div>
        <ProgressIndicator
          label={copy.plannedMinutes}
          max={schedule.allocatedMinutes}
          value={plannedMinutes}
          valueLabel={`${plannedMinutes} / ${schedule.allocatedMinutes} ${copy.minutes}`}
        />
        <p className="text-on-surface-variant text-sm">{progressLabel}</p>
        {feedbackMessage(state, copy)}
        {feedbackMessage(completionState, copy)}
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            disabled={isSubmitted}
            icon={<Save aria-hidden="true" />}
            isLoading={isPending}
            type="submit"
          >
            {copy.saveSelection}
          </Button>
          <Button
            disabled={isSubmitted || selectedCount === 0}
            formAction={completionFormAction}
            icon={<CheckCircle2 aria-hidden="true" />}
            isLoading={isCompletionPending}
            name="completeAll"
            type="submit"
            value="true"
          >
            {copy.markAllDone}
          </Button>
          <Button
            disabled={isSubmitted || selectedCount === 0}
            formAction={completionFormAction}
            icon={<CheckCircle2 aria-hidden="true" />}
            isLoading={isCompletionPending}
            type="submit"
            variant="secondary"
          >
            {copy.submitCompletion}
          </Button>
        </div>
      </div>

      <section className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <h2 className="font-heading text-primary-container text-xl font-bold">
            {copy.itemListTitle}
          </h2>
          <p className="text-on-surface-variant text-sm">
            {selectedCount} / {items.length}
          </p>
        </div>

        {items.length > 0 ? (
          <div className="grid gap-3">
            {items.map((item) => {
              const label = advisoryLabel(item.advisoryStatus, copy);

              return (
                <TaskItemCard
                  actions={
                    <div className="flex justify-end gap-2">
                      <label className="border-outline-variant bg-surface-container-lowest inline-grid size-11 place-items-center rounded border">
                        <input
                          checked={selectedIds.has(item.id)}
                          className="accent-secondary size-5"
                          disabled={
                            isSubmitted || isPending || isCompletionPending
                          }
                          name="leafItemId"
                          onChange={() => {
                            toggleItem(item.id);
                          }}
                          type="checkbox"
                          value={item.id}
                        />
                        <span className="sr-only">{copy.selectItem}</span>
                      </label>
                      {selectedIds.has(item.id) ? (
                        <label className="border-outline-variant bg-surface-container-lowest inline-grid size-11 place-items-center rounded border">
                          <input
                            checked={completedIds.has(item.id)}
                            className="accent-status-success size-5"
                            disabled={
                              isSubmitted || isPending || isCompletionPending
                            }
                            name="completedLeafItemId"
                            onChange={() => {
                              toggleCompletedItem(item.id);
                            }}
                            type="checkbox"
                            value={item.id}
                          />
                          <span className="sr-only">
                            {copy.submitCompletion}
                          </span>
                        </label>
                      ) : null}
                    </div>
                  }
                  badge={
                    item.advisoryStatus && label ? (
                      <PriorityStatusBadge
                        label={label}
                        tone={item.advisoryStatus}
                      />
                    ) : null
                  }
                  estimatedMinutes={`${item.estimatedMinutes} ${copy.minutes}${
                    item.quantity > 1
                      ? ` · ${copy.quantity} ${item.quantity}`
                      : ""
                  }`}
                  key={item.id}
                  lastCleaned={`${copy.lastCleaned}: ${formatTimestamp(
                    item.lastCleanedAt,
                    locale,
                    copy,
                  )}`}
                  selected={selectedIds.has(item.id)}
                  title={
                    <span className="grid gap-1">
                      <span>{item.name}</span>
                      <span className="text-on-surface-variant text-sm font-normal">
                        {copy.section}: {item.sectionPath}
                      </span>
                    </span>
                  }
                />
              );
            })}
          </div>
        ) : (
          <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
            {copy.emptyItems}
          </p>
        )}
      </section>
    </form>
  );
}
