/** Quick visual of a store's last 10 visits — green dot ordered, red dot no order. */
export function VisitHistoryDots({ history }: { history: boolean[] }) {
  if (history.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-0.5" title="Last 10 visits (newest first): green = order, red = no order">
      {history.map((hadOrder, i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full ${hadOrder ? "bg-green-500" : "bg-red-500"}`}
        />
      ))}
    </span>
  );
}
