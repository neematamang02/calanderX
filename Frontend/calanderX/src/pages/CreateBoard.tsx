import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Calendar, Plus, X } from "lucide-react";
import {
  useCreateBoard,
  useCalendars,
  useAddCalendarToBoard,
} from "../hooks/useApi";
import type {
  CreateBoardRequest,
  Calendar as CalendarType,
} from "../types/api";
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

type BoardForm = CreateBoardRequest;

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

export const CreateBoard: React.FC = () => {
  const [selectedCalendars, setSelectedCalendars] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
    }>
  >([]);

  const navigate = useNavigate();
  const { data: calendarsResponse, isLoading: calendarsLoading } =
    useCalendars();
  const createBoardMutation = useCreateBoard();
  const addCalendarMutation = useAddCalendarToBoard();

  const calendars = calendarsResponse?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
  } = useForm<BoardForm>({
    defaultValues: {
      maskEvents: false,
      showPastEvents: true,
      onlyCurrentWeek: false,
      twoWeeksAhead: false,
    },
  });

  const maskEvents = useWatch({ control, name: "maskEvents" });

  const handleAddCalendar = (calendar: CalendarType) => {
    if (selectedCalendars.find((c) => c.id === calendar.id)) return;

    const availableColors = colorOptions.filter(
      (color) => !selectedCalendars.some((c) => c.color === color),
    );

    const color = availableColors[0] || colorOptions[0];

    setSelectedCalendars([
      ...selectedCalendars,
      {
        id: calendar.id,
        name: calendar.name,
        color,
      },
    ]);
  };

  const handleRemoveCalendar = (calendarId: string) => {
    setSelectedCalendars(selectedCalendars.filter((c) => c.id !== calendarId));
  };

  const handleColorChange = (calendarId: string, color: string) => {
    setSelectedCalendars(
      selectedCalendars.map((c) => (c.id === calendarId ? { ...c, color } : c)),
    );
  };

  const onSubmit = async (data: BoardForm) => {
    try {
      const response = await createBoardMutation.mutateAsync(data);

      if (response.success && response.data) {
        const boardId = response.data.id;

        // Add selected calendars to the board
        if (selectedCalendars.length > 0) {
          const addCalendarPromises = selectedCalendars.map((calendar) =>
            addCalendarMutation.mutateAsync({
              boardId,
              data: {
                calendarId: calendar.id,
                color: calendar.color,
              },
            }),
          );

          // Wait for all calendars to be added
          await Promise.all(addCalendarPromises);
        }

        navigate(`/boards/${boardId}`);
      }
    } catch {
      // Error is handled by the mutation
    }
  };

  if (calendarsLoading) {
    return (
      <Layout>
        <LoadingState message="Loading calendars..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate("/boards")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Boards
          </Button>

          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Create New Board
            </h1>
            <p className="mt-2 text-gray-600">
              Set up a custom calendar view with your preferred settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Give your board a name and description
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

          {/* Calendar Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Select Calendars</CardTitle>
              <CardDescription>
                Choose which calendars to include in this board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Available Calendars */}
              {calendars.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No calendars available</p>
                  <p className="text-sm text-gray-400">
                    Connect a calendar account first to add calendars to your
                    board
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <h4 className="font-medium mb-3">Available Calendars</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {calendars
                        .filter(
                          (calendar) =>
                            !selectedCalendars.find(
                              (c) => c.id === calendar.id,
                            ),
                        )
                        .map((calendar) => (
                          <div
                            key={calendar.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{
                                  backgroundColor:
                                    calendar.defaultColor || "#3B82F6",
                                }}
                              />
                              <span className="font-medium">
                                {calendar.name}
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddCalendar(calendar)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Selected Calendars */}
                  {selectedCalendars.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">
                        Selected Calendars ({selectedCalendars.length})
                      </h4>
                      <div className="space-y-3">
                        {selectedCalendars.map((calendar) => (
                          <div
                            key={calendar.id}
                            className="flex items-center justify-between p-3 border rounded-lg bg-blue-50"
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className="w-4 h-4 rounded-full border"
                                style={{ backgroundColor: calendar.color }}
                              />
                              <span className="font-medium">
                                {calendar.name}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Color Picker */}
                              <div className="flex space-x-1">
                                {colorOptions.slice(0, 5).map((color) => (
                                  <button
                                    key={color}
                                    type="button"
                                    className={`w-6 h-6 rounded-full border-2 ${
                                      calendar.color === color
                                        ? "border-gray-800"
                                        : "border-gray-300"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    onClick={() =>
                                      handleColorChange(calendar.id, color)
                                    }
                                  />
                                ))}
                              </div>

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleRemoveCalendar(calendar.id)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/boards")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createBoardMutation.isPending}>
              {createBoardMutation.isPending ? "Creating..." : "Create Board"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
