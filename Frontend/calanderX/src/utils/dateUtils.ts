import { format, parseISO, isToday, isTomorrow, isYesterday, startOfWeek, endOfWeek, addDays, subDays } from 'date-fns';

export const formatEventDate = (dateString: string): string => {
  const date = parseISO(dateString);
  
  if (isToday(date)) {
    return 'Today';
  } else if (isTomorrow(date)) {
    return 'Tomorrow';
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else {
    return format(date, 'MMM d, yyyy');
  }
};

export const formatEventTime = (startTime: string, endTime: string, allDay: boolean): string => {
  if (allDay) {
    return 'All day';
  }
  
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  
  return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
};

export const formatEventDateTime = (startTime: string, endTime: string, allDay: boolean): string => {
  const start = parseISO(startTime);
  const end = parseISO(endTime);
  
  if (allDay) {
    const startDate = format(start, 'MMM d');
    const endDate = format(end, 'MMM d');
    
    if (startDate === endDate) {
      return `${startDate} (All day)`;
    } else {
      return `${startDate} - ${endDate} (All day)`;
    }
  }
  
  const startDate = format(start, 'MMM d');
  const endDate = format(end, 'MMM d');
  
  if (startDate === endDate) {
    return `${startDate}, ${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  } else {
    return `${format(start, 'MMM d, h:mm a')} - ${format(end, 'MMM d, h:mm a')}`;
  }
};

export const getDateRangeForWeek = (date: Date = new Date()) => {
  const start = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
  const end = endOfWeek(date, { weekStartsOn: 0 }); // Saturday
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

export const getDateRangeForDays = (days: number, fromDate: Date = new Date()) => {
  if (days > 0) {
    // Future days
    const end = addDays(fromDate, days);
    return {
      start: fromDate.toISOString(),
      end: end.toISOString(),
    };
  } else {
    // Past days
    const start = subDays(fromDate, Math.abs(days));
    return {
      start: start.toISOString(),
      end: fromDate.toISOString(),
    };
  }
};

export const isEventInDateRange = (
  eventStart: string,
  eventEnd: string,
  rangeStart?: string,
  rangeEnd?: string
): boolean => {
  const eventStartDate = parseISO(eventStart);
  const eventEndDate = parseISO(eventEnd);
  
  if (rangeStart) {
    const rangeStartDate = parseISO(rangeStart);
    if (eventEndDate < rangeStartDate) {
      return false;
    }
  }
  
  if (rangeEnd) {
    const rangeEndDate = parseISO(rangeEnd);
    if (eventStartDate > rangeEndDate) {
      return false;
    }
  }
  
  return true;
};

export const groupEventsByDate = (events: any[]) => {
  const grouped: { [key: string]: any[] } = {};
  
  events.forEach(event => {
    const date = format(parseISO(event.startTime), 'yyyy-MM-dd');
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(event);
  });
  
  // Sort events within each date by start time
  Object.keys(grouped).forEach(date => {
    grouped[date].sort((a, b) => 
      parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
    );
  });
  
  return grouped;
};

export const sortEventsByStartTime = (events: any[]) => {
  return [...events].sort((a, b) => 
    parseISO(a.startTime).getTime() - parseISO(b.startTime).getTime()
  );
};