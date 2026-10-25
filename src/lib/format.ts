export const formatDate = (value: string | Date): string =>
  new Date(value).toLocaleDateString("es-CL", { day: "2-digit", month: "short", year: "numeric" });

export const formatTime = (value: string | Date): string =>
  new Date(value).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });

export const formatGrade = (value: number): string => (value ? value.toFixed(1) : "-");

export const average = (values: number[]): number =>
  values.length ? values.reduce((sum, v) => sum + Number(v), 0) / values.length : 0;

export const gradeTone = (value: number): string =>
  !value ? "badge-ghost" : value >= 4 ? "badge-success" : "badge-error";

export const initials = (firstName: string, lastName = ""): string =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

const pad = (value: number): string => String(value).padStart(2, "0");

export const todayLocal = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

export const parseLocalDate = (value: string): Date => new Date(`${value}T00:00:00`);

export const formatDay = (value: string): { weekday: string; day: string; month: string } => {
  const date = parseLocalDate(value);
  return {
    weekday: date.toLocaleDateString("es-CL", { weekday: "short" }).replace(".", ""),
    day: pad(date.getDate()),
    month: date.toLocaleDateString("es-CL", { month: "long", year: "numeric" }),
  };
};
