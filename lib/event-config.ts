export const EVALUATOR_REGISTRATION_OPEN_DATE = "2026-08-05" as const;
export const EVENT_DATE_LABEL = "5 de agosto de 2026" as const;
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

export function isEvaluatorRegistrationOpen(date = new Date()) {
  return getColombiaDateString(date) >= EVALUATOR_REGISTRATION_OPEN_DATE;
}
