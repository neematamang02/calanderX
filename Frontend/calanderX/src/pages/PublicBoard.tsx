import React, { useState, useMemo } from "react";
import { useParams } from "react-router-dom";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Grid3x3,
  List,
  Clock,
  Eye,
  Shield,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { usePublicBoard } from "../hooks/useApi";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Badge } from "../components/ui/Badge";
import { LoadingState } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";
import { EventCard } from "../components/calendar/EventCard";
import type { Event } from "../types/api";
import { cn } from "../lib/utils";
import { formatEventTime, formatEventDate } from "../utils/dateUtils";

type ViewMode = "month" | "list";

export const PublicBoard: React.FC = () => {
  const { token } = useParams<{ token: string }>();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterCalendarId, setFilterCalendarId] = useState<string | null>(null);

  // API Hook - fetch public board data
  const {
    data: publicBoardResponse,
    isLoading,
    isError,
  } = usePublicBoard(token || "", {
    startDate: startOfMonth(currentDate).toISOString(),
    endDate: endOfMonth(currentDate).toISOString(),
  });

  const board = publicBoardResponse?.data?.board;
  const events = useMemo(
    () => publicBoardResponse?.data?.events ?? [],
    [publicBoardResponse?.data?.events],
  );

  // Filter events by calendar if needed
  const filteredEvents = useMemo(() => {
    if (!filterCalendarId) return events;
    return events.filter((event) => event.calendarId === filterCalendarId);
  }, [events, filterCalendarId]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const grouped: Record<string, Event[]> = {};
    filteredEvents.forEach((event) => {
      const dateKey = format(new Date(event.startTime), "yyyy-MM-dd");
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [filteredEvents]);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => addMonths(prev, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getCalendarColor = (calendarId: string): string => {
    const boardCalendar = board?.boardCalendars.find(
      (bc) => bc.calendarId === calendarId,
    );
    return boardCalendar?.color || "#3B82F6";
  };

  const getCalendarName = (calendarId: string): string => {
    const boardCalendar = board?.boardCalendars.find(
      (bc) => bc.calendarId === calendarId,
    );
    return boardCalendar?.calendar.name || "Unknown Calendar";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingState message="Loading shared calendar..." />
      </div>
    );
  }

  if (isError || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-12 max-w-md">
          <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Unable to Load Calendar
          </h3>
          <p className="text-gray-600 mb-6">
            This shared calendar link is invalid, expired, or has been disabled
            by the owner.
          </p>
          <a href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            Go to CalendarX
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {board.name}
                </h1>
                {board.description && (
                  <p className="text-sm text-gray-600">{board.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {board.maskEvents && (
                <Badge variant="secondary">
                  <Shield className="h-3 w-3 mr-1" />
                  Privacy Protected
                </Badge>
              )}
              <Badge variant="outline">
                <Eye className="h-3 w-3 mr-1" />
                Public View
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Filters Sidebar */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">Calendars</CardTitle>
              <CardDescription>Filter by calendar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <button
                onClick={() => setFilterCalendarId(null)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                  !filterCalendarId
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "hover:bg-gray-50",
                )}
              >
                All Calendars ({events.length})
              </button>

              {board.boardCalendars.map((boardCalendar) => {
                const calendarEvents = events.filter(
                  (e) => e.calendarId === boardCalendar.calendarId,
                );
                return (
                  <button
                    key={boardCalendar.id}
                    onClick={() =>
                      setFilterCalendarId(boardCalendar.calendarId)
                    }
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors flex items-center space-x-2",
                      filterCalendarId === boardCalendar.calendarId
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "hover:bg-gray-50",
                    )}
                  >
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: boardCalendar.color }}
                    />
                    <span className="flex-1 truncate">
                      {boardCalendar.calendar.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({calendarEvents.length})
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <h2 className="text-xl font-semibold">
                    {format(currentDate, "MMMM yyyy")}
                  </h2>

                  <Button variant="outline" size="sm" onClick={handleNextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  <Button variant="outline" size="sm" onClick={handleToday}>
                    Today
                  </Button>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant={viewMode === "month" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("month")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {viewMode === "month" ? (
                <div className="space-y-4">
                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-2">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                      (day) => (
                        <div
                          key={day}
                          className="text-center text-sm font-semibold text-gray-600 py-2"
                        >
                          {day}
                        </div>
                      ),
                    )}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day, index) => {
                      const dateKey = format(day, "yyyy-MM-dd");
                      const dayEvents = eventsByDate[dateKey] || [];
                      const isCurrentMonth = isSameMonth(day, currentDate);
                      const isToday = isSameDay(day, new Date());

                      return (
                        <div
                          key={index}
                          className={cn(
                            "min-h-[100px] border rounded-lg p-2",
                            isCurrentMonth ? "bg-white" : "bg-gray-50",
                            isToday && "ring-2 ring-blue-500",
                          )}
                        >
                          <div
                            className={cn(
                              "text-sm font-medium mb-1",
                              isCurrentMonth
                                ? "text-gray-900"
                                : "text-gray-400",
                              isToday && "text-blue-600 font-bold",
                            )}
                          >
                            {format(day, "d")}
                          </div>

                          <div className="space-y-1">
                            {dayEvents.slice(0, 3).map((event) => {
                              const displayTitle = board.maskEvents
                                ? board.maskLabel || "Busy"
                                : event.title;

                              return (
                                <button
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className="w-full text-left"
                                >
                                  <div
                                    className="text-xs px-2 py-1 rounded truncate"
                                    style={{
                                      backgroundColor: `${getCalendarColor(event.calendarId)}20`,
                                      borderLeft: `3px solid ${getCalendarColor(event.calendarId)}`,
                                    }}
                                  >
                                    {displayTitle}
                                  </div>
                                </button>
                              );
                            })}

                            {dayEvents.length > 3 && (
                              <div className="text-xs text-gray-500 px-2">
                                +{dayEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                // List View
                <div className="space-y-4">
                  {filteredEvents.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No events found</p>
                    </div>
                  ) : (
                    filteredEvents.map((event) => {
                      const displayTitle = board.maskEvents
                        ? board.maskLabel || "Busy"
                        : event.title;
                      const displayDescription = board.maskEvents
                        ? undefined
                        : event.description;
                      const displayLocation = board.maskEvents
                        ? undefined
                        : event.location;

                      return (
                        <EventCard
                          key={event.id}
                          event={{
                            ...event,
                            title: displayTitle,
                            description: displayDescription || null,
                            location: displayLocation || null,
                          }}
                          calendarColor={getCalendarColor(event.calendarId)}
                          calendarName={getCalendarName(event.calendarId)}
                          showCalendarName={true}
                        />
                      );
                    })
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <Modal
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={
            board.maskEvents ? board.maskLabel || "Busy" : selectedEvent.title
          }
          size="lg"
        >
          <div className="space-y-4">
            {!board.maskEvents && (
              <EventCard
                event={selectedEvent}
                calendarColor={getCalendarColor(selectedEvent.calendarId)}
                calendarName={getCalendarName(selectedEvent.calendarId)}
                showCalendarName={true}
              />
            )}

            {board.maskEvents && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3 mb-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{
                      backgroundColor: getCalendarColor(
                        selectedEvent.calendarId,
                      ),
                    }}
                  />
                  <span className="font-medium">
                    {getCalendarName(selectedEvent.calendarId)}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>
                      {formatEventTime(
                        selectedEvent.startTime,
                        selectedEvent.endTime,
                        selectedEvent.allDay,
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{formatEventDate(selectedEvent.startTime)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      Event details are hidden for privacy. Only availability is
                      shown.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Footer */}
      <footer className="mt-12 border-t bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>
              This calendar is shared using{" "}
              <a
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                CalendarX
              </a>
            </p>
            {board.maskEvents && (
              <p className="mt-2 text-xs">
                <Shield className="h-3 w-3 inline mr-1" />
                Privacy mode enabled - Event details are protected
              </p>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
