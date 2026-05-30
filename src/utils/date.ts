export function getLocalDateString(offsetDays = 0, date = new Date()) {
  const localDate = new Date(date);
  if (offsetDays !== 0) {
    localDate.setDate(localDate.getDate() + offsetDays);
  }

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getCalendarDaysDifference(startDateString: string, endDateString: string) {
  const start = parseLocalDate(startDateString);
  const end = parseLocalDate(endDateString);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0;
  }

  const diffTime = end.getTime() - start.getTime();

  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
}
