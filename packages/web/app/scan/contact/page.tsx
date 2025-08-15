'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowLeft,
  UserCheck,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { detectionService } from '@/services/detection.service';
import Link from 'next/link';

export default function ContactVerificationPage() {
  const { toast } = useToast();
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  
  const [inputData, setInputData] = useState({
    name: '',
    phone: '',
    email: '',
    workplace: '',
    additionalContacts: ''
  });

  const handleScan = async () => {
    if (!inputData.name && !inputData.phone && !inputData.email) {
      toast({
        title: 'Input Required',
        description: 'Please provide at least one contact detail to verify.',
        variant: 'destructive',
      });
      return;
    }

    setIsScanning(true);
    setScanComplete(false);
    setScanResult(null);
    setProgress(0);

    // Create contacts array from input
    const contacts = [{
      name: inputData.name || undefined,
      phone: inputData.phone || undefined,
      email: inputData.email || undefined,
      workplace: inputData.workplace || undefined
    }];

    // Add additional contacts if provided
    if (inputData.additionalContacts) {
      const lines = inputData.additionalContacts.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        const parts = line.split(',').map(p => p.trim());
        if (parts[0]) {
          contacts.push({
            name: parts[0],
            phone: parts[1] || undefined,
            email: parts[2] || undefined,
            workplace: parts[3] || undefined
          });
        }
      });
    }

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await detectionService.verifyContacts({ contacts });
      
      clearInterval(progressInterval);
      setProgress(100);
      setScanResult(result);
      setScanComplete(true);
      
      toast({
        title: 'Scan Complete',
        description: 'Contact verification completed successfully.',
      });
    } catch (error) {
      console.error('Contact verification failed:', error);
      toast({
        title: 'Scan Failed',
        description: 'Failed to verify contacts. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskBadge = (score: number) => {
    if (score >= 70) return { color: 'bg-red-500', text: 'High Risk' };
    if (score >= 40) return { color: 'bg-yellow-500', text: 'Medium Risk' };
    return { color: 'bg-green-500', text: 'Low Risk' };
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link href="/scan">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to All Scans
        </Button>
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Contact Verification</h1>
        <p className="text-muted-foreground">
          Verify phone numbers, emails, and names against international scammer databases
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Enter Contact Information</CardTitle>
          <CardDescription>
            Provide contact details to verify against scammer databases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={inputData.name}
                onChange={(e) => setInputData(prev => ({ ...prev, name: e.target.value }))}
                disabled={isScanning}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                placeholder="+1234567890"
                value={inputData.phone}
                onChange={(e) => setInputData(prev => ({ ...prev, phone: e.target.value }))}
                disabled={isScanning}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={inputData.email}
                onChange={(e) => setInputData(prev => ({ ...prev, email: e.target.value }))}
                disabled={isScanning}
              />
            </div>
            <div>
              <Label htmlFor="workplace">Workplace/Company</Label>
              <Input
                id="workplace"
                placeholder="Company Name"
                value={inputData.workplace}
                onChange={(e) => setInputData(prev => ({ ...prev, workplace: e.target.value }))}
                disabled={isScanning}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="additional">Additional Contacts (Optional)</Label>
            <Textarea
              id="additional"
              placeholder="Enter additional contacts, one per line (format: name, phone, email, workplace)"
              value={inputData.additionalContacts}
              onChange={(e) => setInputData(prev => ({ ...prev, additionalContacts: e.target.value }))}
              disabled={isScanning}
              rows={4}
            />
          </div>

          <Button 
            onClick={handleScan} 
            disabled={isScanning}
            className="w-full"
            size="lg"
          >
            {isScanning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying Contacts...
              </>
            ) : (
              <>
                <UserCheck className="mr-2 h-4 w-4" />
                Start Verification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {isScanning && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          </CardContent>
        </Card>
      )}

      {scanComplete && scanResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Verification Results
                <span className={`px-3 py-1 rounded-full text-white text-sm ${getRiskBadge(scanResult.riskScore || 0).color}`}>
                  {getRiskBadge(scanResult.riskScore || 0).text}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {scanResult.results && scanResult.results.map((contact: any, index: number) => (
                <div key={index} className="mb-6 p-4 border rounded-lg">
                  <h3 className="font-semibold mb-3">{contact.name || contact.phone || contact.email}</h3>
                  
                  {contact.phoneVerification && (
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        <Phone className="h-4 w-4 mr-2" />
                        <span className="font-medium">Phone Verification</span>
                      </div>
                      <div className="ml-6 text-sm space-y-1">
                        <p>Carrier: {contact.phoneVerification.carrier || 'Unknown'}</p>
                        <p>Type: {contact.phoneVerification.lineType || 'Unknown'}</p>
                        <p>Location: {contact.phoneVerification.location || 'Unknown'}</p>
                        {contact.phoneVerification.spamScore && (
                          <p>Spam Score: {contact.phoneVerification.spamScore}%</p>
                        )}
                      </div>
                    </div>
                  )}

                  {contact.emailVerification && (
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        <Mail className="h-4 w-4 mr-2" />
                        <span className="font-medium">Email Verification</span>
                      </div>
                      <div className="ml-6 text-sm space-y-1">
                        <p>Valid: {contact.emailVerification.valid ? 'Yes' : 'No'}</p>
                        <p>Disposable: {contact.emailVerification.disposable ? 'Yes' : 'No'}</p>
                        {contact.emailVerification.reputation && (
                          <p>Reputation: {contact.emailVerification.reputation}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {contact.workplaceVerification && (
                    <div className="mb-3">
                      <div className="flex items-center mb-2">
                        <Building className="h-4 w-4 mr-2" />
                        <span className="font-medium">Workplace Verification</span>
                      </div>
                      <div className="ml-6 text-sm space-y-1">
                        <p>Company: {contact.workplaceVerification.company}</p>
                        <p>Valid: {contact.workplaceVerification.valid ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  )}

                  {contact.scammerDatabaseMatch && (
                    <Alert variant="destructive" className="mt-3">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Warning</AlertTitle>
                      <AlertDescription>
                        This contact matches entries in scammer databases
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Summary</h4>
                <p className="text-sm">
                  Risk Score: {scanResult.riskScore || 0}/100
                </p>
                {scanResult.recommendation && (
                  <p className="text-sm mt-2">{scanResult.recommendation}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}