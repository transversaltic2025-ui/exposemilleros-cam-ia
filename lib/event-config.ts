export const EVALUATOR_ASSIGNMENT_OPEN_AT_CO = "2026-08-05T00:00:00-05:00" as const;
export const EVENT_DATE_LABEL = "5 de agosto de 2026" as const;
export const EVALUATOR_ASSIGNMENT_OPEN_LABEL = "5 de agosto de 2026 a las 00:00, hora Colombia" as const;
export const COLOMBIA_TIME_ZONE = "America/Bogota" as const;

export function getColombiaDateString(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: COLOMBIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

export function isEvaluatorRegistrationOpen() {
  return true;
}

export function isEvaluatorAssignmentOpen(date = new Date()) {
  return date.getTime() >= new Date(EVALUATOR_ASSIGNMENT_OPEN_AT_CO).getTime();
}
