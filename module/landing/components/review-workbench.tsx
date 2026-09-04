"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AlertTriangle, Check, GitPullRequest, ShieldCheck } from "lucide-react";

const findings = [
  {
    file: "payments/checkout.ts",
    line: "Line 84",
    severity: "High risk",
    title: "Missing idempotency guard",
    detail: "A retried request can issue the same charge twice before the transaction settles.",
    color: "text-rose-300",
  },
  {
    file: "auth/session.ts",
    line: "Line 41",
    severity: "Security",
    title: "Session scope widened",
    detail: "This token now inherits organization access. Verify the new scope is intentional.",
    color: "text-amber-300",
  },
  {
    file: "api/cache.ts",
    line: "Line 126",
    severity: "Resolved",
    title: "Stale read path removed",
    detail: "The updated cache key correctly isolates results across project environments.",
    color: "text-emerald-300",
  },
];

function ReviewWorkbench() {
  const [active, setActive] = useState(0);
  const reduceMotion = useReducedMotion();
  const finding = findings[active];

  return (
    <div className="relative mx-auto w-full max-w-[1120px] overflow-hidden rounded-2xl border border-white/10 bg-[#080a0f]/95 shadow-[0_45px_140px_-50px_rgba(34,211,238,0.28)]">
      <div className="flex h-12 items-center justify-between border-b border-white/[0.07] px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            <span className="size-2 rounded-full bg-white/15" />
            <span className="size-2 rounded-full bg-white/10" />
            <span className="size-2 rounded-full bg-white/[0.07]" />
          </div>
          <span className="font-mono text-[10px] text-white/40">orvix / checkout-refactor</span>
        </div>
        <span className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300/75">
          <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_rgba(110,231,183,0.8)]" />
          Analysis complete
        </span>
      </div>

      <div className="grid min-h-[500px] lg:grid-cols-[220px_1fr_300px]">
        <aside className="hidden border-r border-white/[0.07] p-4 lg:block">
          <p className="mb-4 px-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/35">Changed files</p>
          {findings.map((item, index) => (
            <button
              key={item.file}
              type="button"
              onClick={() => setActive(index)}
              className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left font-mono text-[10px] transition-colors ${
                active === index ? "bg-white/[0.07] text-white/85" : "text-white/38 hover:bg-white/[0.035] hover:text-white/65"
              }`}
            >
              <span className={`size-1.5 rounded-full ${index === 2 ? "bg-emerald-300" : "bg-amber-300"}`} />
              <span className="truncate">{item.file.split("/")[1]}</span>
              <span className="ml-auto text-white/25">M</span>
            </button>
          ))}
        </aside>

        <div className="relative overflow-hidden border-r border-white/[0.07] bg-[#07090d] px-5 py-6 sm:px-8">
          <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:100%_26px]" />
          <div className="relative mb-6 flex items-center gap-2 font-mono text-[10px] text-white/38">
            <GitPullRequest className="size-3.5" />
            <span>PR #284</span>
            <span>/</span>
            <span>{finding.file}</span>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={finding.file}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="relative space-y-1 font-mono text-[11px] leading-[26px] text-white/46"
            >
              <CodeLine number={78} text="const payment = await gateway.charge({" />
              <CodeLine number={79} text="  customerId," accent="cyan" />
              <CodeLine number={80} text="  amount: total," accent="cyan" />
              <CodeLine number={81} text="  currency: order.currency," />
              <CodeLine number={82} text="});" />
              <CodeLine number={83} text="" />
              <CodeLine number={84} text="await orders.markPaid(order.id);" accent={active === 2 ? "green" : "red"} />
              <CodeLine number={85} text="return { payment, order };" />
            </motion.div>
          </AnimatePresence>

          <motion.div
            aria-hidden="true"
            animate={reduceMotion ? undefined : { x: ["-110%", "180%"] }}
            transition={{ duration: 4.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
            className="absolute inset-y-0 w-24 bg-gradient-to-r from-transparent via-cyan-300/[0.035] to-transparent"
          />
        </div>

        <aside className="relative p-5 sm:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={finding.title}
              initial={reduceMotion ? false : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
            >
              <span className={`flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.15em] ${finding.color}`}>
                {active === 2 ? <Check className="size-3" /> : <AlertTriangle className="size-3" />}
                {finding.severity}
              </span>
              <p className="mt-5 text-lg font-medium tracking-[-0.03em] text-white">{finding.title}</p>
              <p className="mt-3 text-xs leading-5 text-white/48">{finding.detail}</p>
              <div className="mt-5 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 font-mono text-[9px] text-white/38">
                {finding.line} · confidence 94%
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-x-5 bottom-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[10px] text-white/38 sm:inset-x-6">
            <ShieldCheck className="size-3.5 text-cyan-300/70" />
            Repository context included
          </div>
        </aside>
      </div>
    </div>
  );
}

function CodeLine({ number, text, accent }: { number: number; text: string; accent?: "cyan" | "red" | "green" }) {
  const accentClass = {
    cyan: "bg-cyan-300/[0.04] text-cyan-100/65",
    red: "bg-rose-400/[0.09] text-rose-100/75",
    green: "bg-emerald-400/[0.08] text-emerald-100/70",
  }[accent ?? "cyan"];

  return (
    <div className={`flex rounded px-2 ${accent ? accentClass : ""}`}>
      <span className="mr-5 w-5 select-none text-right text-white/18">{number}</span>
      <span>{text || "\u00A0"}</span>
    </div>
  );
}

export { ReviewWorkbench };
