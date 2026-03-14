import React from 'react';
import { Calendar, Clock, MapPin, ExternalLink } from 'lucide-react';
import type { Event } from '../../types/api';
import { formatEventTime, formatEventDate } from '../../utils/dateUtils';
import { Card, CardContent } from '../ui/Card';
import { Badge } from '../ui/Badge';

interface EventCardProps {
  event: Event;
  calendarColor?: string;
  showCalendarName?: boolean;
  calendarName?: string;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  calendarColor = '#3B82F6',
  showCalendarName = false,
  calendarName,
  compact = false,
}) => {
  const handleExternalLink = () => {
    if (event.htmlLink) {
      window.open(event.htmlLink, '_blank');
    }
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-md">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: calendarColor }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {event.title}
          </p>
          <p className="text-xs text-gray-500">
            {formatEventTime(event.startTime, event.endTime, event.allDay)}
          </p>
        </div>
        {event.htmlLink && (
          <button
            onClick={handleExternalLink}
            className="text-gray-400 hover:text-gray-600"
          >
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Color indicator */}
          <div
            className="w-1 h-16 rounded-full flex-shrink-0 mt-1"
            style={{ backgroundColor: calendarColor }}
          />
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {event.title}
              </h3>
              
              <div className="flex items-center space-x-2 ml-2">
                {event.status && (
                  <Badge
                    variant={
                      event.status === 'confirmed' ? 'success' :
                      event.status === 'tentative' ? 'warning' :
                      'secondary'
                    }
                  >
                    {event.status}
                  </Badge>
                )}
                
                {event.htmlLink && (
                  <button
                    onClick={handleExternalLink}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Time */}
            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
              <Clock className="h-4 w-4" />
              <span>
                {formatEventTime(event.startTime, event.endTime, event.allDay)}
              </span>
              <span className="text-gray-400">•</span>
              <span>{formatEventDate(event.startTime)}</span>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{event.location}</span>
              </div>
            )}

            {/* Calendar name */}
            {showCalendarName && calendarName && (
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span>{calendarName}</span>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                {event.description}
              </p>
            )}

            {/* Recurrence indicator */}
            {event.recurrence && (
              <div className="mt-2">
                <Badge variant="outline">
                  Recurring
                </Badge>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};