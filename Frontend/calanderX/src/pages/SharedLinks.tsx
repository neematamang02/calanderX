import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Share2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Trash2,
  ExternalLink,
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  useSharedLinks,
  useUpdateSharedLink,
  useDeleteSharedLink,
  useRegenerateToken,
} from '../hooks/useApi';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';
import { copyToClipboard } from '../lib/utils';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

export const SharedLinks: React.FC = () => {
  const [selectedLink, setSelectedLink] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [regenerateModalOpen, setRegenerateModalOpen] = useState(false);

  const { data: sharedLinksResponse, isLoading } = useSharedLinks();
  const updateSharedLinkMutation = useUpdateSharedLink();
  const deleteSharedLinkMutation = useDeleteSharedLink();
  const regenerateTokenMutation = useRegenerateToken();

  const sharedLinks = sharedLinksResponse?.data || [];

  const handleCopyLink = (token: string) => {
    const url = `${window.location.origin}/shared/${token}`;
    copyToClipboard(url);
    toast.success('Share link copied to clipboard!');
  };

  const handleToggleActive = (boardId: string, isActive: boolean) => {
    updateSharedLinkMutation.mutate({
      boardId,
      data: { isActive: !isActive },
    });
  };

  const handleDeleteLink = () => {
    if (selectedLink) {
      deleteSharedLinkMutation.mutate(selectedLink);
      setDeleteModalOpen(false);
      setSelectedLink(null);
    }
  };

  const handleRegenerateToken = () => {
    if (selectedLink) {
      regenerateTokenMutation.mutate(selectedLink);
      setRegenerateModalOpen(false);
      setSelectedLink(null);
    }
  };

  const openDeleteModal = (boardId: string) => {
    setSelectedLink(boardId);
    setDeleteModalOpen(true);
  };

  const openRegenerateModal = (boardId: string) => {
    setSelectedLink(boardId);
    setRegenerateModalOpen(true);
  };

  if (isLoading) {
    return (
      <Layout>
        <LoadingState message="Loading shared links..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Shared Links</h1>
            <p className="mt-2 text-gray-600">
              Manage public links to your calendar boards
            </p>
          </div>

          <Link to="/boards">
            <Button>
              <Calendar className="h-4 w-4 mr-2" />
              View Boards
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Shared Links</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sharedLinks.length}</div>
              <p className="text-xs text-muted-foreground">
                Publicly accessible boards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Links</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sharedLinks.filter(link => link.sharedLink.isActive).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Currently accessible
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sharedLinks.reduce((sum, link) => sum + link.sharedLink.viewCount, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Across all shared boards
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shared Links List */}
        {sharedLinks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Share2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No shared links yet
              </h3>
              <p className="text-gray-600 mb-6">
                Create a shared link from any board to make it publicly accessible
              </p>
              <Link to="/boards">
                <Button>Go to Boards</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {sharedLinks.map((item) => {
              const { sharedLink, boardName, boardDescription } = item;
              const shareUrl = `${window.location.origin}/shared/${sharedLink.token}`;

              return (
                <Card key={sharedLink.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <CardTitle className="text-xl">{boardName}</CardTitle>
                          <Badge variant={sharedLink.isActive ? 'success' : 'secondary'}>
                            {sharedLink.isActive ? (
                              <>
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </>
                            )}
                          </Badge>
                        </div>
                        {boardDescription && (
                          <CardDescription className="mt-2">
                            {boardDescription}
                          </CardDescription>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(sharedLink.boardId, sharedLink.isActive)}
                          disabled={updateSharedLinkMutation.isPending}
                          title={sharedLink.isActive ? 'Disable link' : 'Enable link'}
                        >
                          {sharedLink.isActive ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRegenerateModal(sharedLink.boardId)}
                          title="Regenerate token"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteModal(sharedLink.boardId)}
                          title="Delete shared link"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Share URL */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Public Share Link
                      </label>
                      <div className="flex space-x-2">
                        <input
                          type="text"
                          readOnly
                          value={shareUrl}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                          onClick={(e) => e.currentTarget.select()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(sharedLink.token)}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <a
                          href={shareUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </a>
                      </div>
                    </div>

                    {/* Analytics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-sm text-gray-600">Total Views</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {sharedLink.viewCount}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Created</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(sharedLink.createdAt), 'MMM d, yyyy')}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="text-sm font-medium text-gray-900">
                          {format(new Date(sharedLink.updatedAt), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link to={`/boards/${sharedLink.boardId}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Calendar className="h-4 w-4 mr-2" />
                          View Board
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedLink(null);
          }}
          title="Delete Shared Link"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this shared link? This will permanently
              remove public access to this board. This action cannot be undone.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Anyone with the current link will no longer
                be able to access this board.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSelectedLink(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteLink}
                disabled={deleteSharedLinkMutation.isPending}
              >
                {deleteSharedLinkMutation.isPending ? 'Deleting...' : 'Delete Link'}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Regenerate Token Modal */}
        <Modal
          isOpen={regenerateModalOpen}
          onClose={() => {
            setRegenerateModalOpen(false);
            setSelectedLink(null);
          }}
          title="Regenerate Share Token"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Regenerating the token will create a new share link for this board.
              The old link will stop working immediately.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Anyone using the current link will need
                the new link to continue accessing this board.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setRegenerateModalOpen(false);
                  setSelectedLink(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRegenerateToken}
                disabled={regenerateTokenMutation.isPending}
              >
                {regenerateTokenMutation.isPending ? 'Regenerating...' : 'Regenerate Token'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </Layout>
  );
};
