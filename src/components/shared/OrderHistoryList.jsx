import { format } from "date-fns";
import { ShoppingBag } from "lucide-react";

export default function OrderHistoryList({ orders, preferences }) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-16">
        <ShoppingBag className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const pref = order.preference_snapshot || preferences.find(p => p.id === order.preference_id);
        const date = order.ordered_at || order.created_date;
        return (
          <div key={order.id} className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              {pref?.image_url ? (
                <img src={pref.image_url} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-2xl flex-shrink-0">☕</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{pref?.name || pref?.coffee_type || "Custom Order"}</p>
                {pref?.coffee_type && pref?.name && (
                  <p className="text-xs text-muted-foreground">{pref.coffee_type}</p>
                )}
                {order.shop_name && (
                  <p className="text-xs text-muted-foreground/70">{order.shop_name}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {order.price && (
                  <p className="font-semibold text-sm">${Number(order.price).toFixed(2)}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">
                  {date ? format(new Date(date), "MMM d") : "—"}
                </p>
              </div>
            </div>
            {order.barista_notes && (
              <div className="px-4 pb-3">
                <p className="text-xs text-muted-foreground italic border-t border-border pt-2">
                  Note: {order.barista_notes}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}