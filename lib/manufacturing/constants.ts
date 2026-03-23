export const MFG_STAGE_KEYS = [
  "READY_FOR_PRODUCTION",
  "IN_PRODUCTION_CUTTING",
  "SENT_PRINTING",
  "SENT_EMBROIDERY",
  "SENT_WASH",
  "RETURNED_COMBINED",
  "SENT_SAMPLE",
  "QC_PASSED",
  "REJECTED_REWORK",
] as const;

export type MfgStageKey = (typeof MFG_STAGE_KEYS)[number];

export const MFG_STAGE_LABEL: Record<string, string> = {
  READY_FOR_PRODUCTION: "Ready for Production",
  IN_PRODUCTION_CUTTING: "In Production / Cutting",
  SENT_PRINTING: "Sent for Printing",
  SENT_EMBROIDERY: "Sent for Embroidery",
  SENT_WASH: "Sent for Wash",
  RETURNED_COMBINED: "Returned from Wash / Printing / Embroidery",
  SENT_SAMPLE: "Sent for Sample",
  QC_PASSED: "QC Passed / Ready for Dispatch",
  REJECTED_REWORK: "Rejected / Rework",
};

/** Pipeline display (emoji + label) */
export const MFG_STAGE_EMOJI: Record<string, string> = {
  READY_FOR_PRODUCTION: "📦",
  IN_PRODUCTION_CUTTING: "✂️",
  SENT_PRINTING: "🎨",
  SENT_EMBROIDERY: "🪡",
  SENT_WASH: "🧺",
  RETURNED_COMBINED: "✅",
  SENT_SAMPLE: "🧪",
  QC_PASSED: "✔️",
  REJECTED_REWORK: "❌",
};

export const MFG_STAGE_BADGE_CLASS: Record<string, string> = {
  READY_FOR_PRODUCTION: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/20",
  IN_PRODUCTION_CUTTING: "bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/20",
  SENT_PRINTING: "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/20",
  SENT_EMBROIDERY: "bg-fuchsia-500/15 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/20",
  SENT_WASH: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/20",
  RETURNED_COMBINED: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  SENT_SAMPLE: "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/20",
  QC_PASSED: "bg-green-500/20 text-green-800 dark:text-green-200 border-green-500/25",
  REJECTED_REWORK: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/20",
};
