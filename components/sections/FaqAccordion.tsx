"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { faqs } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function FaqAccordion() {
  const [open, setOpen] = useState(0);

  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-white">
      {faqs.map((item, index) => (
        <div key={item.question}>
          <h3>
            <button
              aria-controls={`faq-${index}`}
              aria-expanded={open === index}
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left text-base font-semibold text-ink transition hover:bg-paper/70 focus:outline-none focus-visible:shadow-focus md:px-7"
              onClick={() => setOpen(open === index ? -1 : index)}
              id={`faq-button-${index}`}
              type="button"
            >
              <span>{item.question}</span>
              <ChevronDown
                aria-hidden="true"
                className={cn(
                  "shrink-0 transition",
                  open === index && "rotate-180",
                )}
                size={18}
              />
            </button>
          </h3>
          <div
            aria-hidden={open !== index}
            aria-labelledby={`faq-button-${index}`}
            className={cn(
              "grid transition-all duration-200",
              open === index ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
            )}
            id={`faq-${index}`}
            role="region"
          >
            <div className="overflow-hidden">
              <p className="px-5 pb-5 text-sm leading-6 text-muted md:px-7">
                {item.answer}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
