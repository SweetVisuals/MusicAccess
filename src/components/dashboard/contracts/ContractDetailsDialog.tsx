import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/@/ui/dialog";
import { Button } from "@/components/@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/@/ui/card";
import { Badge } from "@/components/@/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/@/ui/dropdown-menu"; // Added for status dropdown
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import { pdfjs } from 'react-pdf'; // Keep pdfjs import for worker setup
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react'; // For navigation arrows

// This component displays contract details and a PDF viewer.
// Added a comment to force re-evaluation.
interface Contract {
  id: string;
  title: string;
  type: 'service' | 'audio';
  status: 'draft' | 'pending' | 'active' | 'expired';
  created_at: string; // Changed to match Supabase column name
  expires_at?: string; // Changed to match Supabase column name
  royalty_split?: number;
  revenue_split?: number;
  split_notes?: string;
  terms_conditions?: string;
  distribution_platforms?: string;
  distribution_territories?: string;
  distribution_notes?: string;
  publisher_name?: string;
  pro_affiliation?: string;
  publishing_notes?: string;
}

interface ContractDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contract: Contract | null;
  onEdit: (contract: Contract) => void;
  onStatusChange: (id: string, newStatus: Contract['status']) => void; // New prop for status change
}

// Create styles for the PDF document
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    fontFamily: 'Helvetica',
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  logo: {
    width: 50,
    height: 50,
  },
  headerText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
  },
  subHeader: {
    fontSize: 18,
    marginBottom: 10,
    marginTop: 15,
    color: '#555555',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 12,
    marginBottom: 5,
    lineHeight: 1.5,
  },
  label: {
    fontWeight: 'bold',
    marginRight: 5,
  },
  value: {
    marginBottom: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
    marginVertical: 10,
  },
});

// Create PDF document component
export const MyDocument = ({ contract }: { contract: Contract }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerSection}>
        {/* Removed Image component as it was causing "Not valid image extension" error */}
        <Text style={styles.headerText}>TuneFlow Contract</Text>
      </View>
      <View style={styles.divider} />

      <Text style={styles.subHeader}>General Information</Text>
      <Text style={styles.text}><Text style={styles.label}>Title:</Text> {contract.title}</Text>
      <Text style={styles.text}><Text style={styles.label}>Type:</Text> {contract.type}</Text>
      <Text style={styles.text}><Text style={styles.label}>Status:</Text> {contract.status}</Text>
      <Text style={styles.text}><Text style={styles.label}>Created At:</Text> {new Date(contract.created_at).toLocaleDateString()}</Text>
      {contract.expires_at && <Text style={styles.text}><Text style={styles.label}>Expires At:</Text> {new Date(contract.expires_at).toLocaleDateString()}</Text>}
      <View style={styles.divider} />

      {contract.royalty_split !== undefined || contract.revenue_split !== undefined || contract.split_notes ? (
        <>
          <Text style={styles.subHeader}>Splits</Text>
          {contract.royalty_split !== undefined && <Text style={styles.text}><Text style={styles.label}>Royalty Split:</Text> {contract.royalty_split}%</Text>}
          {contract.revenue_split !== undefined && <Text style={styles.text}><Text style={styles.label}>Revenue Split:</Text> {contract.revenue_split}%</Text>}
          {contract.split_notes && <Text style={styles.text}><Text style={styles.label}>Notes:</Text> {contract.split_notes}</Text>}
          <View style={styles.divider} />
        </>
      ) : null}

      {contract.terms_conditions ? (
        <>
          <Text style={styles.subHeader}>Terms and Conditions</Text>
          <Text style={styles.text}>{contract.terms_conditions}</Text>
          <View style={styles.divider} />
        </>
      ) : null}

      {contract.distribution_platforms || contract.distribution_territories || contract.distribution_notes ? (
        <>
          <Text style={styles.subHeader}>Distribution</Text>
          {contract.distribution_platforms && <Text style={styles.text}><Text style={styles.label}>Platforms:</Text> {contract.distribution_platforms}</Text>}
          {contract.distribution_territories && <Text style={styles.text}><Text style={styles.label}>Territories:</Text> {contract.distribution_territories}</Text>}
          {contract.distribution_notes && <Text style={styles.text}><Text style={styles.label}>Notes:</Text> {contract.distribution_notes}</Text>}
          <View style={styles.divider} />
        </>
      ) : null}

      {contract.publisher_name || contract.pro_affiliation || contract.publishing_notes ? (
        <>
          <Text style={styles.subHeader}>Publishing</Text>
          {contract.publisher_name && <Text style={styles.text}><Text style={styles.label}>Publisher Name:</Text> {contract.publisher_name}</Text>}
          {contract.pro_affiliation && <Text style={styles.text}><Text style={styles.label}>PRO Affiliation:</Text> {contract.pro_affiliation}</Text>}
          {contract.publishing_notes && <Text style={styles.text}><Text style={styles.label}>Notes:</Text> {contract.publishing_notes}</Text>}
          <View style={styles.divider} />
        </>
      ) : null}
    </Page>
  </Document>
);

