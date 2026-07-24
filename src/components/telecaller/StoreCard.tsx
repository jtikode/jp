import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { buildTelLink, buildWhatsAppLink } from "@/lib/waLink";

interface StoreCardProps {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  outstanding?: number;
}

export function StoreCard({ id, name, address, phone, outstanding }: StoreCardProps) {
  return (
    <Card>
      <Link href={`/telecaller/stores/${id}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-slate-900">{name}</p>
            <p className="text-sm text-slate-500">{address}</p>
          </div>
          {outstanding != null && outstanding > 0 && (
            <span className="whitespace-nowrap rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
              ₹{outstanding.toLocaleString("en-IN")} due
            </span>
          )}
        </div>
      </Link>
      {phone && (
        <div className="mt-3 flex gap-2">
          <a
            href={buildTelLink(phone)}
            className="min-h-11 flex-1 rounded-lg bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-800"
          >
            Call
          </a>
          <a
            href={buildWhatsAppLink(phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-11 flex-1 rounded-lg bg-green-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-green-700"
          >
            WhatsApp
          </a>
        </div>
      )}
    </Card>
  );
}
