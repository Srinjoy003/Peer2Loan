import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Group, Cycle, Payment, Member } from '../types';
import { formatCurrency, formatDate } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface GroupLedgerProps {
  group: Group;
  cycles: Cycle[];
  payments: Payment[];
  members: Member[];
}

export function GroupLedger({ group, cycles, payments, members }: GroupLedgerProps) {
  // Calculate cycle statistics
  const cycleStats = cycles.map(cycle => {
    const cyclePayments = payments.filter(p => p.cycleId === cycle.id);
    const paidPayments = cyclePayments.filter(p => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPenalties = cyclePayments.reduce((sum, p) => sum + p.penalty, 0);
    const paidCount = paidPayments.length;
    const totalMembers = members.filter(m => m.role !== 'auditor').length;
    
    return {
      cycle,
      totalCollected,
      totalPenalties,
      paidCount,
      totalMembers,
      payoutAmount: cycle.payoutExecuted ? cycle.potTotal : 0,
    };
  });

  // Prepare chart data
  const chartData = cycleStats.map(stat => ({
    month: `M${stat.cycle.cycleNumber}`,
    collected: stat.totalCollected,
    payout: stat.payoutAmount,
    penalties: stat.totalPenalties,
  }));

  // Overall statistics
  const totalCollected = cycleStats.reduce((sum, s) => sum + s.totalCollected, 0);
  const totalPayouts = cycleStats.reduce((sum, s) => sum + s.payoutAmount, 0);
  const totalPenalties = cycleStats.reduce((sum, s) => sum + s.totalPenalties, 0);
  const completedCycles = cycles.filter(c => c.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Group Overview */}
      <Card>
        <CardHeader>
          <CardTitle>{group.name}</CardTitle>
          <CardDescription>
              {group.groupSize ?? '-'} members • {group.currency ?? ''}{typeof group.monthlyContribution === 'number' ? group.monthlyContribution.toLocaleString() : '-'} per month
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Collected</p>
              <p>{formatCurrency(totalCollected, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Payouts</p>
              <p className="text-green-600">{formatCurrency(totalPayouts, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Penalties</p>
              <p className="text-orange-600">{formatCurrency(totalPenalties, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Completed Cycles</p>
              <p>{completedCycles} / {group.duration}</p>
            </div>
          </div>

          {/* Group Details */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-muted-foreground">Start Date</p>
              <p>{group.startMonth ? formatDate(group.startMonth) : '-'}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Payment Window</p>
              <p>
                Day {group.paymentWindow?.startDay ?? '-'} - {group.paymentWindow?.endDay ?? '-'}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Turn Order</p>
              <p className="capitalize">{group.turnOrderPolicy ?? '-'}</p>
            </div>
          </div>

          {/* Rules */}
          <div className="grid grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-muted-foreground">Grace Period</p>
              <p>{group.rules.gracePeriodDays} days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Late Fee</p>
              <p>{formatCurrency(group.rules.lateFeePerDay, group.currency)}/day</p>
            </div>
            <div>
              <p className="text-muted-foreground">Max Late Fee</p>
              <p>{formatCurrency(group.rules.lateFeeMax, group.currency)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quorum</p>
              <p>{group.rules.quorumPercentage}%</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cashflow Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Cashflow Timeline</CardTitle>
          <CardDescription>Monthly collections, payouts, and penalties</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => formatCurrency(value, group.currency)}
              />
              <Legend />
              <Bar dataKey="collected" fill="hsl(var(--chart-1))" name="Collected" />
              <Bar dataKey="payout" fill="hsl(var(--chart-2))" name="Payout" />
              <Bar dataKey="penalties" fill="hsl(var(--chart-3))" name="Penalties" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cycle-wise Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Cycle-wise Breakdown</CardTitle>
          <CardDescription>Detailed view of each monthly cycle</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Paid / Total</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Penalties</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Recipient</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cycleStats.map(stat => {
                const recipient = members.find(m => m.id === stat.cycle.payoutRecipientId);
                
                return (
                  <TableRow key={stat.cycle.id}>
                    <TableCell>Month {stat.cycle.cycleNumber}</TableCell>
                    <TableCell>{formatDate(stat.cycle.month)}</TableCell>
                    <TableCell>
                      {stat.paidCount} / {stat.totalMembers}
                      <span className="text-muted-foreground ml-2">
                        ({Math.round((stat.paidCount / stat.totalMembers) * 100)}%)
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(stat.totalCollected, group.currency)}</TableCell>
                    <TableCell className={stat.totalPenalties > 0 ? 'text-orange-600' : ''}>
                      {stat.totalPenalties > 0 ? formatCurrency(stat.totalPenalties, group.currency) : '-'}
                    </TableCell>
                    <TableCell className={stat.payoutAmount > 0 ? 'text-green-600' : ''}>
                      {stat.payoutAmount > 0 ? formatCurrency(stat.payoutAmount, group.currency) : '-'}
                    </TableCell>
                    <TableCell>{recipient?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stat.cycle.status === 'completed' ? 'default' :
                          stat.cycle.status === 'active' ? 'secondary' :
                          'outline'
                        }
                      >
                        {stat.cycle.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Variance Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Variance Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cycleStats.map(stat => {
              const expectedCollection = stat.totalMembers * group.monthlyContribution;
              const variance = stat.totalCollected - expectedCollection;
              const variancePercentage = (variance / expectedCollection) * 100;
              
              if (variance === 0) return null;
              
              return (
                <div key={stat.cycle.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p>Month {stat.cycle.cycleNumber}</p>
                    <p className="text-muted-foreground">
                      Expected: {formatCurrency(expectedCollection, group.currency)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {variance >= 0 ? '+' : ''}{formatCurrency(variance, group.currency)}
                    </p>
                    <p className="text-muted-foreground">
                      {variancePercentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
            
            {cycleStats.every(s => s.totalCollected === s.totalMembers * group.monthlyContribution) && (
              <p className="text-center text-muted-foreground py-8">
                No variances detected. All cycles collected the expected amount.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
