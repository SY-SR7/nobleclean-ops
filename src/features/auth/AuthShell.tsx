import type { ReactNode } from "react";
import Image from "next/image";

import { cn } from "@/lib/cn";

type AuthShellProps = Readonly<{
  appName: string;
  body?: ReactNode;
  cardClassName?: string;
  children?: ReactNode;
  headingId: string;
  logoAlt: string;
  title: string;
}>;

export function AuthShell({
  appName,
  body,
  cardClassName,
  children,
  headingId,
  logoAlt,
  title,
}: AuthShellProps) {
  return (
    <main className="bg-surface flex min-h-screen items-center justify-center px-4 py-8 sm:py-10">
      <section
        aria-labelledby={headingId}
        className={cn(
          "border-outline-variant bg-surface-container-lowest shadow-level-1 w-full max-w-sm rounded-lg border p-6 sm:p-8",
          cardClassName,
        )}
      >
        <div className="mb-6 grid gap-4">
          <div className="flex justify-center">
            <Image
              alt={logoAlt}
              className="h-auto w-full max-w-[252px]"
              height={56}
              priority
              sizes="(max-width: 640px) 76vw, 252px"
              src="/logo.png"
              width={252}
            />
          </div>
          <div>
            <p className="text-secondary text-xs font-bold tracking-normal uppercase">
              {appName}
            </p>
            <h1
              className="font-heading text-primary-container mt-2 text-2xl font-bold"
              id={headingId}
            >
              {title}
            </h1>
            {body ? (
              <p className="text-on-surface-variant mt-3 text-sm leading-6">
                {body}
              </p>
            ) : null}
          </div>
        </div>

        {children}
      </section>
    </main>
  );
}
