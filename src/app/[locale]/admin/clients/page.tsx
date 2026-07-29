import { Search } from "lucide-react";
import { notFound } from "next/navigation";

import { Button, SearchInput } from "@/components/ui";
import {
  ClientForm,
  ClientStatusForm,
  type ClientFormCopy,
  type ClientStatusCopy,
} from "@/features/admin/clients/ClientForm";
import { listAdminClients } from "@/features/admin/clients/queries";
import type { AdminClientListItem } from "@/features/admin/clients/queries";
import { getMessages } from "@/i18n/messages";
import { isLocale, type Locale } from "@/i18n/routing";
import { t } from "@/i18n/translate";

export const dynamic = "force-dynamic";
export const fetchCache = "default-no-store";

type AdminClientsPageProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string | string[];
  }>;
}>;

type ClientListCopy = Readonly<{
  active: string;
  activeCount: string;
  address: string;
  contactEmail: string;
  contactName: string;
  contactNotes: string;
  contactPhone: string;
  edit: string;
  empty: string;
  inactive: string;
  inactiveCount: string;
  loadError: string;
  notAvailable: string;
  search: string;
  searchLabel: string;
  updatedAt: string;
}>;

function normalizeQuery(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (typeof rawValue !== "string") {
    return "";
  }

  return rawValue.trim().slice(0, 120);
}

function formatDateTime(value: string | null, locale: Locale) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function displayValue(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value : fallback;
}

function clientFormCopy(
  messages: ReturnType<typeof getMessages>,
): ClientFormCopy {
  return {
    addressLabel: t(messages, "adminClients.fields.address"),
    contactEmailLabel: t(messages, "adminClients.fields.contactEmail"),
    contactNameLabel: t(messages, "adminClients.fields.contactName"),
    contactNotesLabel: t(messages, "adminClients.fields.contactNotes"),
    contactPhoneLabel: t(messages, "adminClients.fields.contactPhone"),
    createSubmit: t(messages, "adminClients.actions.create"),
    createTitle: t(messages, "adminClients.createTitle"),
    errorMessage: t(messages, "adminClients.feedback.error"),
    fieldError: t(messages, "validation.generic"),
    nameLabel: t(messages, "adminClients.fields.name"),
    successCreated: t(messages, "adminClients.feedback.created"),
    successUpdated: t(messages, "adminClients.feedback.updated"),
    updateSubmit: t(messages, "actions.save"),
    updateTitle: t(messages, "adminClients.editTitle"),
  };
}

function clientStatusCopy(
  messages: ReturnType<typeof getMessages>,
): ClientStatusCopy {
  return {
    deactivate: t(messages, "actions.deactivate"),
    errorMessage: t(messages, "adminClients.feedback.error"),
    reactivate: t(messages, "adminClients.actions.reactivate"),
    success: t(messages, "adminClients.feedback.statusUpdated"),
  };
}

function clientListCopy(
  messages: ReturnType<typeof getMessages>,
): ClientListCopy {
  return {
    active: t(messages, "adminClients.status.active"),
    activeCount: t(messages, "adminClients.summary.active"),
    address: t(messages, "adminClients.fields.address"),
    contactEmail: t(messages, "adminClients.fields.contactEmail"),
    contactName: t(messages, "adminClients.fields.contactName"),
    contactNotes: t(messages, "adminClients.fields.contactNotes"),
    contactPhone: t(messages, "adminClients.fields.contactPhone"),
    edit: t(messages, "actions.edit"),
    empty: t(messages, "adminClients.empty"),
    inactive: t(messages, "adminClients.status.inactive"),
    inactiveCount: t(messages, "adminClients.summary.inactive"),
    loadError: t(messages, "adminClients.feedback.loadError"),
    notAvailable: t(messages, "adminClients.notAvailable"),
    search: t(messages, "actions.search"),
    searchLabel: t(messages, "adminClients.searchLabel"),
    updatedAt: t(messages, "adminClients.fields.updatedAt"),
  };
}

function Detail({
  label,
  value,
}: Readonly<{
  label: string;
  value: string;
}>) {
  return (
    <div className="grid gap-1">
      <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
        {label}
      </dt>
      <dd className="text-on-surface text-sm">{value}</dd>
    </div>
  );
}

function StatusPill({
  client,
  copy,
}: Readonly<{
  client: AdminClientListItem;
  copy: ClientListCopy;
}>) {
  return (
    <span
      className={
        client.isActive
          ? "bg-secondary-container text-on-secondary-container inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-normal uppercase"
          : "bg-surface-container text-on-surface-variant inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-normal uppercase"
      }
    >
      {client.isActive ? copy.active : copy.inactive}
    </span>
  );
}

