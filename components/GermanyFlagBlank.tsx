"use client";

import { useState } from "react";
import { Sparkles, Trophy, Award, Sliders, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

interface GermanyFlagBlankProps {
  /** Real progress percentage calculated from user's words (0 to 100) */
  realProgress: number;
  totalWords: number;
  masteredWords: number;
  learningWords: number;
}

export function GermanyFlagBlank({
  realProgress,
  totalWords,
  masteredWords,
  learningWords,
}: GermanyFlagBlankProps) {
  const [customProgress, setCustomProgress] = useState<number | null>(null);
  const [interactiveMode, setInteractiveMode] = useState(false);

  // Current percentage (0 to 100)
  const progressPercent = Math.min(
    100,
    Math.max(0, interactiveMode && customProgress !== null ? customProgress : realProgress)
  );

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-6">
      {/* Flag Blank Hero Card */}
      <div className="relative w-full rounded-2xl border border-white/10 bg-[#0d0e12]/80 backdrop-blur-xl p-6 sm:p-8 shadow-2xl overflow-hidden group">
        
        {/* Subtle Background Glow behind card */}
        <div 
          className="absolute -inset-1 opacity-20 blur-2xl transition-all duration-700 pointer-events-none rounded-2xl"
          style={{
            background: `linear-gradient(90deg, rgba(221,0,0,${progressPercent/200}) 0%, rgba(255,204,0,${progressPercent/150}) 100%)`
          }}
        />

        {/* Top Card Bar: Badges */}
        <div className="relative z-10 flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Flag className="h-3.5 w-3.5" />
            </div>
            <span className="text-xs font-medium tracking-wider uppercase text-neutral-400">
              Gelişim Blank Metresi
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-neutral-400">
              {masteredWords} / {totalWords} Kelime Tamam
            </span>
            <button
              onClick={() => {
                setInteractiveMode(!interactiveMode);
                if (!interactiveMode) setCustomProgress(realProgress);
              }}
              title="Test sliderını aç/kapat"
              className={cn(
                "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-all border",
                interactiveMode
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : "bg-white/5 text-neutral-400 border-white/10 hover:text-white"
              )}
            >
              <Sliders className="h-3 w-3" />
              <span>{interactiveMode ? "Simülasyon" : "Canlı"}</span>
            </button>
          </div>
        </div>

        {/* MAIN GERMANY FLAG BLANK CONTAINER */}
        <div className="relative z-10 flex flex-col items-center">
          
          {/* THE BLANK SHAPE CONTAINER */}
          <div className="relative w-full h-36 sm:h-44 rounded-xl border-2 border-white/20 bg-[#090a0d] overflow-hidden shadow-inner flex flex-col justify-between p-1">

            {/* Empty Wireframe Grid overlay (the "blank" background) */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)`,
                backgroundSize: '16px 16px'
              }}
            />

            {/* 
              GERMANY FLAG FILLING LAYER (Masked horizontally by progressPercent)
            */}
            <div 
              className="absolute top-0 left-0 bottom-0 transition-all duration-700 ease-out flex flex-col justify-between overflow-hidden shadow-2xl"
              style={{ width: `${progressPercent}%` }}
            >
              {/* Stripe 1: Schwarz (Black) */}
              <div className="h-[33.33%] w-full bg-gradient-to-r from-[#0a0a0c] via-[#1a1b20] to-[#0d0e12] border-b border-black/40 flex items-center px-4">
                <span className="text-[10px] tracking-widest text-neutral-400 opacity-60 font-mono uppercase">
                  DEUTSCHLAND
                </span>
              </div>

              {/* Stripe 2: Rot (Red) */}
              <div className="h-[33.33%] w-full bg-gradient-to-r from-[#cc0000] via-[#ee0000] to-[#dd0000] border-b border-red-900/50 flex items-center px-4 shadow-sm">
                <span className="text-[10px] tracking-widest text-white/80 font-mono uppercase">
                  GERMANIA
                </span>
              </div>

              {/* Stripe 3: Gold (Yellow) */}
              <div className="h-[33.34%] w-full bg-gradient-to-r from-[#e6b800] via-[#ffcc00] to-[#ffd700] flex items-center px-4">
                <span className="text-[10px] tracking-widest text-amber-950/80 font-mono font-semibold uppercase">
                  PROGRESS
                </span>
              </div>

              {/* Edge Scanner Beam Line at the fill border */}
              {progressPercent > 0 && progressPercent < 100 && (
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_12px_#ffffff,0_0_20px_#ffcc00] z-20 animate-pulse" />
              )}
            </div>

            {/* OVERLAY TEXT / SILHOUETTE INSIDE THE BLANK */}
            <div className="relative z-20 h-full w-full flex flex-col items-center justify-center text-center p-4 pointer-events-none mix-blend-difference">
              <span className="font-display text-3xl sm:text-5xl font-bold tracking-widest text-white drop-shadow-md">
                LERNKARTE
              </span>
              <span className="text-xs sm:text-sm tracking-widest font-mono text-neutral-200 mt-1 uppercase">
                {progressPercent === 100 
                  ? "🇩🇪 %100 ALMANYA BAYRAĞI TAMAMLANDI!" 
                  : `%${Math.round(progressPercent)} BAYRAK DOLULUK ORANI`}
              </span>
            </div>

          </div>

          {/* Progress Indicator Slider (if interactive simulation enabled) */}
          {interactiveMode && (
            <div className="w-full mt-4 flex flex-col gap-1 bg-white/5 p-3 rounded-lg border border-white/10">
              <div className="flex justify-between text-xs text-neutral-300">
                <span>Test Simülatörü: Gelişim Düzeyi</span>
                <span className="font-mono text-amber-400 font-bold">%{Math.round(progressPercent)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={progressPercent}
                onChange={(e) => setCustomProgress(Number(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
              />
            </div>
          )}

        </div>

        {/* Bottom Metrics Pills */}
        <div className="relative z-10 mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400">Genel Düzey</span>
            <span className="text-lg font-bold font-mono text-white">
              %{Math.round(realProgress)}
            </span>
          </div>

          <div className="flex flex-col items-center border-x border-white/10">
            <span className="text-xs text-neutral-400">Öğrenilen</span>
            <span className="text-lg font-bold font-mono text-emerald-400">
              {masteredWords}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-xs text-neutral-400">Öğrenilmekte</span>
            <span className="text-lg font-bold font-mono text-sky-400">
              {learningWords}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
