// utils/calendar.ts
export function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
export function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth()+1, 0);
}

// return the grid: array of weeks, each week is array of Date objects
export function buildMonthGrid(month: Date): Date[][] {
  const firstOfMonth = startOfMonth(month);
  const lastOfMonth = endOfMonth(month);
  const startWeekDay = firstOfMonth.getDay(); // 0 Sunday..6
  const days: Date[] = [];

  // compute starting date (may be previous month)
  const startDate = new Date(firstOfMonth);
  startDate.setDate(firstOfMonth.getDate() - startWeekDay);

  // add 6 weeks (6*7 = 42 days) to cover all cases
  for (let i=0;i<42;i++){
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    days.push(d);
  }

  const weeks: Date[][] = [];
  for (let i=0;i<6;i++){
    weeks.push(days.slice(i*7, (i+1)*7));
  }
  return weeks;
}