function ClientCard({
  client,
  copy,
  formCopy,
  locale,
  statusCopy,
}: Readonly<{
  client: AdminClientListItem;
  copy: ClientListCopy;
  formCopy: ClientFormCopy;
  locale: Locale;
  statusCopy: ClientStatusCopy;
}>) {
  const updatedAt = formatDateTime(client.updatedAt, locale);

  return (
    <article className="border-outline-variant bg-surface-container-lowest rounded border p-4">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-heading text-primary-container min-w-0 text-xl font-bold">
              {client.name}
            </h2>
            <StatusPill client={client} copy={copy} />
          </div>

          <dl className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Detail
              label={copy.address}
              value={displayValue(client.address, copy.notAvailable)}
            />
            <Detail
              label={copy.contactName}
              value={displayValue(
                client.contactInfo.contactName,
                copy.notAvailable,
              )}
            />
            <Detail
              label={copy.contactEmail}
              value={displayValue(client.contactInfo.email, copy.notAvailable)}
            />
            <Detail
              label={copy.contactPhone}
              value={displayValue(client.contactInfo.phone, copy.notAvailable)}
            />
            <Detail
              label={copy.contactNotes}
              value={displayValue(client.contactInfo.notes, copy.notAvailable)}
            />
            <Detail
              label={copy.updatedAt}
              value={updatedAt ?? copy.notAvailable}
            />
          </dl>
        </div>

        <ClientStatusForm
          clientId={client.id}
          copy={statusCopy}
          isActive={client.isActive}
          locale={locale}
        />
      </div>

      <details className="border-outline-variant mt-4 border-t pt-4">
        <summary className="text-primary-container cursor-pointer text-sm font-bold tracking-normal uppercase">
          {copy.edit}
        </summary>
        <div className="mt-4">
          <ClientForm
            client={client}
            copy={formCopy}
            formIdPrefix={`client-${client.id}`}
            locale={locale}
            mode="update"
          />
        </div>
      </details>
    </article>
  );
}

export default async function AdminClientsPage({
  params,
  searchParams,
}: AdminClientsPageProps) {
  const { locale: rawLocale } = await params;
  const resolvedSearchParams = await searchParams;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale;
  const query = normalizeQuery(resolvedSearchParams.q);
  const messages = getMessages(locale);
  const formCopy = clientFormCopy(messages);
  const statusCopy = clientStatusCopy(messages);
  const listCopy = clientListCopy(messages);
  const result = await listAdminClients(locale, query);
  const activeCount = result.clients.filter((client) => client.isActive).length;
  const inactiveCount = result.clients.length - activeCount;

  return (
    <section className="grid gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <h1 className="font-heading text-primary-container text-2xl font-bold">
          {t(messages, "navigation.admin.clients")}
        </h1>
        <dl className="grid grid-cols-2 gap-3 sm:w-fit">
          <div className="bg-surface-container-low rounded p-3">
            <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
              {listCopy.activeCount}
            </dt>
            <dd className="font-heading text-primary-container text-2xl font-bold">
              {activeCount}
            </dd>
          </div>
          <div className="bg-surface-container-low rounded p-3">
            <dt className="text-on-surface-variant text-xs font-bold tracking-normal uppercase">
              {listCopy.inactiveCount}
            </dt>
            <dd className="font-heading text-primary-container text-2xl font-bold">
              {inactiveCount}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]">
        <aside className="border-outline-variant bg-surface-container-lowest h-fit rounded border p-4">
          <ClientForm
            copy={formCopy}
            formIdPrefix="new-client"
            locale={locale}
            mode="create"
          />
        </aside>

        <div className="grid min-w-0 gap-4">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <SearchInput
              className="sm:flex-1"
              defaultValue={query}
              id="client-search"
              label={listCopy.searchLabel}
              maxLength={120}
              name="q"
            />
            <Button icon={<Search aria-hidden="true" />} type="submit">
              {listCopy.search}
            </Button>
          </form>

          {!result.ok ? (
            <p className="border-error bg-error-container text-on-error-container rounded border px-3 py-2 text-sm">
              {listCopy.loadError}
            </p>
          ) : null}

          {result.ok && result.clients.length === 0 ? (
            <p className="border-outline-variant bg-surface-container-lowest text-on-surface-variant rounded border px-4 py-6 text-sm">
              {listCopy.empty}
            </p>
          ) : null}

          <div className="grid gap-3">
            {result.clients.map((client) => (
              <ClientCard
                client={client}
                copy={listCopy}
                formCopy={formCopy}
                key={client.id}
                locale={locale}
                statusCopy={statusCopy}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
