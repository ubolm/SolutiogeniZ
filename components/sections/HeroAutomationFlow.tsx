"use client";

import {
  BellRing,
  CheckCircle2,
  ClipboardPlus,
  MessageSquareText,
  Send,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const flowSteps = [
  {
    title: "Consulta recibida",
    status: "Entrada detectada",
    icon: MessageSquareText,
  },
  {
    title: "Registro automático",
    status: "Información guardada",
    icon: ClipboardPlus,
  },
  {
    title: "Respuesta enviada",
    status: "Cliente informado",
    icon: Send,
  },
  {
    title: "Seguimiento activo",
    status: "Recordatorio programado",
    icon: BellRing,
  },
];

const flowResults = [
  "Información ordenada",
  "Respuesta rápida",
  "Seguimiento constante",
];

export function HeroAutomationFlow() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative rounded-[2rem] border border-white bg-white p-4 shadow-soft">
      <div className="rounded-[1.5rem] bg-night p-5 text-white sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-aqua">
              Automatización en acción
            </p>
            <p className="font-heading mt-1 text-lg font-semibold">
              De la consulta al seguimiento
            </p>
          </div>
          <span className="rounded-full border border-aqua/25 bg-aqua/10 px-3 py-1 text-xs font-semibold text-aqua">
            Activo
          </span>
        </div>

        <div className="grid gap-3">
          {flowSteps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div className="relative pl-10 sm:pl-11" key={step.title}>
                {index < flowSteps.length - 1 ? (
                  <span
                    aria-hidden="true"
                    className="absolute left-[1rem] top-9 h-[calc(100%+0.45rem)] w-px bg-white/15 sm:left-[1.1rem]"
                  />
                ) : null}
                <motion.div
                  animate={
                    reduceMotion
                      ? undefined
                      : {
                          opacity: [0.8, 1, 0.88],
                        }
                  }
                  className="flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.06] p-3.5"
                  transition={{
                    delay: index * 0.08,
                    duration: 0.45,
                    ease: "easeOut",
                  }}
                >
                  <span className="absolute left-0 grid h-8 w-8 place-items-center rounded-full border border-aqua/20 bg-white text-xs font-bold text-primary-strong sm:h-9 sm:w-9">
                    {index + 1}
                  </span>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-white/10 text-aqua">
                    <Icon aria-hidden="true" size={17} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {step.title}
                    </p>
                    <p className="mt-0.5 text-xs text-white/62">
                      {step.status}
                    </p>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid gap-2 sm:grid-cols-3">
          {flowResults.map((item, index) => (
            <motion.div
              animate={reduceMotion ? undefined : { opacity: [0.82, 1, 0.9] }}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-center text-xs font-medium text-white/84"
              key={item}
              transition={{ delay: 0.2 + index * 0.06, duration: 0.4 }}
            >
              {item}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
