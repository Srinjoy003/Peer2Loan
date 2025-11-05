import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Group, TurnOrderPolicy } from '../types';
import { PlusCircle } from 'lucide-react';


interface GroupSetupProps {
  onGroupCreated: (group: Group) => void;
  onCancel?: () => void;
}

export function GroupSetup({ onGroupCreated, onCancel }: GroupSetupProps) {
  const [formData, setFormData] = useState({
    name: '',
    currency: '₹',
    monthlyContribution: '',
    groupSize: '',
    startMonth: '',
    paymentStartDay: '1',
    paymentEndDay: '7',
    turnOrderPolicy: 'fixed' as TurnOrderPolicy,
    gracePeriodDays: '2',
    lateFeePerDay: '',
    lateFeeMax: '',
    quorumPercentage: '90',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const group: Group = {
      id: `group-${Date.now()}`,
      name: formData.name,
      currency: formData.currency,
      monthlyContribution: parseFloat(formData.monthlyContribution),
      groupSize: parseInt(formData.groupSize),
      startMonth: formData.startMonth,
      duration: parseInt(formData.groupSize),
      paymentWindow: {
        startDay: parseInt(formData.paymentStartDay),
        endDay: parseInt(formData.paymentEndDay),
      },
      turnOrderPolicy: formData.turnOrderPolicy,
      rules: {
        gracePeriodDays: parseInt(formData.gracePeriodDays),
        lateFeePerDay: parseFloat(formData.lateFeePerDay),
        lateFeeMax: parseFloat(formData.lateFeeMax),
        quorumPercentage: parseInt(formData.quorumPercentage),
        allowReplacementMembers: true,
      },
      createdAt: new Date().toISOString(),
      status: 'active',
    };
    
    onGroupCreated(group);
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New Group</CardTitle>
          <CardDescription>
            Set up a new pooled lending group with contribution rules and turn order policy
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3>Basic Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Group Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g., Community Savings Circle"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={formData.currency} onValueChange={(v) => updateField('currency', v)}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="₹">₹ (INR)</SelectItem>
                      <SelectItem value="$">$ (USD)</SelectItem>
                      <SelectItem value="€">€ (EUR)</SelectItem>
                      <SelectItem value="£">£ (GBP)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contribution">Monthly Contribution</Label>
                  <Input
                    id="contribution"
                    type="number"
                    value={formData.monthlyContribution}
                    onChange={(e) => updateField('monthlyContribution', e.target.value)}
                    placeholder="10000"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="groupSize">Group Size (Members)</Label>
                  <Input
                    id="groupSize"
                    type="number"
                    value={formData.groupSize}
                    onChange={(e) => updateField('groupSize', e.target.value)}
                    placeholder="12"
                    min="3"
                    max="50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="startMonth">Start Month</Label>
                <Input
                  id="startMonth"
                  type="month"
                  value={formData.startMonth}
                  onChange={(e) => updateField('startMonth', e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Payment Rules */}
            <div className="space-y-4">
              <h3>Payment Rules</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentStartDay">Payment Window Start (Day)</Label>
                  <Input
                    id="paymentStartDay"
                    type="number"
                    value={formData.paymentStartDay}
                    onChange={(e) => updateField('paymentStartDay', e.target.value)}
                    min="1"
                    max="28"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentEndDay">Payment Window End (Day)</Label>
                  <Input
                    id="paymentEndDay"
                    type="number"
                    value={formData.paymentEndDay}
                    onChange={(e) => updateField('paymentEndDay', e.target.value)}
                    min="1"
                    max="31"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gracePeriod">Grace Period (Days)</Label>
                  <Input
                    id="gracePeriod"
                    type="number"
                    value={formData.gracePeriodDays}
                    onChange={(e) => updateField('gracePeriodDays', e.target.value)}
                    min="0"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lateFeePerDay">Late Fee Per Day</Label>
                  <Input
                    id="lateFeePerDay"
                    type="number"
                    value={formData.lateFeePerDay}
                    onChange={(e) => updateField('lateFeePerDay', e.target.value)}
                    placeholder="100"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lateFeeMax">Max Late Fee</Label>
                  <Input
                    id="lateFeeMax"
                    type="number"
                    value={formData.lateFeeMax}
                    onChange={(e) => updateField('lateFeeMax', e.target.value)}
                    placeholder="500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quorum">Quorum Percentage</Label>
                <Input
                  id="quorum"
                  type="number"
                  value={formData.quorumPercentage}
                  onChange={(e) => updateField('quorumPercentage', e.target.value)}
                  min="50"
                  max="100"
                  placeholder="90"
                  required
                />
                <p className="text-muted-foreground">Percentage of members who must pay before payout</p>
              </div>
            </div>

            {/* Turn Order Policy */}
            <div className="space-y-4">
              <h3>Turn Order Policy</h3>
              
              <div className="space-y-2">
                <Label htmlFor="turnOrder">Policy</Label>
                <Select
                  value={formData.turnOrderPolicy}
                  onValueChange={(v) => updateField('turnOrderPolicy', v as TurnOrderPolicy)}
                >
                  <SelectTrigger id="turnOrder">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (Join Order)</SelectItem>
                    <SelectItem value="randomized">Randomized</SelectItem>
                    <SelectItem value="rule-based">Rule-Based (Admin Approval)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground">
                  {formData.turnOrderPolicy === 'fixed' && 'Members receive payout in the order they joined'}
                  {formData.turnOrderPolicy === 'randomized' && 'Random turn assignment at group creation'}
                  {formData.turnOrderPolicy === 'rule-based' && 'Admin assigns turns based on need/rules'}
                </p>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" className="gap-2">
              <PlusCircle className="w-4 h-4" />
              Create Group
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
