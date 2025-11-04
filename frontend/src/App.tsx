import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Button } from './components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { GroupSetup } from './components/group-setup';
import { CycleDashboard } from './components/cycle-dashboard';
import { MemberLedger } from './components/member-ledger';
import { GroupLedger } from './components/group-ledger';
import { SummaryReport } from './components/summary-report';
import { PaymentRecorder } from './components/payment-recorder';
import { TurnOrderTimeline } from './components/turn-order-timeline';
import { mockGroup, mockMembers, mockCycles, mockPayments } from './lib/mock-data';
import { Group, Member, Cycle, Payment } from './types';
import { formatCurrency } from './lib/utils';
import { Users, Calendar, FileText, TrendingUp, Settings, PlusCircle } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'setup' | 'dashboard'>('dashboard');
  const [group, setGroup] = useState<Group>(mockGroup);
  const [members, setMembers] = useState<Member[]>(mockMembers);
  const [cycles, setCycles] = useState<Cycle[]>(mockCycles);
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [paymentRecorderOpen, setPaymentRecorderOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const currentCycle = cycles.find(c => c.status === 'active');
  const currentUser = members[0]; // Simulating logged-in user as first member (admin)

  const handleGroupCreated = (newGroup: Group) => {
    setGroup(newGroup);
    setCurrentView('dashboard');
    alert('Group created successfully! You can now add members and start the first cycle.');
  };

  const handleRecordPayment = (memberId: string) => {
    const payment = payments.find(
      p => p.memberId === memberId && p.cycleId === currentCycle?.id && p.status !== 'paid'
    );
    if (payment) {
      const member = members.find(m => m.id === memberId);
      if (member) {
        setSelectedMember(member);
        setSelectedPayment(payment);
        setPaymentRecorderOpen(true);
      }
    }
  };

  const handlePaymentRecorded = (paymentId: string, proof: string, paidOn: string) => {
    setPayments(prev =>
      prev.map(p =>
        p.id === paymentId
          ? { ...p, status: 'paid' as const, proof, paidOn, updatedAt: new Date().toISOString() }
          : p
      )
    );
  };

  const handleExecutePayout = () => {
    if (!currentCycle) return;
    
    const confirmed = window.confirm(
      `Execute payout of ${formatCurrency(currentCycle.potTotal, group.currency)} to ${
        members.find(m => m.id === currentCycle.payoutRecipientId)?.name
      }?`
    );
    
    if (confirmed) {
      setCycles(prev =>
        prev.map(c =>
          c.id === currentCycle.id
            ? {
                ...c,
                payoutExecuted: true,
                payoutExecutedAt: new Date().toISOString(),
                payoutProof: `TXN-${Date.now()}`,
                status: 'completed' as const,
              }
            : c
        )
      );
      alert('Payout executed successfully!');
    }
  };

  if (currentView === 'setup') {
    return <GroupSetup onGroupCreated={handleGroupCreated} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1>Peer2Loan</h1>
              <p className="text-muted-foreground">{group.name}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-muted-foreground">Logged in as</p>
                <p>{currentUser.name}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('setup')}
                className="gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                New Group
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="current" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="current" className="gap-2">
              <Calendar className="w-4 h-4" />
              Current Cycle
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="w-4 h-4" />
              Members
            </TabsTrigger>
            <TabsTrigger value="group" className="gap-2">
              <Settings className="w-4 h-4" />
              Group Ledger
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <FileText className="w-4 h-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="my-ledger" className="gap-2">
              My Ledger
            </TabsTrigger>
          </TabsList>

          {/* Current Cycle Tab */}
          <TabsContent value="current" className="space-y-6">
            {currentCycle ? (
              <CycleDashboard
                cycle={currentCycle}
                payments={payments}
                members={members}
                group={group}
                onRecordPayment={handleRecordPayment}
                onExecutePayout={handleExecutePayout}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>No Active Cycle</CardTitle>
                  <CardDescription>All cycles completed or not yet started</CardDescription>
                </CardHeader>
              </Card>
            )}
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline">
            <TurnOrderTimeline cycles={cycles} members={members} group={group} />
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Members</CardTitle>
                <CardDescription>Select a member to view their ledger</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {members.map(member => (
                    <Card
                      key={member.id}
                      className="cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedMember(member)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{member.name}</CardTitle>
                            <CardDescription>{member.email}</CardDescription>
                          </div>
                          <span className="capitalize text-muted-foreground">{member.role}</span>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>

            {selectedMember && (
              <MemberLedger
                member={selectedMember}
                payments={payments}
                cycles={cycles}
                group={group}
              />
            )}
          </TabsContent>

          {/* Group Ledger Tab */}
          <TabsContent value="group">
            <GroupLedger group={group} cycles={cycles} payments={payments} members={members} />
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <SummaryReport
              group={group}
              cycles={cycles}
              payments={payments}
              members={members}
              currentCycle={currentCycle}
            />
          </TabsContent>

          {/* My Ledger Tab */}
          <TabsContent value="my-ledger">
            <MemberLedger
              member={currentUser}
              payments={payments}
              cycles={cycles}
              group={group}
            />
          </TabsContent>
        </Tabs>
      </main>

      {/* Payment Recorder Dialog */}
      {selectedMember && selectedPayment && (
        <PaymentRecorder
          open={paymentRecorderOpen}
          onClose={() => {
            setPaymentRecorderOpen(false);
            setSelectedMember(null);
            setSelectedPayment(null);
          }}
          member={selectedMember}
          payment={selectedPayment}
          group={group}
          onPaymentRecorded={handlePaymentRecorded}
        />
      )}
    </div>
  );
}
