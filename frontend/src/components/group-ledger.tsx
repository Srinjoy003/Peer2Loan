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

export function GroupLedger2({ group, cycles, payments, members }: GroupLedgerProps) {
  if (!group || !group.rules) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        No group ledger data available.
      </div>
    );
  }
  return (
    <div className="space-y-6">
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

export function GroupLedger({ group, cycles, payments, members }: GroupLedgerProps) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-muted-foreground">
        No group ledger data available.
      </div>
    );
  }
