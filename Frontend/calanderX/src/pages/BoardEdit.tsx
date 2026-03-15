import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Calendar, Plus, Save, Trash2 } from "lucide-react";
import {
  useBoard,
  useUpdateBoard,
  useCalendars,
  useAddCalendarToBoard,
  useRemoveCalendarFromBoard,
  useUpdateCalendarColor,
} from "../hooks/useApi";
import type { UpdateBoardRequest } from "../types/api";
import { Layout } from "../components/layout/Layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { LoadingState } from "../components/ui/LoadingSpinner";
import { Modal } from "../components/ui/Modal";
import { cn } from "../lib/utils";

type BoardForm = UpdateBoardRequest;

const colorOptions = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
];

export const BoardEdit: React.FC = () => {
  const { boardId } = useParams<{ boardId: string }>();
  const navigate = useNavigate();

  const [addCalendarModalOpen, setAddCalendarModalOpen] = useState(false);
  const [selectedCalendarToAdd, setSelectedCalendarToAdd] = useState<
    string | null
  >(null);
  const [selectedColor, setSelectedColor] = useState<string>(colorOptions[0]);

  // API Hooks
  const { data: boardResponse, isLoading: boardLoading } = useBoard(
    boardId || "",
  );
  const { data: calendarsResponse, isLoading: calendarsLoading } =
    useCalendars();
  const updateBoardMutation = useUpdateBoard();
  const addCalendarMutation = useAddCalendarToBoard();
  const removeCalendarMutation = useRemoveCalendarFromBoard();
  const updateColorMutation = useUpdateCalendarColor();

  const board = boardResponse?.data;
  const allCalendars = calendarsResponse?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    setValue,
  } = useForm<BoardForm>();

  // Initialize form with board data
  useEffect(() => {
    if (board) {
      setValue("name", board.name);
      setValue("description", board.description || "");
      setValue("maskEvents", board.maskEvents);
      setValue("maskLabel", board.maskLabel || "");
      setValue("showPastEvents", board.showPastEvents);
      setValue("pastDaysLimit", board.pastDaysLimit || undefined);
      setValue("futureDaysLimit", board.futureDaysLimit || undefined);
      setValue("onlyCurrentWeek", board.onlyCurrentWeek);
      setValue("twoWeeksAhead", board.twoWeeksAhead);
    }
  }, [board, setValue]);

  const maskEvents = useWatch({ control, name: "maskEvents" });

  // Get calendars that can be added (not already in board)
  const availableCalendars = allCalendars.filter(
    (calendar) =>
      !board?.boardCalendars.some((bc) => bc.calendarId === calendar.id),
  );

  // Get used colors to suggest different ones
  const usedColors = board?.boardCalendars.map((bc) => bc.color) || [];
  const suggestedColor =
    colorOptions.find((color) => !usedColors.includes(color)) ||
    colorOptions[0];

  const handleAddCalendar = () => {
    if (!selectedCalendarToAdd || !boardId) return;

    addCalendarMutation.mutate(
      {
        boardId,
        data: {
          calendarId: selectedCalendarToAdd,
          color: selectedColor,
        },
      },
      {
        onSuccess: () => {
          setAddCalendarModalOpen(false);
          setSelectedCalendarToAdd(null);
          setSelectedColor(suggestedColor);
        },
      },
    );
  };

  const handleRemoveCalendar = (calendarId: string) => {
    if (!boardId) return;

    removeCalendarMutation.mutate({
      boardId,
      calendarId,
    });
  };

  const handleColorChange = (calendarId: string, color: string) => {
    if (!boardId) return;

    updateColorMutation.mutate({
      boardId,
      calendarId,
      data: { color },
    });
  };

  const onSubmit = async (data: BoardForm) => {
    if (!boardId) return;

    try {
      await updateBoardMutation.mutateAsync({
        boardId,
        data,
      });
      navigate(`/boards/${boardId}`);
    } catch {
      // Error is handled by the mutation
    }
  };

  if (boardLoading || calendarsLoading) {
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
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to={`/boards/${boardId}`}>
              <Button variant="ghost">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Board
              </Button>
            </Link>

            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Board</h1>
              <p className="mt-2 text-gray-600">
                Update your board settings and calendars
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update your board name and description
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Board Name"
                error={errors.name?.message}
                {...register("name", {
                  required: "Board name is required",
                  minLength: {
                    value: 2,
                    message: "Name must be at least 2 characters",
                  },
                })}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Describe what this board is for..."
                  {...register("description")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control how events are displayed in this board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="maskEvents"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  {...register("maskEvents")}
                />
                <label htmlFor="maskEvents" className="text-sm font-medium">
                  Mask event details
                </label>
              </div>

              {maskEvents && (
                <Input
                  label="Mask Label"
                  placeholder="Busy"
                  helperText="Text to show instead of event titles"
                  {...register("maskLabel")}
                />
              )}
            </CardContent>
          </Card>

          {/* Date Range Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Date Range Settings</CardTitle>
              <CardDescription>
                Configure which events to show based on dates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="showPastEvents"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("showPastEvents")}
                  />
                  <label
                    htmlFor="showPastEvents"
                    className="text-sm font-medium"
                  >
                    Show past events
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="onlyCurrentWeek"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("onlyCurrentWeek")}
                  />
                  <label
                    htmlFor="onlyCurrentWeek"
                    className="text-sm font-medium"
                  >
                    Current week only
                  </label>
                </div>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="twoWeeksAhead"
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    {...register("twoWeeksAhead")}
                  />
                  <label
                    htmlFor="twoWeeksAhead"
                    className="text-sm font-medium"
                  >
                    Limit to 2 weeks ahead
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Past Days Limit"
                  type="number"
                  placeholder="30"
                  helperText="How many days back to show (leave empty for unlimited)"
                  {...register("pastDaysLimit", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Must be at least 1 day" },
                  })}
                />

                <Input
                  label="Future Days Limit"
                  type="number"
                  placeholder="90"
                  helperText="How many days ahead to show (leave empty for unlimited)"
                  {...register("futureDaysLimit", {
                    valueAsNumber: true,
                    min: { value: 1, message: "Must be at least 1 day" },
                  })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Manage Calendars */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Board Calendars</CardTitle>
                  <CardDescription>
                    Manage which calendars appear in this board
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setSelectedColor(suggestedColor);
                    setAddCalendarModalOpen(true);
                  }}
                  disabled={availableCalendars.length === 0}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Calendar
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {board.boardCalendars.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    No calendars added to this board
                  </p>
                  {availableCalendars.length > 0 ? (
                    <Button
                      type="button"
                      onClick={() => setAddCalendarModalOpen(true)}
                    >
                      Add Your First Calendar
                    </Button>
                  ) : (
                    <p className="text-sm text-gray-400">
                      Connect a calendar account first to add calendars
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {board.boardCalendars.map((boardCalendar) => (
                    <div
                      key={boardCalendar.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center space-x-3 flex-1">
                        <div
                          className="w-4 h-4 rounded-full border-2 border-gray-200"
                          style={{ backgroundColor: boardCalendar.color }}
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {boardCalendar.calendar.name}
                          </h4>
                          {boardCalendar.calendar.description && (
                            <p className="text-sm text-gray-600 mt-1">
                              {boardCalendar.calendar.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Color Picker */}
                        <div className="flex space-x-1">
                          {colorOptions.slice(0, 5).map((color) => (
                            <button
                              key={color}
                              type="button"
                              className={cn(
                                "w-6 h-6 rounded-full border-2 transition-all hover:scale-110",
                                boardCalendar.color === color
                                  ? "border-gray-800 ring-2 ring-offset-2 ring-blue-500"
                                  : "border-gray-300",
                              )}
                              style={{ backgroundColor: color }}
                              onClick={() =>
                                handleColorChange(
                                  boardCalendar.calendarId,
                                  color,
                                )
                              }
                              disabled={updateColorMutation.isPending}
                            />
                          ))}
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleRemoveCalendar(boardCalendar.calendarId)
                          }
                          disabled={removeCalendarMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {availableCalendars.length === 0 &&
                board.boardCalendars.length > 0 && (
                  <p className="text-sm text-gray-500 text-center mt-4">
                    All your calendars have been added to this board
                  </p>
                )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Link to={`/boards/${boardId}`}>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>

            <Button type="submit" disabled={updateBoardMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateBoardMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Add Calendar Modal */}
        <Modal
          isOpen={addCalendarModalOpen}
          onClose={() => {
            setAddCalendarModalOpen(false);
            setSelectedCalendarToAdd(null);
          }}
          title="Add Calendar to Board"
          size="md"
        >
          <div className="space-y-4">
            {availableCalendars.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No calendars available to add</p>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Calendar
                  </label>
                  <div className="space-y-2">
                    {availableCalendars.map((calendar) => (
                      <button
                        key={calendar.id}
                        type="button"
                        onClick={() => setSelectedCalendarToAdd(calendar.id)}
                        className={cn(
                          "w-full text-left px-4 py-3 border rounded-lg transition-all",
                          selectedCalendarToAdd === calendar.id
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-300 hover:border-gray-400",
                        )}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor:
                                calendar.defaultColor || "#3B82F6",
                            }}
                          />
                          <div>
                            <p className="font-medium text-gray-900">
                              {calendar.name}
                            </p>
                            {calendar.description && (
                              <p className="text-sm text-gray-600">
                                {calendar.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedCalendarToAdd && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Color
                    </label>
                    <div className="flex space-x-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded-full border-2 transition-all hover:scale-110",
                            selectedColor === color
                              ? "border-gray-800 ring-2 ring-offset-2 ring-blue-500"
                              : "border-gray-300",
                          )}
                          style={{ backgroundColor: color }}
                          onClick={() => setSelectedColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setAddCalendarModalOpen(false);
                      setSelectedCalendarToAdd(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleAddCalendar}
                    disabled={
                      !selectedCalendarToAdd || addCalendarMutation.isPending
                    }
                  >
                    {addCalendarMutation.isPending
                      ? "Adding..."
                      : "Add Calendar"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
