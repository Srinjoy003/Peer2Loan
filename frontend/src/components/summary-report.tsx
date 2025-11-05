import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Group, Cycle, Payment, Member } from '../types';
import { generateCycleSummary, formatCurrency, formatDate } from '../lib/utils';
import { FileText, Download, Mail } from 'lucide-react';

interface SummaryReportProps {
  group: Group;
  cycles: Cycle[];
  payments: Payment[];
  members: Member[];
  currentCycle?: Cycle;
}

export function SummaryReport({ group, cycles, payments, members, currentCycle }: SummaryReportProps) {
  const activeCycle = currentCycle || cycles.find(c => c.status === 'active');
  
  const generateReport = () => {
    if (!activeCycle) return '';
    
    const cyclePayments = payments.filter(p => p.cycleId === activeCycle.id);
    const paidPayments = cyclePayments.filter(p => p.status === 'paid');
    const recipient = members.find(m => m.id === activeCycle.payoutRecipientId);
    
    return generateCycleSummary(
      activeCycle.cycleNumber,
      paidPayments.length,
      members.filter(m => m.role !== 'auditor').length,
      paidPayments.reduce((sum, p) => sum + p.amount, 0),
      recipient?.name || 'Unknown',
      activeCycle.deadline,
      group.currency
    );
  };

  const getAllReports = () => {
    return cycles
      .filter(c => c.status !== 'upcoming')
      .map(cycle => {
        const cyclePayments = payments.filter(p => p.cycleId === cycle.id);
        const paidPayments = cyclePayments.filter(p => p.status === 'paid');
        const recipient = members.find(m => m.id === cycle.payoutRecipientId);
        
        return {
          cycle,
          summary: generateCycleSummary(
            cycle.cycleNumber,
            paidPayments.length,
            members.filter(m => m.role !== 'auditor').length,
            paidPayments.reduce((sum, p) => sum + p.amount, 0),
            recipient?.name || 'Unknown',
            cycle.deadline,
            group.currency
          ),
          recipient,
          paidCount: paidPayments.length,
          totalPenalties: cyclePayments.reduce((sum, p) => sum + p.penalty, 0),
        };
      });
  };

  const currentReport = generateReport();
  const allReports = getAllReports();

  const handleExportCSV = () => {
    // Generate CSV content
    const headers = ['Cycle', 'Month', 'Status', 'Paid/Total', 'Pot Total', 'Penalties', 'Payout To', 'Payout Status', 'Summary'];
    const rows = allReports.map(r => [
      r.cycle.cycleNumber,
      formatDate(r.cycle.month),
      r.cycle.status,
      `${r.paidCount}/${members.filter(m => m.role !== 'auditor').length}`,
      r.cycle.potTotal,
      r.totalPenalties,
      r.recipient?.name || '',
      r.cycle.payoutExecuted ? 'Completed' : 'Pending',
      `"${r.summary}"`,
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${group.name.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSendEmail = () => {
    alert('Email functionality would integrate with your email service provider');
  };

  return (
    <div className="space-y-6">
      {/* Current Month Summary */}
      {currentReport && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-blue-900">Current Month Summary</CardTitle>
                <CardDescription className="text-blue-700">
                  Plain English snapshot of the current cycle
                </CardDescription>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900 text-lg leading-relaxed">
              {currentReport}
            </p>
            
            <div className="flex gap-2 mt-4 pt-4 border-t border-blue-200">
              <Button variant="outline" size="sm" className="gap-2">
                <Mail className="w-4 h-4" />
                Email to Members
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historical Reports */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Historical Reports</CardTitle>
              <CardDescription>All monthly cycle summaries</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleSendEmail} className="gap-2">
                <Mail className="w-4 h-4" />
                Email Report
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {allReports.map(report => (
            <div
                key={report.cycle.id || report.cycle.cycleNumber}
              className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>Month {report.cycle.cycleNumber} - {formatDate(report.cycle.month)}</span>
                </div>
                <Badge
                  variant={
                    report.cycle.status === 'completed' ? 'default' :
                    report.cycle.status === 'active' ? 'secondary' :
                    'outline'
                  }
                >
                  {report.cycle.status}
                </Badge>
              </div>
              
              <p className="text-muted-foreground mb-3">
                {report.summary}
              </p>
              
              {report.cycle.payoutExecuted && (
                <div className="bg-green-50 border border-green-200 rounded px-3 py-2">
                  <p className="text-green-700">
                    ✓ Payout of {formatCurrency(report.cycle.potTotal, group.currency)} completed on{' '}
                    {formatDate(report.cycle.payoutExecutedAt!)}
                    {report.cycle.payoutProof && ` (Ref: ${report.cycle.payoutProof})`}
                  </p>
                </div>
              )}
              
              {report.totalPenalties > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded px-3 py-2 mt-2">
                  <p className="text-orange-700">
                    Total penalties collected: {formatCurrency(report.totalPenalties, group.currency)}
                  </p>
                </div>
              )}
            </div>
          ))}
          {allReports.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No reports available yet. Reports will be generated as cycles progress.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Group Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Group Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Cycles</p>
              <p>{cycles.length} ({cycles.filter(c => c.status === 'completed').length} completed)</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Members</p>
              <p>{members.length} ({members.filter(m => m.role !== 'auditor').length} contributors)</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Group Status</p>
              <Badge variant={group.status === 'active' ? 'default' : 'secondary'}>
                {group.status}
              </Badge>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-muted-foreground mb-2">Group Progress</p>
            <div className="flex items-center gap-4">
              <div className="flex-1 bg-secondary rounded-full h-3">
                <div
                  className="bg-primary rounded-full h-3 transition-all"
                  style={{
                    width: `${(cycles.filter(c => c.status === 'completed').length / group.duration) * 100}%`,
                  }}
                />
              </div>
              <span>
                {Math.round((cycles.filter(c => c.status === 'completed').length / group.duration) * 100)}%
              </span>
            </div>
          </div>
          
          <div className="bg-muted rounded-lg p-4 mt-4">
            <p>
              <span className="text-muted-foreground">Expected completion:</span>{' '}
              {(() => {
                if (!group.startMonth || isNaN(Date.parse(group.startMonth)) || typeof group.duration !== 'number') {
                  return '-';
                }
                const start = new Date(group.startMonth);
                if (isNaN(start.getTime())) return '-';
                start.setMonth(start.getMonth() + group.duration);
                return formatDate(start.toISOString());
              })()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
