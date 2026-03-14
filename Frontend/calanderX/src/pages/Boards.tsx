import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, Share2, Settings, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import {
  useBoards,
  useDeleteBoard,
  useCreateSharedLink,
} from '../hooks/useApi';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';

export const Boards: React.FC = () => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  
  const { data: boardsResponse, isLoading } = useBoards();
  const deleteBoardMutation = useDeleteBoard();
  const createSharedLinkMutation = useCreateSharedLink();

  const boards = boardsResponse?.data || [];

  const handleDeleteBoard = () => {
    if (selectedBoardId) {
      deleteBoardMutation.mutate(selectedBoardId);
      setDeleteModalOpen(false);
      setSelectedBoardId(null);
    }
  };

  const handleCreateSharedLink = (boardId: string) => {
    createSharedLinkMutation.mutate(boardId);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading boards..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Boards</h1>
            <p className="mt-2 text-gray-600">
              Create custom calendar views and share them with others
            </p>
          </div>
          
          <Link to="/boards/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Board
            </Button>
          </Link>
        </div>

        {/* Boards Grid */}
        {boards.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No boards created yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create your first calendar board to organize and share your events
              </p>
              <Link to="/boards/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Board
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boards.map((board) => (
              <Card key={board.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{board.name}</CardTitle>
                      {board.description && (
                        <CardDescription className="mt-1">
                          {board.description}
                        </CardDescription>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 ml-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCreateSharedLink(board.id)}
                        disabled={createSharedLinkMutation.isPending}
                      >
                        <Share2 className="h-4 w-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedBoardId(board.id);
                          setDeleteModalOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {/* Board Stats */}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">
                        {board.boardCalendars.length} calendars
                      </span>
                      <span className="text-gray-600">
                        Created {format(new Date(board.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>

                    {/* Board Settings */}
                    <div className="flex flex-wrap gap-2">
                      {board.maskEvents && (
                        <Badge variant="secondary">
                          Events Masked
                        </Badge>
                      )}
                      {board.onlyCurrentWeek && (
                        <Badge variant="outline">
                          Current Week Only
                        </Badge>
                      )}
                      {board.twoWeeksAhead && (
                        <Badge variant="outline">
                          2 Weeks Ahead
                        </Badge>
                      )}
                      {!board.showPastEvents && (
                        <Badge variant="outline">
                          No Past Events
                        </Badge>
                      )}
                    </div>

                    {/* Calendars Preview */}
                    {board.boardCalendars.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Calendars:</p>
                        <div className="space-y-1">
                          {board.boardCalendars.slice(0, 3).map((boardCalendar) => (
                            <div
                              key={boardCalendar.id}
                              className="flex items-center space-x-2 text-sm"
                            >
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: boardCalendar.color }}
                              />
                              <span className="text-gray-600 truncate">
                                {boardCalendar.calendar.name}
                              </span>
                            </div>
                          ))}
                          {board.boardCalendars.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{board.boardCalendars.length - 3} more
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link to={`/boards/${board.id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                      
                      <Link to={`/boards/${board.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedBoardId(null);
          }}
          title="Delete Board"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this board? This action cannot be undone.
              All shared links for this board will also be removed.
            </p>
            
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedBoardId(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteBoard}
                disabled={deleteBoardMutation.isPending}
              >
                {deleteBoardMutation.isPending ? 'Deleting...' : 'Delete Board'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};