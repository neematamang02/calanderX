import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Calendar,
  Database,
  Link as LinkIcon,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import {
  useConnectedAccounts,
  useCalendars,
  useBoards,
  useSyncAllUserData,
} from '../hooks/useApi';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { cn } from '../lib/utils';

interface DiagnosticCheck {
  name: string;
  status: 'pass' | 'fail' | 'warning' | 'loading';
  message: string;
  details?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Diagnostic: React.FC = () => {
  const navigate = useNavigate();
  const { user, token, isAuthenticated } = useAuth();
  const { data: accountsResponse, isLoading: accountsLoading, refetch: refetchAccounts } = useConnectedAccounts();
  const { data: calendarsResponse, isLoading: calendarsLoading, refetch: refetchCalendars } = useCalendars();
  const { data: boardsResponse, isLoading: boardsLoading, refetch: refetchBoards } = useBoards();
  const syncAllMutation = useSyncAllUserData();

  const [showRawData, setShowRawData] = useState(false);

  const accounts = accountsResponse?.data || [];
  const calendars = calendarsResponse?.data || [];
  const boards = boardsResponse?.data || [];

  // Run diagnostics
  const diagnostics: DiagnosticCheck[] = [
    // Check 1: Authentication
    {
      name: 'Authentication',
      status: isAuthenticated && user && token ? 'pass' : 'fail',
      message: isAuthenticated ? `Logged in as ${user?.email}` : 'Not authenticated',
      details: token ? `Token: ${token.substring(0, 20)}...` : 'No token found',
      action: !isAuthenticated ? {
        label: 'Go to Login',
        onClick: () => navigate('/login'),
      } : undefined,
    },

    // Check 2: Connected Accounts
    {
      name: 'Connected Accounts',
      status: accountsLoading ? 'loading' : accounts.length > 0 ? 'pass' : 'fail',
      message: accountsLoading
        ? 'Loading...'
        : accounts.length > 0
          ? `${accounts.length} account(s) connected`
          : 'No accounts connected',
      details: accounts.map(a => `${a.provider}: ${a.email}`).join(', '),
      action: accounts.length === 0 ? {
        label: 'Connect Calendar',
        onClick: () => navigate('/calendars'),
      } : undefined,
    },

    // Check 3: Calendars Synced
    {
      name: 'Calendars Synced',
      status: calendarsLoading ? 'loading' : calendars.length > 0 ? 'pass' : accounts.length > 0 ? 'warning' : 'fail',
      message: calendarsLoading
        ? 'Loading...'
        : calendars.length > 0
          ? `${calendars.length} calendar(s) synced`
          : accounts.length > 0
            ? 'Accounts connected but calendars not synced'
            : 'No calendars found',
      details: calendars.map(c => `${c.name} (${c.isActive ? 'Active' : 'Inactive'})`).join(', '),
      action: accounts.length > 0 && calendars.length === 0 ? {
        label: 'Sync Calendars',
        onClick: () => navigate('/calendars'),
      } : undefined,
    },

    // Check 4: Active Calendars
    {
      name: 'Active Calendars',
      status: calendarsLoading
        ? 'loading'
        : calendars.filter(c => c.isActive).length > 0
          ? 'pass'
          : calendars.length > 0
            ? 'warning'
            : 'fail',
      message: calendarsLoading
        ? 'Loading...'
        : `${calendars.filter(c => c.isActive).length} active calendar(s)`,
      details: `Inactive: ${calendars.filter(c => !c.isActive).length}`,
      action: calendars.filter(c => !c.isActive).length > 0 ? {
        label: 'Activate Calendars',
        onClick: () => navigate('/calendars'),
      } : undefined,
    },

    // Check 5: Boards Created
    {
      name: 'Boards Created',
      status: boardsLoading ? 'loading' : boards.length > 0 ? 'pass' : 'warning',
      message: boardsLoading
        ? 'Loading...'
        : boards.length > 0
          ? `${boards.length} board(s) created`
          : 'No boards created yet',
      details: boards.map(b => b.name).join(', '),
      action: boards.length === 0 ? {
        label: 'Create Board',
        onClick: () => navigate('/boards/new'),
      } : undefined,
    },

    // Check 6: Boards with Calendars
    {
      name: 'Boards with Calendars',
      status: boardsLoading
        ? 'loading'
        : boards.filter(b => b.boardCalendars.length > 0).length > 0
          ? 'pass'
          : boards.length > 0
            ? 'fail'
            : 'warning',
      message: boardsLoading
        ? 'Loading...'
        : boards.length > 0
          ? `${boards.filter(b => b.boardCalendars.length > 0).length}/${boards.length} boards have calendars`
          : 'No boards to check',
      details: boards.map(b => `${b.name}: ${b.boardCalendars.length} calendars`).join(', '),
      action: boards.filter(b => b.boardCalendars.length === 0).length > 0 ? {
        label: 'Fix Boards',
        onClick: () => navigate('/boards'),
      } : undefined,
    },

    // Check 7: Backend Connection
    {
      name: 'Backend Connection',
      status: accountsLoading || calendarsLoading || boardsLoading ? 'loading' : 'pass',
      message: 'API is responding',
      details: 'http://localhost:3001/api',
    },
  ];

  const allPassed = diagnostics.every(d => d.status === 'pass');
  const hasCriticalFailures = diagnostics.some(d => d.status === 'fail');

  const handleSyncAll = () => {
    syncAllMutation.mutate(undefined, {
      onSuccess: () => {
        refetchAccounts();
        refetchCalendars();
        refetchBoards();
      },
    });
  };

  const getStatusIcon = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'loading':
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: DiagnosticCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="success">PASS</Badge>;
      case 'fail':
        return <Badge variant="destructive">FAIL</Badge>;
      case 'warning':
        return <Badge variant="warning">WARNING</Badge>;
      case 'loading':
        return <Badge variant="secondary">LOADING</Badge>;
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Diagnostics</h1>
              <p className="mt-2 text-gray-600">
                Check if everything is configured correctly
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                refetchAccounts();
                refetchCalendars();
                refetchBoards();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={handleSyncAll}
              disabled={syncAllMutation.isPending}
            >
              <Database className="h-4 w-4 mr-2" />
              {syncAllMutation.isPending ? 'Syncing...' : 'Sync All Data'}
            </Button>
          </div>
        </div>

        {/* Overall Status */}
        <Card className={cn(
          'border-2',
          allPassed ? 'border-green-500 bg-green-50' : hasCriticalFailures ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
        )}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {allPassed ? (
                  <CheckCircle className="h-12 w-12 text-green-600" />
                ) : hasCriticalFailures ? (
                  <XCircle className="h-12 w-12 text-red-600" />
                ) : (
                  <AlertCircle className="h-12 w-12 text-yellow-600" />
                )}
                <div>
                  <h2 className="text-2xl font-bold">
                    {allPassed
                      ? '✅ All Systems Operational'
                      : hasCriticalFailures
                        ? '❌ Critical Issues Found'
                        : '⚠️ Warnings Detected'}
                  </h2>
                  <p className="text-gray-600 mt-1">
                    {allPassed
                      ? 'Your CalendarX is configured correctly!'
                      : 'Follow the action items below to resolve issues'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {diagnostics.filter(d => d.status === 'pass').length}/{diagnostics.length}
                </div>
                <p className="text-sm text-gray-600">Checks Passed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Diagnostic Checks */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnostic Checks</CardTitle>
            <CardDescription>
              System configuration status and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {diagnostics.map((check, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-start justify-between p-4 rounded-lg border',
                  check.status === 'pass' ? 'bg-green-50 border-green-200' :
                  check.status === 'fail' ? 'bg-red-50 border-red-200' :
                  check.status === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-gray-50 border-gray-200'
                )}
              >
                <div className="flex items-start space-x-4 flex-1">
                  {getStatusIcon(check.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{check.name}</h3>
                      {getStatusBadge(check.status)}
                    </div>
                    <p className="text-sm text-gray-700">{check.message}</p>
                    {check.details && (
                      <p className="text-xs text-gray-500 mt-1">{check.details}</p>
                    )}
                  </div>
                </div>
                {check.action && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={check.action.onClick}
                  >
                    {check.action.label}
                  </Button>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed Information */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Detailed Information</CardTitle>
                <CardDescription>Current system state</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRawData(!showRawData)}
              >
                {showRawData ? 'Hide' : 'Show'} Raw Data
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Connected Accounts */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <LinkIcon className="h-4 w-4 mr-2" />
                Connected Accounts ({accounts.length})
              </h3>
              {accounts.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No accounts connected</p>
              ) : (
                <div className="space-y-2">
                  {accounts.map(account => (
                    <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{account.email}</p>
                        <p className="text-xs text-gray-500">
                          Provider: {account.provider} | ID: {account.id}
                        </p>
                      </div>
                      <Badge variant="success">Connected</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Calendars */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Calendars ({calendars.length})
              </h3>
              {calendars.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No calendars synced</p>
              ) : (
                <div className="space-y-2">
                  {calendars.map(calendar => (
                    <div key={calendar.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendar.defaultColor || '#3B82F6' }}
                        />
                        <div>
                          <p className="font-medium">{calendar.name}</p>
                          <p className="text-xs text-gray-500">ID: {calendar.id}</p>
                        </div>
                      </div>
                      <Badge variant={calendar.isActive ? 'success' : 'secondary'}>
                        {calendar.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Boards */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Boards ({boards.length})
              </h3>
              {boards.length === 0 ? (
                <p className="text-sm text-gray-500 italic">No boards created</p>
              ) : (
                <div className="space-y-3">
                  {boards.map(board => (
                    <div key={board.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium">{board.name}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/boards/${board.id}`)}
                        >
                          View
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <span>{board.boardCalendars.length} calendars</span>
                        <span>•</span>
                        <span>ID: {board.id}</span>
                      </div>
                      {board.boardCalendars.length === 0 && (
                        <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded">
                          <p className="text-xs text-red-700 font-medium">
                            ⚠️ No calendars added to this board! Events won't show.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => navigate(`/boards/${board.id}/edit`)}
                          >
                            Add Calendars Now
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Raw Data */}
            {showRawData && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Raw API Data</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Accounts Response:</p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {JSON.stringify(accountsResponse, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Calendars Response:</p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {JSON.stringify(calendarsResponse, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-700 mb-1">Boards Response:</p>
                    <pre className="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto">
                      {JSON.stringify(boardsResponse, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {!allPassed && (
          <Card className="border-blue-500 bg-blue-50">
            <CardHeader>
              <CardTitle>Recommended Next Steps</CardTitle>
              <CardDescription>Follow these steps to get everything working</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {!isAuthenticated && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">1.</span>
                    <div>
                      <p className="font-medium">Login to your account</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/login')}>
                        Go to Login
                      </Button>
                    </div>
                  </li>
                )}
                {isAuthenticated && accounts.length === 0 && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">{isAuthenticated ? '1' : '2'}.</span>
                    <div>
                      <p className="font-medium">Connect a Google or Microsoft calendar</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/calendars')}>
                        Connect Calendar
                      </Button>
                    </div>
                  </li>
                )}
                {accounts.length > 0 && calendars.length === 0 && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">2.</span>
                    <div>
                      <p className="font-medium">Sync calendars from your connected account</p>
                      <p className="text-sm text-gray-600">Go to Calendars page and click the "Sync" button on your account card</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/calendars')}>
                        Sync Calendars
                      </Button>
                    </div>
                  </li>
                )}
                {calendars.length > 0 && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">3.</span>
                    <div>
                      <p className="font-medium">Sync events from your calendars</p>
                      <p className="text-sm text-gray-600">This can take 10-30 seconds</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={handleSyncAll}
                        disabled={syncAllMutation.isPending}
                      >
                        {syncAllMutation.isPending ? 'Syncing...' : 'Sync All Events'}
                      </Button>
                    </div>
                  </li>
                )}
                {boards.length === 0 && calendars.length > 0 && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">4.</span>
                    <div>
                      <p className="font-medium">Create your first board</p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/boards/new')}>
                        Create Board
                      </Button>
                    </div>
                  </li>
                )}
                {boards.filter(b => b.boardCalendars.length === 0).length > 0 && (
                  <li className="flex items-start space-x-3">
                    <span className="font-bold text-blue-600">5.</span>
                    <div>
                      <p className="font-medium text-red-600">⚠️ CRITICAL: Add calendars to your boards</p>
                      <p className="text-sm text-gray-600">
                        This is the most commonly missed step! Go to each board's edit page and add calendars.
                      </p>
                      <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/boards')}>
                        Fix Boards Now
                      </Button>
                    </div>
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};