// Set up PDF.js worker source
// Using unpkg CDN as a robust fallback for worker loading
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@4.8.69/build/pdf.worker.min.js`;

export const ContractDetailsDialog: React.FC<ContractDetailsDialogProps> = ({ isOpen, onClose, contract, onEdit, onStatusChange }) => {
  // Declare hooks unconditionally at the top level
  const [pdfBlobUrl, setPdfBlobUrl] = React.useState<string | null>(null); // Initialize with null

  // Generate PDF blob URL using useEffect to ensure it's always called
  React.useEffect(() => {
    const generatePdf = async () => {
      if (contract) {
        console.log("Attempting to generate PDF for contract:", contract);
        try {
          // Generate PDF as a blob
          const blob = await pdf(<MyDocument contract={contract} />).toBlob();
          const url = URL.createObjectURL(blob);
          setPdfBlobUrl(url);
          console.log("PDF blob URL generated:", url);
        } catch (error) {
          console.error("Error generating PDF blob:", error);
          setPdfBlobUrl(null); // Set to null on error
        }
      } else {
        console.log("No contract provided, setting PDF blob URL to null.");
        setPdfBlobUrl(null); // Set to null if no contract
      }
    };

    generatePdf();

    return () => {
      // Cleanup: revoke the object URL when the component unmounts or contract changes
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [contract]); // Depend only on contract to regenerate PDF when it changes

  // Conditional return after all hooks are called
  if (!contract) {
    return null;
  }

  const getStatusColor = (status: Contract['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'expired':
        return 'bg-red-500/10 text-red-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col" aria-describedby="contract-details-description">
        <DialogHeader className="flex flex-row items-center justify-between pr-10"> {/* Added pr-10 for spacing */}
          <DialogTitle>Contract Details: {contract.title}</DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(contract)}
            className="flex items-center gap-2 mr-4"
          >
            <Pencil className="h-4 w-4" />
            Edit Contract
          </Button>
        </DialogHeader>
        <div id="contract-details-description" className="sr-only">Full details and PDF of the selected contract.</div>
        <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
          {/* Contract Details Section */}
          <div className="overflow-y-auto pr-4 custom-scrollbar">
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>General Information</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-2 text-sm">
                <p><strong>Title:</strong> {contract.title}</p>
                <p><strong>Type:</strong> <Badge variant="outline">{contract.type}</Badge></p>
                <p>
                  <strong>Status:</strong>{" "}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Badge className={`${getStatusColor(contract.status)} cursor-pointer`}>
                        {contract.status}
                      </Badge>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {['draft', 'pending', 'active', 'expired'].map((statusOption) => (
                        <DropdownMenuItem
                          key={statusOption}
                          onClick={() => onStatusChange(contract.id, statusOption as Contract['status'])}
                          className={statusOption === contract.status ? 'font-bold' : ''}
                        >
                          {statusOption.charAt(0).toUpperCase() + statusOption.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </p>
                <p><strong>Created At:</strong> {new Date(contract.created_at).toLocaleDateString()}</p>
                {contract.expires_at && <p><strong>Expires At:</strong> {new Date(contract.expires_at).toLocaleDateString()}</p>}
              </CardContent>
            </Card>

            {(contract.royalty_split !== undefined || contract.revenue_split !== undefined || contract.split_notes) && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Splits</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {contract.royalty_split !== undefined && <p><strong>Royalty Split:</strong> {contract.royalty_split}%</p>}
                  {contract.revenue_split !== undefined && <p><strong>Revenue Split:</strong> {contract.revenue_split}%</p>}
                  {contract.split_notes && <p><strong>Notes:</strong> {contract.split_notes}</p>}
                </CardContent>
              </Card>
            )}

            {contract.terms_conditions && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Terms and Conditions</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">
                  <p className="whitespace-pre-wrap">{contract.terms_conditions}</p>
                </CardContent>
              </Card>
            )}

            {(contract.distribution_platforms || contract.distribution_territories || contract.distribution_notes) && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Distribution</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {contract.distribution_platforms && <p><strong>Platforms:</strong> {contract.distribution_platforms}</p>}
                  {contract.distribution_territories && <p><strong>Territories:</strong> {contract.distribution_territories}</p>}
                  {contract.distribution_notes && <p><strong>Notes:</strong> {contract.distribution_notes}</p>}
                </CardContent>
              </Card>
            )}

            {(contract.publisher_name || contract.pro_affiliation || contract.publishing_notes) && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle>Publishing</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 text-sm">
                  {contract.publisher_name && <p><strong>Publisher Name:</strong> {contract.publisher_name}</p>}
                  {contract.pro_affiliation && <p><strong>PRO Affiliation:</strong> {contract.pro_affiliation}</p>}
                  {contract.publishing_notes && <p><strong>Notes:</strong> {contract.publishing_notes}</p>}
                </CardContent>
              </Card>
            )}
          </div>

          {/* PDF Viewer Section */}
          <div className="flex-1 flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Contract PDF</h3>
            <div className="flex-1 border rounded-lg overflow-hidden">
              {pdfBlobUrl ? (
                <iframe src={pdfBlobUrl} className="w-full h-full" title="Contract PDF Viewer" />
              ) : (
                <div className="text-muted-foreground flex items-center justify-center h-full">Loading PDF...</div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
