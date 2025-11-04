import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Member, Payment, Group } from '../types';
import { formatCurrency } from '../lib/utils';
import { Upload, CheckCircle2 } from 'lucide-react';

interface PaymentRecorderProps {
  open: boolean;
  onClose: () => void;
  member: Member;
  payment: Payment;
  group: Group;
  onPaymentRecorded: (paymentId: string, proof: string, paidOn: string) => void;
}

export function PaymentRecorder({
  open,
  onClose,
  member,
  payment,
  group,
  onPaymentRecorded,
}: PaymentRecorderProps) {
  const [proof, setProof] = useState('');
  const [paidOn, setPaidOn] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleSubmit = () => {
    setUploading(true);
    
    // Simulate upload delay
    setTimeout(() => {
      onPaymentRecorded(payment.id, proof || `TXN-${Date.now()}`, paidOn);
      setUploading(false);
      setProof('');
      setNotes('');
      onClose();
    }, 1000);
  };

  const handleFileUpload = () => {
    // Simulate file upload
    const mockRef = `UPLOAD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setProof(mockRef);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record contribution from {member.name}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Payment Details */}
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Member</span>
              <span>{member.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span>{formatCurrency(payment.amount, group.currency)}</span>
            </div>
            {payment.penalty > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Penalty</span>
                <span className="text-orange-600">
                  +{formatCurrency(payment.penalty, group.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t">
              <span>Total Due</span>
              <span>
                {formatCurrency(payment.amount + payment.penalty, group.currency)}
              </span>
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="paidOn">Payment Date</Label>
            <Input
              id="paidOn"
              type="date"
              value={paidOn}
              onChange={(e) => setPaidOn(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Proof of Payment */}
          <div className="space-y-2">
            <Label htmlFor="proof">Proof of Payment</Label>
            <div className="flex gap-2">
              <Input
                id="proof"
                value={proof}
                onChange={(e) => setProof(e.target.value)}
                placeholder="Transaction ID or reference number"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleFileUpload}
                className="gap-2"
              >
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
            <p className="text-muted-foreground">
              Enter transaction reference or upload payment screenshot
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this payment"
              rows={3}
            />
          </div>

          {/* Confirmation */}
          {proof && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-green-700">
                Payment proof recorded: {proof}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!proof || uploading}>
            {uploading ? 'Recording...' : 'Record Payment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
