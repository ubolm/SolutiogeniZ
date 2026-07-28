import Image from "next/image";

import { CrmLoginForm } from "@/components/crm/CrmLoginForm";

export const dynamic = "force-dynamic";

export default function CrmLoginPage({
  searchParams,
}: {
  searchParams?: { next?: string };
}) {
  const nextPath =
    typeof searchParams?.next === "string" &&
    searchParams.next.startsWith("/crm")
      ? searchParams.next
      : "/crm";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0">
        <Image
          alt="Fondo espacial"
          className="object-cover object-center"
          fill
          priority
          sizes="100vw"
          src="/crm-login-space-bg.png"
        />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,6,18,0.28)_0%,rgba(7,8,20,0.78)_65%,rgba(4,5,14,0.9)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(108,43,255,0.24)_0%,rgba(108,43,255,0.08)_28%,rgba(6,8,20,0)_56%)]" />

      <section className="relative w-full max-w-[25rem] overflow-hidden rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(16,10,36,0.82)_0%,rgba(13,10,30,0.74)_100%)] px-6 py-7 text-white shadow-[0_24px_80px_rgba(4,6,20,0.5)] backdrop-blur-[14px] sm:px-7 sm:py-8">
        <div className="pointer-events-none absolute inset-x-6 top-[9.8rem] h-14 rounded-full bg-[radial-gradient(circle,rgba(124,58,237,0.88)_0%,rgba(111,44,245,0.44)_46%,rgba(111,44,245,0)_100%)] blur-[14px]" />
        <div className="relative z-10">
          <div className="flex justify-center">
            <div className="relative h-16 w-72 sm:h-20 sm:w-80">
              <Image
                alt="SolutiogeniZ"
                className="object-contain"
                fill
                priority
                sizes="(max-width: 640px) 288px, 320px"
                src="/crm-login-logo.png"
              />
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-base text-white/78">
              Ingresa tus credenciales para acceder.
            </p>
          </div>

          <div className="mt-7">
            <CrmLoginForm nextPath={nextPath} />
          </div>
        </div>
      </section>
    </main>
  );
}
