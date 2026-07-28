"use client";

type CrmSystemLoadingProps = {
  fullscreen?: boolean;
  title?: string;
  subtitle?: string;
};

export function CrmSystemLoading({
  fullscreen = true,
  title = "Iniciando sistema",
  subtitle = "Sincronizando acceso seguro y preparando el entorno.",
}: CrmSystemLoadingProps) {
  return (
    <div
      className={`relative overflow-hidden ${
        fullscreen ? "min-h-screen" : "min-h-[18rem]"
      }`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#131b4a_0%,#090d1c_42%,#05070f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(16,21,55,0.18)_0%,rgba(10,12,24,0.82)_72%,rgba(5,7,15,0.96)_100%)]" />
      <div className="absolute left-1/2 top-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(89,71,255,0.32)_0%,rgba(89,71,255,0.18)_34%,rgba(89,71,255,0)_72%)] blur-2xl" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(173,184,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(173,184,255,0.08)_1px,transparent_1px)] [background-size:2.8rem_2.8rem]" />

      <div className="relative z-10 flex min-h-inherit items-center justify-center px-6 py-12">
        <section className="w-full max-w-[28rem] rounded-[2rem] border border-white/20 bg-[linear-gradient(180deg,rgba(13,17,38,0.8)_0%,rgba(10,12,28,0.72)_100%)] px-7 py-8 text-white shadow-[0_28px_90px_rgba(0,0,0,0.42)] backdrop-blur-[16px]">
          <div className="flex justify-center">
            <div className="relative h-36 w-36">
              <div className="absolute inset-0 rounded-full border border-[#7386ff]/35" />
              <div className="absolute inset-3 rounded-full border border-dashed border-[#a78bfa]/40 animate-spin [animation-duration:7s]" />
              <div className="absolute inset-7 rounded-full border border-[#5b6cff]/50 animate-pulse" />
              <div className="absolute left-1/2 top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#ffffff_0%,#8ea2ff_38%,#5b6cff_100%)] shadow-[0_0_30px_rgba(110,128,255,0.8)]" />
              <div className="absolute left-1/2 top-3 h-3 w-3 -translate-x-1/2 rounded-full bg-[#b7c1ff] shadow-[0_0_14px_rgba(183,193,255,0.85)]" />
              <div className="absolute bottom-6 right-4 h-2.5 w-2.5 rounded-full bg-[#8b5cf6] shadow-[0_0_14px_rgba(139,92,246,0.9)]" />
              <div className="absolute left-5 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[#38bdf8] shadow-[0_0_14px_rgba(56,189,248,0.9)]" />
            </div>
          </div>

          <div className="mt-7 text-center">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.34em] text-[#93a4ff]">
              SolutiogeniZ
            </p>
            <h2 className="mt-3 font-heading text-3xl font-semibold text-white">
              {title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/68">{subtitle}</p>
          </div>

          <div className="mt-7 space-y-3">
            <LoadingMetric
              label="Validando identidad"
              value="OK"
              width="w-[92%]"
            />
            <LoadingMetric
              label="Montando panel seguro"
              value="SYNC"
              width="w-[74%]"
            />
            <LoadingMetric
              label="Cargando modulos"
              value="LIVE"
              width="w-[58%]"
            />
          </div>

          <div className="mt-7 rounded-[1.25rem] border border-white/10 bg-white/[0.03] px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[0.68rem] uppercase tracking-[0.24em] text-white/42">
                Estado
              </span>
              <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold text-[#92f2c0]">
                <span className="h-2 w-2 rounded-full bg-[#34d399] shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                En linea
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function LoadingMetric({
  label,
  value,
  width,
}: {
  label: string;
  value: string;
  width: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-white/74">{label}</span>
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-[#9bb0ff]">
          {value}
        </span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-white/8">
        <div
          className={`h-full ${width} rounded-full bg-[linear-gradient(90deg,#4454f5_0%,#7c3aed_52%,#60a5fa_100%)] shadow-[0_0_16px_rgba(96,165,250,0.6)]`}
        />
      </div>
    </div>
  );
}
