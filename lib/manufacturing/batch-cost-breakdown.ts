export function travelFromPayload(p: unknown): number {
  if (!p || typeof p !== "object") return 0;
  const o = p as Record<string, unknown>;
  const a = Number(o.travel ?? o.travelExpense ?? o.logisticsExpense ?? 0);
  return Number.isFinite(a) ? a : 0;
}

export type StageLogLike = {
  action: string;
  costAmount: number;
  payload: unknown;
  createdAt: Date;
  createdByName: string;
};

export function computeBatchCostBreakdown(args: {
  quantity: number;
  stageLogs: StageLogLike[];
  fabricMovementsTotalValue: number;
  miscTotal: number;
}) {
  const qty = Math.max(1, args.quantity);
  let wash = 0;
  let printing = 0;
  let embroidery = 0;
  let travel = 0;

  for (const l of args.stageLogs) {
    travel += travelFromPayload(l.payload);
    const ca = l.costAmount || 0;
    if (l.action === "SEND_WASH" || l.action === "RETURN_WASH") wash += ca;
    else if (l.action === "SEND_PRINTING" || l.action === "RETURN_PRINTING") printing += ca;
    else if (l.action === "SEND_EMBROIDERY" || l.action === "RETURN_EMBROIDERY") embroidery += ca;
  }

  const fabric = args.fabricMovementsTotalValue;
  const misc = args.miscTotal;
  const stageDirect = args.stageLogs.reduce((s, l) => s + (l.costAmount || 0), 0);
  const total = fabric + stageDirect + misc;

  return {
    fabricCost: round2(fabric),
    washCost: round2(wash),
    washCostPerUnit: round2(wash / qty),
    printingCost: round2(printing),
    embroideryCost: round2(embroidery),
    travelLogistics: round2(travel),
    miscellaneous: round2(misc),
    totalCost: round2(total),
    costPerUnit: round2(total / qty),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
