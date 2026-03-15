import React, { useState } from 'react';
import { Calendar, Plus, RefreshCw, Settings, Trash2 } from 'lucide-react';
import {
  useConnectedAccounts,
  useCalendars,
  useInitiateOAuth,
  useDisconnectAccount,
  useSyncAccountCalendars,
  useToggleCalendarStatus,
} from '../hooks/useApi';
import { Layout } from '../components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { LoadingState, LoadingSpinner } from '../components/ui/LoadingSpinner';
import { Modal } from '../components/ui/Modal';

export const Calendars: React.FC = () => {
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  
  const { data: accountsResponse, isLoading: accountsLoading, refetch: refetchAccounts } = useConnectedAccounts();
  const { data: calendarsResponse, isLoading: calendarsLoading, refetch: refetchCalendars } = useCalendars();
  const initiateOAuthMutation = useInitiateOAuth();
  const disconnectAccountMutation = useDisconnectAccount();
  const syncAccountMutation = useSyncAccountCalendars();
  const toggleCalendarMutation = useToggleCalendarStatus();

  const accounts = accountsResponse?.data || [];
  const calendars = calendarsResponse?.data || [];

  // Auto-refresh data when component mounts (useful after OAuth redirect)
  React.useEffect(() => {
    refetchAccounts();
    refetchCalendars();
  }, [refetchAccounts, refetchCalendars]);

  const handleConnectAccount = (provider: 'google' | 'microsoft') => {
    initiateOAuthMutation.mutate(provider);
  };

  const handleDisconnectAccount = (accountId: string) => {
    disconnectAccountMutation.mutate(accountId);
    setSelectedAccount(null);
  };

  const handleSyncAccount = (accountId: string) => {
    syncAccountMutation.mutate(accountId);
  };

  const handleToggleCalendar = (calendarId: string) => {
    toggleCalendarMutation.mutate(calendarId);
  };

  if (accountsLoading || calendarsLoading) {
    return (
      <Layout>
        <LoadingState message="Loading calendars..." />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Calendar Management</h1>
            <p className="mt-2 text-gray-600">
              Connect and manage your calendar accounts
            </p>
          </div>
        </div>

        {/* Connect New Account */}
        <Card>
          <CardHeader>
            <CardTitle>Connect Calendar Account</CardTitle>
            <CardDescription>
              Add Google or Microsoft calendar accounts to sync your events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => handleConnectAccount('google')}
                disabled={initiateOAuthMutation.isPending}
                className="flex items-center justify-center"
              >
                {initiateOAuthMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Connect Google Calendar
              </Button>
              
              <Button
                onClick={() => handleConnectAccount('microsoft')}
                disabled={initiateOAuthMutation.isPending}
                variant="outline"
                className="flex items-center justify-center"
              >
                {initiateOAuthMutation.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Plus className="h-4 w-4 mr-2" />
                )}
                Connect Microsoft Calendar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Connected Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts ({accounts.length})</CardTitle>
            <CardDescription>
              Manage your connected calendar accounts and sync settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accounts.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No accounts connected yet</p>
                <p className="text-sm text-gray-400">
                  Connect your first calendar account to get started
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {accounts.map((account) => (
                  <div
                    key={account.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {account.displayName || account.email}
                        </h3>
                        <p className="text-sm text-gray-600">{account.email}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="capitalize">
                            {account.provider}
                          </Badge>
                          <Badge variant="success">Connected</Badge>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSyncAccount(account.id)}
                        disabled={syncAccountMutation.isPending}
                        title="Sync calendars from this account"
                      >
                        {syncAccountMutation.isPending ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Sync
                          </>
                        )}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedAccount(account.id)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendars List */}
        <Card>
          <CardHeader>
            <CardTitle>Your Calendars ({calendars.length})</CardTitle>
            <CardDescription>
              Individual calendars from your connected accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calendars.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No calendars found</p>
                <p className="text-sm text-gray-400">
                  Connect an account and sync to see your calendars
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {calendars.map((calendar) => (
                  <div
                    key={calendar.id}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate">
                          {calendar.name}
                        </h3>
                        {calendar.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {calendar.description}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-1 ml-2">
                        {calendar.defaultColor && (
                          <div
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: calendar.defaultColor }}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={calendar.isActive ? 'success' : 'secondary'}
                        >
                          {calendar.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {calendar.timezone && (
                          <Badge variant="outline" className="text-xs">
                            {calendar.timezone}
                          </Badge>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleCalendar(calendar.id)}
                        disabled={toggleCalendarMutation.isPending}
                      >
                        {calendar.isActive ? 'Disable' : 'Enable'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Account Settings Modal */}
        {selectedAccount && (
          <Modal
            isOpen={!!selectedAccount}
            onClose={() => setSelectedAccount(null)}
            title="Account Settings"
          >
            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to disconnect this account? This will remove all associated calendars and events.
              </p>
              
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedAccount(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDisconnectAccount(selectedAccount)}
                  disabled={disconnectAccountMutation.isPending}
                >
                  {disconnectAccountMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Disconnecting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Disconnect Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Layout>
  );
};