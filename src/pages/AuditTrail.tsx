import { useState, useEffect } from 'react';
import { enhancedFhirService } from '@/services/fhirServiceV2';
import { AuditLogEntry } from '@/types/fhir';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Activity, Download, Filter, Clock, User, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuditTrail = () => {
  const { toast } = useToast();
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [timeRangeFilter, setTimeRangeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const pageSize = 20;

  useEffect(() => {
    loadAuditLog();
  }, [page, actionFilter, timeRangeFilter, statusFilter]);

  const getTimeRangeFilter = () => {
    const now = new Date();
    switch (timeRangeFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { startDate: today.toISOString() };
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { startDate: weekAgo.toISOString() };
      case 'month':
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return { startDate: monthAgo.toISOString() };
      default:
        return {};
    }
  };

  const loadAuditLog = async () => {
    setLoading(true);
    try {
      const filters = {
        action: actionFilter !== 'all' ? actionFilter : undefined,
        success: statusFilter === 'success' ? true : statusFilter === 'error' ? false : undefined,
        ...getTimeRangeFilter()
      };
      
      const response = await enhancedFhirService.getAuditLog(page, pageSize, filters);
      
      setAuditEntries(response.entries);
      setTotal(response.total);
    } catch (error) {
      toast({
        title: 'Error Loading Audit Log',
        description: 'Failed to load audit trail data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadAuditLog = () => {
    const csvHeader = 'timestamp,userId,userName,action,query,resultCount,success,duration,ipAddress\n';
    const csvData = auditEntries.map(entry => 
      `${entry.timestamp},${entry.userId},${entry.userName},${entry.action},${entry.query || ''},${entry.resultCount || ''},${entry.success},${entry.duration},${entry.ipAddress || ''}`
    ).join('\n');
    
    const blob = new Blob([csvHeader + csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download Started',
      description: 'Audit log is being downloaded as CSV.',
      variant: 'default'
    });
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'search': return 'bg-blue-100 text-blue-800';
      case 'translate': return 'bg-green-100 text-green-800';
      case 'encounter_upload': return 'bg-purple-100 text-purple-800';
      case 'bulk_upload': return 'bg-orange-100 text-orange-800';
      case 'fhir_generation': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <AlertTriangle className="w-4 h-4 text-red-600" />
    );
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Trail</h1>
          <p className="text-muted-foreground mt-2">
            View system activity logs and user interactions
          </p>
        </div>
        <Button onClick={downloadAuditLog} variant="success">
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Filter Card */}
      <Card className="shadow-medical">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-primary" />
            Filter Options
          </CardTitle>
          <CardDescription>
            Filter audit entries by action type or time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Action Type</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="search">Search Operations</SelectItem>
                  <SelectItem value="translate">Translation Requests</SelectItem>
                  <SelectItem value="encounter_upload">Encounter Uploads</SelectItem>
                  <SelectItem value="bulk_upload">Bulk Uploads</SelectItem>
                  <SelectItem value="fhir_generation">FHIR Generation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRangeFilter} onValueChange={setTimeRangeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="backdrop-blur-md bg-card/95 border border-border/50 shadow-2xl">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success Only</SelectItem>
                  <SelectItem value="error">Errors Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            </div>
            
            {(actionFilter !== 'all' || timeRangeFilter !== 'all' || statusFilter !== 'all') && (
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setActionFilter('all');
                    setTimeRangeFilter('all');
                    setStatusFilter('all');
                    setPage(1);
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              System Activity Log
            </div>
            <Badge variant="outline">
              {total} total entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner size="lg" text="Loading audit log..." />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Query/Resource</TableHead>
                      <TableHead>Results</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditEntries.map((entry) => (
                      <TableRow key={entry.id} className="hover:bg-muted/50">
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {formatTimestamp(entry.timestamp)}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {entry.userName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {entry.ipAddress}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${getActionColor(entry.action)} border-0`}>
                            {entry.action.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm max-w-xs truncate">
                          {entry.query || entry.resource || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.resultCount !== undefined ? `${entry.resultCount} results` : '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {entry.duration}ms
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(entry.success)}
                            <span className={`text-sm ${entry.success ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.success ? 'Success' : 'Failed'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, total)} of {total} entries
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {auditEntries.filter(e => e.action === 'search').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Searches</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {auditEntries.filter(e => e.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {auditEntries.filter(e => e.action === 'bulk_upload').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Bulk Uploads</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(auditEntries.reduce((sum, e) => sum + e.duration, 0) / auditEntries.length) || 0}ms
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;