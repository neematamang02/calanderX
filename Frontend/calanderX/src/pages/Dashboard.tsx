import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, Share2, Settings, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useBoards, useConnectedAccounts, useSyncAllUserData } from '../hooks/useApi';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingSpinner';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { data: boardsResponse, isLoading: boardsLoading } = useBoards();
  const { data: accountsResponse, isLoading: accountsLoading } = useConnectedAccounts();
  const syncAllMutation = useSyncAllUserData();

  const boards = boardsResponse?.data || [];
  const accounts = accountsResponse?.data || [];

  const handleSyncAll = () => {
    syncAllMutation.mutate();
  };

  if (boardsLoading || accountsLoading) {
    return (
      <Layout>
        <LoadingState message="Loading dashboard..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.name || user?.email}
            </h1>
            <p className="mt-2 text-gray-600">
              Manage your calendars and boards from here
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleSyncAll}
              disabled={syncAllMutation.isPending}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {syncAllMutation.isPending ? 'Syncing...' : 'Sync All'}
            </Button>
            
            <Link to="/boards/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Board
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connected Accounts</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{accounts.length}</div>
              <p className="text-xs text-muted-foreground">
                Google & Microsoft accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Calendar Boards</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boards.length}</div>
              <p className="text-xs text-muted-foreground">
                Custom calendar views
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Shared Links</CardTitle>
              <Share2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {boards.filter(board => board.boardCalendars.length > 0).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Public calendar shares
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Boards */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Boards</CardTitle>
              <CardDescription>
                Your latest calendar board configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {boards.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No boards created yet</p>
                  <Link to="/boards/new">
                    <Button>Create Your First Board</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {boards.slice(0, 3).map((board) => (
                    <div
                      key={board.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div>
                        <h3 className="font-medium">{board.name}</h3>
                        <p className="text-sm text-gray-600">
                          {board.boardCalendars.length} calendars
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {board.maskEvents && (
                          <Badge variant="secondary">Masked</Badge>
                        )}
                        <Link to={`/boards/${board.id}`}>
                          <Button variant="outline" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {boards.length > 3 && (
                    <div className="text-center pt-4">
                      <Link to="/boards">
                        <Button variant="outline">View All Boards</Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Connected Accounts */}
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your calendar integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No accounts connected</p>
                  <Link to="/calendars">
                    <Button>Connect Your First Account</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {accounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">
                            {account.displayName || account.email}
                          </h3>
                          <p className="text-sm text-gray-600 capitalize">
                            {account.provider}
                          </p>
                        </div>
                      </div>
                      <Badge variant="success">Connected</Badge>
                    </div>
                  ))}
                  
                  <div className="text-center pt-4">
                    <Link to="/calendars">
                      <Button variant="outline">Manage Accounts</Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks to get you started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link to="/calendars" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-medium">Manage Calendars</h3>
                  <p className="text-sm text-gray-600">Connect and sync calendars</p>
                </div>
              </Link>
              
              <Link to="/boards/new" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                  <Plus className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-medium">Create Board</h3>
                  <p className="text-sm text-gray-600">New calendar view</p>
                </div>
              </Link>
              
              <Link to="/shared" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                  <Share2 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-medium">Shared Links</h3>
                  <p className="text-sm text-gray-600">Manage public shares</p>
                </div>
              </Link>
              
              <Link to="/settings" className="block">
                <div className="p-4 border rounded-lg hover:bg-gray-50 text-center">
                  <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
                  <h3 className="font-medium">Settings</h3>
                  <p className="text-sm text-gray-600">Account preferences</p>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};