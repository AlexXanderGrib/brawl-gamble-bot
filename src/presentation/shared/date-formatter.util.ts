export const dateFormatter = new Intl.DateTimeFormat(["ru"], {
  timeZone: "Europe/Moscow",
  hour12: false,
  timeZoneName: "short",
  hour: "2-digit",
  minute: "2-digit",
  day: "2-digit",
  month: "2-digit",
  year: "numeric"
});
