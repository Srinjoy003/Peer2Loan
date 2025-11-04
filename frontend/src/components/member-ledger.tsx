import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Member, Payment, Cycle, Group, MemberStats } from '../types';
import { formatCurrency, formatDate, calculateMemberStats } from '../lib/utils';
import { TrendingUp, TrendingDown, Award, AlertTriangle } from 'lucide-react';

interface MemberLedgerProps {
  member: Member;
  payments: Payment[];
  cycles: Cycle[];
  group: Group;
}

export function MemberLedger({ member, payments, cycles, group }: MemberLedgerProps) {
  const stats = calculateMemberStats(member.id, payments, cycles, group);
  const memberPayments = payments.filter(p => p.memberId === member.id);
  
  const payoutCycle = cycles.find(c => c.payoutRecipientId === member.id);

  return (
    <div className="space-y-6">
      {/* Member Summary Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{member.name}</CardTitle>
              <CardDescription>{member.email} • {member.phone}</CardDescription>
            </div>
            <Badge>{member.role}</Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Key Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-muted-foreground">Total Paid</p>
              <p>{formatCurrency(stats.totalPaid, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Penalties</p>
              <p className="text-orange-600">
                {formatCurrency(stats.totalPenalties, group.currency)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Payout Received</p>
              <p className={stats.payoutReceived ? 'text-green-600' : ''}>
                {stats.payoutReceived 
                  ? formatCurrency(stats.payoutAmount, group.currency)
                  : 'Pending'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Net Position</p>
              <div className="flex items-center gap-2">
                {stats.netPosition >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">
                      {formatCurrency(Math.abs(stats.netPosition), group.currency)}
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-red-600" />
                    <span className="text-red-600">
                      -{formatCurrency(Math.abs(stats.netPosition), group.currency)}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Progress Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-muted-foreground">Completion</p>
              <p>{stats.completionPercentage}%</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">On-Time Payments</p>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-green-600" />
                <span>{stats.onTimePayments}</span>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Late Payments</p>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
                <span>{stats.latePayments}</span>
              </div>
            </div>
          </div>

          {/* Arrears Warning */}
          {stats.totalArrears > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-orange-700">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                Outstanding arrears: {formatCurrency(stats.totalArrears, group.currency)}
              </p>
            </div>
          )}

          {/* Payout Schedule */}
          {payoutCycle && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700">
                {stats.payoutReceived ? (
                  <>✓ Received payout in Month {payoutCycle.cycleNumber}</>
                ) : (
                  <>📅 Scheduled to receive payout in Month {payoutCycle.cycleNumber} ({formatDate(payoutCycle.month)})</>
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All contributions for this member</CardDescription>
        </CardHeader>
        
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cycle</TableHead>
                <TableHead>Month</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Penalty</TableHead>
                <TableHead>Paid On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proof</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {memberPayments.map(payment => {
                const cycle = cycles.find(c => c.id === payment.cycleId);
                if (!cycle) return null;
                
                return (
                  <TableRow key={payment.id}>
                    <TableCell>Month {cycle.cycleNumber}</TableCell>
                    <TableCell>{formatDate(cycle.month)}</TableCell>
                    <TableCell>{formatCurrency(payment.amount, group.currency)}</TableCell>
                    <TableCell className={payment.penalty > 0 ? 'text-orange-600' : ''}>
                      {payment.penalty > 0 ? formatCurrency(payment.penalty, group.currency) : '-'}
                    </TableCell>
                    <TableCell>
                      {payment.paidOn ? formatDate(payment.paidOn) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          payment.status === 'paid' ? 'default' :
                          payment.status === 'late' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.proof || '-'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Account Details */}
      <Card>
        <CardHeader>
          <CardTitle>Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-muted-foreground">Payout Account</p>
              <p>{member.payoutAccount}</p>
            </div>
            {member.emergencyContact && (
              <div>
                <p className="text-muted-foreground">Emergency Contact</p>
                <p>
                  {member.emergencyContact.name} - {member.emergencyContact.phone}
                </p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground">Joined On</p>
              <p>{formatDate(member.joinedAt)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <Badge variant={member.confirmedJoin ? 'default' : 'secondary'}>
                {member.confirmedJoin ? 'Active' : 'Pending Confirmation'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
