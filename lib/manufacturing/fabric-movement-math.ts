export type QtyUnit = "m" | "kg" | "g";

function weightToKg(value: number, unit: QtyUnit): number {
  if (unit === "kg") return value;
  if (unit === "g") return value / 1000;
  return 0;
}

function kgToFabricUnit(kg: number, fabricWeightUnit: string): number {
  if (fabricWeightUnit === "g") return kg * 1000;
  return kg;
}

/** Delta meters and delta weight (in fabric weight unit) from one movement line */
export function movementDeltas(args: {
  type: string;
  quantity: number;
  quantityUnit: QtyUnit;
  fabricWeightUnit: string;
}): { deltaMeters: number; deltaWeightFabricUnit: number } {
  if (args.type === "ADJUSTMENT") {
    if (args.quantityUnit === "m") {
      return { deltaMeters: args.quantity, deltaWeightFabricUnit: 0 };
    }
    const abs = Math.abs(args.quantity);
    const sign = args.quantity >= 0 ? 1 : -1;
    const kg = weightToKg(abs, args.quantityUnit) * sign;
    return { deltaMeters: 0, deltaWeightFabricUnit: kgToFabricUnit(kg, args.fabricWeightUnit) };
  }

  const sign = args.type === "IN" ? 1 : args.type === "OUT" ? -1 : 0;
  if (!sign) return { deltaMeters: 0, deltaWeightFabricUnit: 0 };

  let deltaMeters = 0;
  let deltaKg = 0;

  if (args.quantityUnit === "m") {
    deltaMeters = sign * args.quantity;
  } else {
    const qKg = weightToKg(args.quantity, args.quantityUnit);
    deltaKg = sign * qKg;
  }

  const deltaWeightFabricUnit = kgToFabricUnit(deltaKg, args.fabricWeightUnit);
  return { deltaMeters, deltaWeightFabricUnit };
}

export function totalValueForMovement(
  quantity: number,
  rate: number,
  quantityUnit: QtyUnit
): number {
  return Math.round(quantity * rate * 100) / 100;
}
