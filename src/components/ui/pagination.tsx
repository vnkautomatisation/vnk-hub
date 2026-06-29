import Link from "next/link";

export function Pagination({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number;
  totalPages: number;
  buildHref: (page: number) => string;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex items-center justify-end gap-1 text-[13px]">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage === 1}
        className="rounded-lg border-[0.5px] px-3 py-1.5"
        style={{
          borderColor: "var(--border-strong)",
          color: currentPage === 1 ? "var(--text-3)" : "var(--text-1)",
          pointerEvents: currentPage === 1 ? "none" : "auto",
        }}
      >
        Précédent
      </Link>
      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          className="rounded-lg px-3 py-1.5"
          style={
            p === currentPage
              ? { background: "var(--accent-gradient)", color: "#fff" }
              : { color: "var(--text-2)" }
          }
        >
          {p}
        </Link>
      ))}
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage === totalPages}
        className="rounded-lg border-[0.5px] px-3 py-1.5"
        style={{
          borderColor: "var(--border-strong)",
          color: currentPage === totalPages ? "var(--text-3)" : "var(--text-1)",
          pointerEvents: currentPage === totalPages ? "none" : "auto",
        }}
      >
        Suivant
      </Link>
    </div>
  );
}
