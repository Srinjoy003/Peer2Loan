import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Cycle, Member, Group } from '../types';
import { formatDate, formatCurrency } from '../lib/utils';
import { CheckCircle2, Clock, Circle } from 'lucide-react';

interface TurnOrderTimelineProps {
  cycles: Cycle[];
  members: Member[];
  group: Group;
}

export function TurnOrderTimeline({ cycles, members, group }: TurnOrderTimelineProps) {
  const contributingMembers = members.filter(m => m.role !== 'auditor');

  const getStatusIcon = (cycle: Cycle) => {
    if (cycle.status === 'completed' && cycle.payoutExecuted) {
      return <CheckCircle2 className="w-5 h-5 text-green-600" />;
    } else if (cycle.status === 'active') {
      return <Clock className="w-5 h-5 text-blue-600" />;
    } else {
      return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Filter cycles with valid payout recipient and valid recipient name
  const cyclesWithRecipient = cycles?.filter(cycle => {
    const recipient = members.find(m => m.id === cycle.payoutRecipientId);
    return recipient && recipient.name && recipient.name !== 'Unknown';
  });

  if (!cyclesWithRecipient || cyclesWithRecipient.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Turn Order & Timeline</CardTitle>
          <CardDescription>
            Payout schedule for all members ({group.turnOrderPolicy} policy)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center min-h-[120px] text-muted-foreground">
            No timeline data available.
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle>Turn Order & Timeline</CardTitle>
        <CardDescription>
          Payout schedule for all members ({group.turnOrderPolicy} policy)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {cyclesWithRecipient.map((cycle, index) => {
            const recipient = members.find(m => m.id === cycle.payoutRecipientId);
            if (!recipient) return null;
            const isLast = index === cyclesWithRecipient.length - 1;
            // Use a unique key: cycle.id if present, else cycle.cycleNumber, else index
              const key = cycle.id || cycle.cycleNumber || index;
            return (
              <div key={key} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="flex-shrink-0">
                    {getStatusIcon(cycle)}
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full min-h-[60px] bg-border mt-2" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-8">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(recipient.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p>{recipient.name}</p>
                        <p className="text-muted-foreground">
                          Month {cycle.cycleNumber} • {formatDate(cycle.month)}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        cycle.status === 'completed' ? 'default' :
                        cycle.status === 'active' ? 'secondary' :
                        'outline'
                      }
                    >
                      {cycle.status}
                    </Badge>
                  </div>
                  <div className="bg-muted rounded-lg p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Payout Amount</span>
                      <span>
                        {cycle.potTotal > 0 
                          ? formatCurrency(cycle.potTotal, group.currency)
                          : formatCurrency(group.monthlyContribution * contributingMembers.length, group.currency)
                        }
                      </span>
                    </div>
                    {cycle.payoutExecuted && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Executed On</span>
                          <span className="text-green-600">
                            {formatDate(cycle.payoutExecutedAt!)}
                          </span>
                        </div>
                        {cycle.payoutProof && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reference</span>
                            <span className="font-mono">{cycle.payoutProof}</span>
                          </div>
                        )}
                      </>
                    )}
                    {!cycle.payoutExecuted && cycle.status === 'active' && (
                      <div className="text-blue-600">
                        Scheduled for payout after {formatDate(cycle.deadline)}
                      </div>
                    )}
                    {cycle.status === 'upcoming' && (
                      <div className="text-muted-foreground">
                        Upcoming turn
                      </div>
                    )}
                    {cycle.notes && (
                      <div className="pt-2 border-t">
                        <p className="text-muted-foreground">{cycle.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {/* Summary */}
        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-muted-foreground">Completed</p>
              <p>{cyclesWithRecipient.filter(c => c.status === 'completed').length}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Active</p>
              <p>{cyclesWithRecipient.filter(c => c.status === 'active').length}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Upcoming</p>
              <p>{cyclesWithRecipient.filter(c => c.status === 'upcoming').length}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
