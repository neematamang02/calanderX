import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Share2,
  Settings,
  Download,
  Grid3x3,
  List,
  Eye,
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
import {
  useBoard,
  useBoardEvents,
  useSharedLink,
  useCreateSharedLink,
} from "../hooks/useApi";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { LoadingState } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";
import { EventCard } from "../components/calendar/EventCard";
import type { Event } from "../types/api";
import { cn } from "../lib/utils";
import { copyToClipboard } from "../lib/utils";
import { toast } from "react-toastify";

type ViewMode = "month" | "week" | "list";

export const BoardView: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [filterCalendarId, setFilterCalendarId] = useState<string | null>(null);

  // API Hooks
  const { data: boardResponse, isLoading: boardLoading } = useBoard(
    boardId || "",
  );
  const { data: eventsResponse, isLoading: eventsLoading } = useBoardEvents(
    boardId || "",
    {
      startDate: startOfMonth(currentDate).toISOString(),
      endDate: endOfMonth(currentDate).toISOString(),
    },
  );
  const { data: sharedLinkResponse } = useSharedLink(boardId || "");
  const createSharedLinkMutation = useCreateSharedLink();

  const board = boardResponse?.data;
  const events = useMemo(
    () => eventsResponse?.data?.events ?? [],
    [eventsResponse?.data?.events],
  );
  const sharedLink = sharedLinkResponse?.data;

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

  const handleCreateShare = async () => {
    if (!boardId) return;
    try {
      await createSharedLinkMutation.mutateAsync(boardId);
      setShareModalOpen(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleCopyShareLink = () => {
    if (sharedLink?.shareUrl) {
      copyToClipboard(sharedLink.shareUrl);
      toast.success("Share link copied to clipboard!");
    }
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

  if (boardLoading || eventsLoading) {
    return (
      <Layout>
        <LoadingState message="Loading board..." />
      </Layout>
    );
  }

  if (!board) {
    return (
      <Layout>
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Board not found
          </h3>
          <p className="text-gray-600 mb-6">
            The board you're looking for doesn't exist.
          </p>
          <Button onClick={() => navigate("/boards")}>Back to Boards</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate("/boards")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{board.name}</h1>
              {board.description && (
                <p className="mt-1 text-gray-600">{board.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Link to={`/boards/${boardId}/edit`}>
              <Button variant="outline">
                <Settings className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </Link>

            <Button onClick={handleCreateShare} variant="outline">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Board Info & Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Filters */}
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
              <EventCard
                event={{
                  ...selectedEvent,
                  title: board.maskEvents
                    ? board.maskLabel || "Busy"
                    : selectedEvent.title,
                  description: board.maskEvents
                    ? null
                    : selectedEvent.description,
                  location: board.maskEvents ? null : selectedEvent.location,
                }}
                calendarColor={getCalendarColor(selectedEvent.calendarId)}
                calendarName={getCalendarName(selectedEvent.calendarId)}
                showCalendarName={true}
              />
            </div>
          </Modal>
        )}

        {/* Share Modal */}
        {shareModalOpen && sharedLink && (
          <Modal
            isOpen={shareModalOpen}
            onClose={() => setShareModalOpen(false)}
            title="Share Board"
            size="md"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Public Share Link
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={
                      sharedLink.shareUrl ||
                      `${window.location.origin}/shared/${sharedLink.token}`
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  />
                  <Button onClick={handleCopyShareLink}>Copy</Button>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-start space-x-3">
                  <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-900">
                      Public Link Active
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                      Anyone with this link can view your calendar board.
                      {board.maskEvents && " Event details are masked."}
                    </p>
                    <p className="text-xs text-blue-600 mt-2">
                      Views: {sharedLink.viewCount}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setShareModalOpen(false)}>Done</Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};
