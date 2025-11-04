import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Button } from './ui/button';
import { Cycle, Payment, Member, Group } from '../types';
import { formatCurrency, formatDate, calculateDaysUntil } from '../lib/utils';
import { CheckCircle2, Clock, AlertCircle, XCircle, ArrowRight } from 'lucide-react';

interface CycleDashboardProps {
  cycle: Cycle;
  payments: Payment[];
  members: Member[];
  group: Group;
  onRecordPayment?: (memberId: string) => void;
  onExecutePayout?: () => void;
}

export function CycleDashboard({
  cycle,
  payments,
  members,
  group,
  onRecordPayment,
  onExecutePayout,
}: CycleDashboardProps) {
  const cyclePayments = payments.filter(p => p.cycleId === cycle.id);
  const paidPayments = cyclePayments.filter(p => p.status === 'paid');
  const pendingPayments = cyclePayments.filter(p => p.status === 'pending' || p.status === 'late');
  
  const paidCount = paidPayments.length;
  const totalCount = members.filter(m => m.role !== 'auditor').length;
  const progressPercentage = (paidCount / totalCount) * 100;
  
  const potTotal = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const totalPenalties = cyclePayments.reduce((sum, p) => sum + p.penalty, 0);
  
  const payoutRecipient = members.find(m => m.id === cycle.payoutRecipientId);
  const daysUntilDeadline = calculateDaysUntil(cycle.deadline);
  
  const quorumMet = (paidCount / totalCount) * 100 >= group.rules.quorumPercentage;

  const getPaymentStatus = (memberId: string) => {
    const payment = cyclePayments.find(p => p.memberId === memberId);
    if (!payment) return null;
    return payment;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'late':
        return <AlertCircle className="w-4 h-4 text-orange-600" />;
      case 'defaulted':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      paid: 'default',
      pending: 'secondary',
      late: 'destructive',
      defaulted: 'destructive',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Cycle Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Month {cycle.cycleNumber} - {formatDate(cycle.month)}</CardTitle>
              <CardDescription>
                Payout to: {payoutRecipient?.name} ({payoutRecipient?.payoutAccount})
              </CardDescription>
            </div>
            <Badge variant={cycle.status === 'active' ? 'default' : 'secondary'}>
              {cycle.status}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Progress</span>
              <span>{paidCount} / {totalCount} paid ({Math.round(progressPercentage)}%)</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-4 gap-4 pt-4">
            <div className="space-y-1">
              <p className="text-muted-foreground">Pot Total</p>
              <p>{formatCurrency(potTotal, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Penalties</p>
              <p className="text-orange-600">{formatCurrency(totalPenalties, group.currency)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Deadline</p>
              <p>
                {daysUntilDeadline > 0 ? `${daysUntilDeadline} days` : 
                 daysUntilDeadline === 0 ? 'Today' : 
                 `${Math.abs(daysUntilDeadline)} days overdue`}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Quorum Status</p>
              <p className={quorumMet ? 'text-green-600' : 'text-orange-600'}>
                {quorumMet ? '✓ Met' : '✗ Not Met'}
              </p>
            </div>
          </div>

          {/* Payout Action */}
          {cycle.status === 'active' && quorumMet && !cycle.payoutExecuted && (
            <div className="pt-4 border-t">
              <Button onClick={onExecutePayout} className="w-full gap-2">
                Execute Payout to {payoutRecipient?.name}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {cycle.payoutExecuted && (
            <div className="pt-4 border-t bg-green-50 p-4 rounded-md">
              <p className="flex items-center gap-2 text-green-700">
                <CheckCircle2 className="w-5 h-5" />
                Payout executed on {formatDate(cycle.payoutExecutedAt!)}
                {cycle.payoutProof && ` (Ref: ${cycle.payoutProof})`}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Status Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status</CardTitle>
          <CardDescription>Who has paid and who's pending for this cycle</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-2">
            {members.filter(m => m.role !== 'auditor').map(member => {
              const payment = getPaymentStatus(member.id);
              if (!payment) return null;
              
              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p>{member.name}</p>
                      <p className="text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {payment.status === 'paid' && payment.paidOn && (
                      <span className="text-muted-foreground">
                        Paid on {formatDate(payment.paidOn)}
                      </span>
                    )}
                    
                    {payment.penalty > 0 && (
                      <span className="text-orange-600">
                        +{formatCurrency(payment.penalty, group.currency)} fee
                      </span>
                    )}
                    
                    <div className="w-24">
                      {getStatusBadge(payment.status)}
                    </div>
                    
                    {payment.status !== 'paid' && onRecordPayment && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRecordPayment(member.id)}
                      >
                        Record Payment
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Pending Members Alert */}
      {pendingPayments.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-700">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-600">
              {pendingPayments.length} member(s) have not yet contributed for this cycle.
              Automatic reminders will be sent daily until payment is received.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
