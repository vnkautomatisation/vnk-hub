"use client";

import { useEffect, useRef, useState } from "react";
import { IconCalendar, IconChevronDown, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

const FR_MONTHS_LONG  = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const FR_MONTHS_SHORT = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
const FR_DAYS         = ["L","M","M","J","V","S","D"];

function formatDate(d: Date) {
  return d.toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}
function isoToDate(iso: string): Date | null {
  if (!iso) return null;
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}
function dateToIso(d: Date) { return d.toISOString().slice(0, 10); }
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function buildCalendar(year: number, month: number): (Date | null)[] {
  const first   = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

type View = "days" | "months" | "years";

export interface DatePickerProps {
  value: string;
  onChange: (iso: string) => void;
  placeholder?: string;
  minWidth?: number | string;
}

export function DatePicker({ value, onChange, placeholder = "Sélectionner une date", minWidth }: DatePickerProps) {
  const [open, setOpen]   = useState(false);
  const today             = new Date();
  const selected          = isoToDate(value);
  const [view, setView]   = useState<View>("days");
  const [viewYear, setViewYear]   = useState(selected?.getFullYear()  ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth()     ?? today.getMonth());
  const [decadeStart, setDecadeStart] = useState(Math.floor((selected?.getFullYear() ?? today.getFullYear()) / 10) * 10);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent)   { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }
    function onKey(e: KeyboardEvent)  { if (e.key === "Escape") setOpen(false); }
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("keydown", onKey); };
  }, []);

  function openCalendar() {
    if (selected) { setViewYear(selected.getFullYear()); setViewMonth(selected.getMonth()); }
    setView("days");
    setOpen(true);
  }

  /* ── navigation helpers ── */
  function prevDays()  { if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); } else setViewMonth(m => m-1); }
  function nextDays()  { if (viewMonth === 11){ setViewYear(y => y+1); setViewMonth(0);  } else setViewMonth(m => m+1); }
  function prevYears() { setDecadeStart(d => d - 10); }
  function nextYears() { setDecadeStart(d => d + 10); }
  function prevMonths(){ setViewYear(y => y - 1); }
  function nextMonths(){ setViewYear(y => y + 1); }

  function selectDay(date: Date)  { onChange(dateToIso(date)); setOpen(false); }
  function selectMonth(month: number) { setViewMonth(month); setView("days"); }
  function selectYear(year: number)   { setViewYear(year); setDecadeStart(Math.floor(year/10)*10); setView("months"); }
  function goToday()  { onChange(dateToIso(today)); setOpen(false); }
  function clear()    { onChange(""); setOpen(false); }

  /* ── header label + toggle ── */
  function cycleView() {
    if (view === "days")   { setDecadeStart(Math.floor(viewYear/10)*10); setView("months"); }
    else if (view === "months") setView("years");
    else setView("days");
  }
  function headerLabel() {
    if (view === "days")    return `${FR_MONTHS_LONG[viewMonth]} ${viewYear}`;
    if (view === "months")  return String(viewYear);
    return `${decadeStart} – ${decadeStart + 9}`;
  }

  /* ── styles ── */
  const triggerStyle: React.CSSProperties = {
    height: 36, padding: "0 12px",
    background: "var(--bg-card)",
    border: open ? "0.5px solid var(--accent)" : "0.5px solid var(--border)",
    borderRadius: 8, fontSize: 13,
    color: selected ? "var(--text-1)" : "var(--text-2)",
    cursor: "pointer", display: "flex", alignItems: "center", gap: 8, outline: "none",
    whiteSpace: "nowrap",
    boxShadow: open ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
    minWidth: minWidth ?? "auto",
    transition: "border-color 150ms, box-shadow 150ms",
  };
  const navBtn: React.CSSProperties = {
    width: 28, height: 28, borderRadius: 6, border: "none",
    background: "transparent", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--text-2)", transition: "background 150ms",
  };
  const hoverBg  = (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = "var(--bg-hover)"; };
  const clearBg  = (e: React.MouseEvent<HTMLButtonElement>) => { (e.currentTarget).style.background = "transparent"; };

  const cells = buildCalendar(viewYear, viewMonth);

  return (
    <div ref={ref} style={{ position: "relative", minWidth: minWidth ?? "auto" }}>
      <button type="button" style={triggerStyle} onClick={openCalendar}>
        <IconCalendar size={15} style={{ color: "var(--text-3)", flexShrink: 0 }} />
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? formatDate(selected) : placeholder}
        </span>
        <IconChevronDown size={14} style={{ color: "var(--text-3)", flexShrink: 0, transition: "transform 150ms", transform: open ? "rotate(180deg)" : "none" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, width: 280,
          background: "var(--bg-surface)", border: "0.5px solid var(--border)",
          borderRadius: 12, padding: 16, boxShadow: "var(--shadow-lg)",
          zIndex: 200, animation: "select-fade-in 150ms ease",
        }}>

          {/* ── Header nav ── */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <button style={navBtn} type="button"
              onClick={view === "days" ? prevDays : view === "months" ? prevMonths : prevYears}
              onMouseEnter={hoverBg} onMouseLeave={clearBg}>
              <IconChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={cycleView}
              style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)", background: "transparent", border: "none", cursor: "pointer", padding: "4px 8px", borderRadius: 6, transition: "background 150ms" }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              {headerLabel()}
            </button>

            <button style={navBtn} type="button"
              onClick={view === "days" ? nextDays : view === "months" ? nextMonths : nextYears}
              onMouseEnter={hoverBg} onMouseLeave={clearBg}>
              <IconChevronRight size={16} />
            </button>
          </div>

          {/* ── Day grid ── */}
          {view === "days" && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 4 }}>
                {FR_DAYS.map((d, i) => (
                  <div key={i} style={{ fontSize: 11, color: "var(--text-3)", textAlign: "center", padding: "4px 0" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const isSel     = !!selected && sameDay(date, selected);
                  const isToday   = sameDay(date, today);
                  const otherMonth = date.getMonth() !== viewMonth;
                  return (
                    <button key={i} type="button" onClick={() => selectDay(date)} style={{
                      width: 34, height: 34, borderRadius: 8, fontSize: 13,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", border: "none",
                      background: isSel ? "var(--accent)" : "transparent",
                      color: isSel ? "#fff" : otherMonth ? "var(--text-3)" : "var(--text-2)",
                      fontWeight: isSel ? 600 : 400, opacity: otherMonth ? 0.4 : 1,
                      outline: !isSel && isToday ? "0.5px solid var(--accent)" : "none",
                      transition: "background 100ms, color 100ms",
                    }}
                      onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                      onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = otherMonth ? "var(--text-3)" : "var(--text-2)"; } }}
                    >{date.getDate()}</button>
                  );
                })}
              </div>
            </>
          )}

          {/* ── Month grid ── */}
          {view === "months" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
              {FR_MONTHS_SHORT.map((name, i) => {
                const isSel = !!selected && selected.getFullYear() === viewYear && selected.getMonth() === i;
                const isCur = today.getFullYear() === viewYear && today.getMonth() === i;
                return (
                  <button key={i} type="button" onClick={() => selectMonth(i)} style={{
                    padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: isSel ? 600 : 400,
                    border: "none", cursor: "pointer",
                    background: isSel ? "var(--accent)" : "transparent",
                    color: isSel ? "#fff" : "var(--text-2)",
                    outline: !isSel && isCur ? "0.5px solid var(--accent)" : "none",
                    transition: "background 100ms, color 100ms",
                  }}
                    onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                    onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
                  >{name}</button>
                );
              })}
            </div>
          )}

          {/* ── Year grid ── */}
          {view === "years" && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {Array.from({ length: 12 }, (_, i) => decadeStart - 1 + i).map((yr) => {
                const isSel  = !!selected && selected.getFullYear() === yr;
                const isCur  = today.getFullYear() === yr;
                const outside = yr < decadeStart || yr > decadeStart + 9;
                return (
                  <button key={yr} type="button" onClick={() => selectYear(yr)} style={{
                    padding: "10px 0", borderRadius: 8, fontSize: 13, fontWeight: isSel ? 600 : 400,
                    border: "none", cursor: "pointer",
                    background: isSel ? "var(--accent)" : "transparent",
                    color: isSel ? "#fff" : outside ? "var(--text-3)" : "var(--text-2)",
                    opacity: outside ? 0.5 : 1,
                    outline: !isSel && isCur ? "0.5px solid var(--accent)" : "none",
                    transition: "background 100ms, color 100ms",
                  }}
                    onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.background = "var(--bg-hover)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                    onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = outside ? "var(--text-3)" : "var(--text-2)"; } }}
                  >{yr}</button>
                );
              })}
            </div>
          )}

          {/* ── Footer ── */}
          <div style={{ borderTop: "0.5px solid var(--border)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={goToday}>Aujourd&apos;hui</button>
            <button type="button" className="btn btn-ghost btn-sm" style={{ color: "var(--danger)" }} onClick={clear}>Effacer</button>
          </div>
        </div>
      )}
    </div>
  );
}
