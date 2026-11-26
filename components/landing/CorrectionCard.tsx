"use client";

import { useState } from "react";

/**
 * The landing page's signature: a German "Karteikarte" (lined index card)
 * with a learner's sentence and a teacher's red-pen correction. One button
 * reveals the reason, exactly as the app explains it.
 */
export function CorrectionCard({
  task,
  why,
  hide,
  explanation,
  handClassName,
}: {
  task: string;
  why: string;
  hide: string;
  explanation: string;
  /** Class that applies the handwriting font. */
  handClassName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="relative">
        {/* The card behind, so it reads as a stack of index cards. */}
        <div
          aria-hidden
          className="absolute inset-0 translate-x-2 translate-y-2 rounded-[3px] border border-[#efe9de]/20 bg-[#1a1915]"
        />
        <figure className="relative overflow-hidden rounded-[3px] border border-[#d8cfbd] bg-[#f5f0e6] text-[#1d1b17]">
          <figcaption className="border-b-2 border-[#e2462c] px-6 pb-3 pt-5 font-mono text-[11px] leading-relaxed text-[#6b655a]">
            {task}
          </figcaption>
          <div
            className="px-6 pb-8 pt-10"
            style={{
              backgroundImage: "repeating-linear-gradient(transparent 0 47px, #c4d3e6 47px 48px)",
              backgroundPositionY: "31px",
            }}
          >
            <p
              lang="de"
              className={`${handClassName} text-[1.9rem] leading-[48px] text-[#24344f] sm:text-[2.1rem]`}
            >
              Ich habe im Urlaub mit{" "}
              <span className="relative inline-block">
                <span className="pen-strike">meine</span>
                <span
                  aria-hidden
                  className="pen-write absolute -top-7 left-1 -rotate-3 whitespace-nowrap text-[1.6rem] font-bold text-red"
                >
                  meinem
                </span>
              </span>{" "}
              Freund Fußball gespielt.
            </p>
            <p
              aria-hidden
              className={`${handClassName} pen-write mt-2 -rotate-2 pr-3 text-right text-2xl font-bold text-red [animation-delay:1300ms]`}
            >
              mit + Dativ!
            </p>
          </div>
        </figure>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="self-start font-mono text-xs text-[#e2462c] underline decoration-[#e2462c]/40 underline-offset-4 hover:decoration-[#e2462c]"
        >
          {open ? hide : why}
        </button>
        {open && (
          <p className="max-w-[46ch] border-l-2 border-[#e2462c] pl-4 text-sm leading-relaxed text-[#efe9de]">
            {explanation}
          </p>
        )}
      </div>
    </div>
  );
}
