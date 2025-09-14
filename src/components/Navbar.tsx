"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { Plus, Upload, Download } from "lucide-react";
import { parseAndValidateCSV } from "../utils/CSVUtils";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { UserButton } from "@clerk/nextjs";

export default function Navbar() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [validatedData, setValidatedData] = useState<any[]>([]);
  const [uploadSummary, setUploadSummary] = useState<{
    valid: number;
    invalid: number;
    errors: string[];
  }>({
    valid: 0,
    invalid: 0,
    errors: [],
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleAddLead = () => {
    router.push("/buyers/new");
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    toast.info('Parsing CSV file...');

    try {
      const { validItems, invalidItems } = await parseAndValidateCSV(file);

      // Store the validated data for later use
      setValidatedData(validItems);
      
      setUploadSummary({
        valid: validItems.length,
        invalid: invalidItems.length,
        errors: invalidItems.flatMap((item) => [
          `Row ${item.row}: ${item.errors.join(", ")}`,
        ]),
      });

      // Show confirmation dialog if there are valid items
      if (validItems.length > 0) {
        setConfirmDialogOpen(true);
      } else {
        // If no valid items, just show the summary dialog
        setDialogOpen(true);
      }

    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to process CSV file');
    } finally {
      setIsUploading(false);
      // Clear file input to allow uploading same file again if needed
      e.target.value = "";
    }
  };

  const confirmImport = async () => {
    setConfirmDialogOpen(false);
    setIsUploading(true);
    
    try {
      toast.info(`Saving ${validatedData.length} records...`);
      
      const response = await fetch('/api/buyers/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ buyers: validatedData }),
      });

      if (!response.ok) {
        throw new Error('Failed to save buyers to database');
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.imported || validatedData.length} buyers!`);
      
      // Show summary dialog
      setDialogOpen(true);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import buyers');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelImport = () => {
    setConfirmDialogOpen(false);
    setValidatedData([]);
    // Show summary dialog if there were validation errors
    if (uploadSummary.invalid > 0) {
      setDialogOpen(true);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    // If there were successful imports, refresh the page
    if (uploadSummary.valid > 0) {
      router.refresh();
    }
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      handleDialogClose();
    } else {
      setDialogOpen(true);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    toast.info('Preparing CSV export...');
    
    try {
      const response = await fetch('/api/buyers/export');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Get the blob from response
      const blob = await response.blob();
      
      // Check if we have data to export
      if (blob.size === 0) {
        toast.warning('No data available to export');
        return;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from response headers or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'buyers-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`CSV export downloaded successfully as ${filename}`);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <nav className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="text-xl -mt-1 font-bold text-white">EstateSync</div>
            <div className="hidden md:flex  items-center space-x-6">
              <Button
                onClick={() => router.push("/buyers")}
                variant="ghost"
                className="text-zinc-300 hover:text-white text-md hover:bg-zinc-800 cursor-pointer"
              >
                Buyers
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Add Lead */}
            <Tooltip content="Add New Buyer" side="bottom">
              <Button
                size="sm"
                className="bg-purple-600 p-[18px] hover:bg-purple-700 cursor-pointer rounded-full"
                onClick={handleAddLead}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </Tooltip>

            {/* Upload CSV */}
            <Tooltip content="Import Buyers CSV" side="bottom">
              <Button
                size="sm"
                className="bg-purple-600 p-[18px] hover:bg-purple-700 cursor-pointer rounded-full"
                onClick={openFileDialog}
                disabled={isUploading}
              >
                <Upload className={`h-4 w-4 ${isUploading ? 'animate-spin' : ''}`} />
              </Button>
            </Tooltip>
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              className="hidden"
              onChange={onFileSelected}
            />

            {/* Export CSV */}
            <Tooltip content="Export Buyers Data" side="bottom">
              <Button
                size="sm"
                className="bg-purple-600 p-[18px] hover:bg-purple-700 cursor-pointer rounded-full"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download className={`h-4 w-4 ${isExporting ? 'animate-loading' : ''}`} />
              </Button>
            </Tooltip>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  userButtonAvatarBox: {
                    width: "37px",
                    height: "37px",
                  },
                },
              }}
            />
          </div>
        </div>
      </nav>

      {/* Confirmation Dialog for Import */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm CSV Import</DialogTitle>
            <DialogDescription>
              Ready to import <span className="font-semibold text-green-600">{uploadSummary.valid} valid records</span> from your CSV file.
              {uploadSummary.invalid > 0 && (
                <>
                  <br />
                  <span className="text-orange-600">{uploadSummary.invalid} records will be skipped due to validation errors.</span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {uploadSummary.invalid > 0 && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-sm text-orange-800 font-medium mb-2">Records with errors:</p>
              <div className="max-h-32 overflow-auto text-xs text-orange-700 space-y-1">
                {uploadSummary.errors.slice(0, 5).map((err, idx) => (
                  <div key={idx}>{err}</div>
                ))}
                {uploadSummary.errors.length > 5 && (
                  <div className="text-orange-600">...and {uploadSummary.errors.length - 5} more errors</div>
                )}
              </div>
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={cancelImport}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmImport}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isUploading ? 'Importing...' : `Import ${uploadSummary.valid} Records`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog for upload summary */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>CSV Upload Summary</DialogTitle>
            <DialogDescription>
              {uploadSummary.valid} rows are valid.
              <br />
              {uploadSummary.invalid} rows failed validation.
            </DialogDescription>
          </DialogHeader>
          {uploadSummary.invalid > 0 && (
            <div className="mt-4 max-h-60 overflow-auto text-sm text-red-500 space-y-1">
              {uploadSummary.errors.map((err, idx) => (
                <div key={idx}>{err}</div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleDialogClose}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
