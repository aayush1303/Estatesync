"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buyerSchema, type BuyerFormData } from "../../../validations/buyer";
import Navbar from "../../../components/Navbar";
import { useUser } from "@clerk/nextjs";
import { useIsAdmin } from "../../../hooks/useIsAdmin";
import { useTags } from "../../../hooks/useTags";

// Shadcn UI Components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "../../../components/FileUpload";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  X, 
  Plus, 
  Edit3, 
  Save, 
  XCircle, 
  Clock,
  User,
  AlertCircle,
  FileIcon
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Types
interface Buyer {
  id: string;
  fullName: string;
  email?: string;
  phone: string;
  city: "Chandigarh" | "Mohali" | "Zirakpur" | "Panchkula" | "Other";
  propertyType: "Apartment" | "Villa" | "Plot" | "Office" | "Retail";
  bhk?: "1" | "2" | "3" | "4" | "Studio";
  purpose: "Buy" | "Rent";
  budgetMin?: number;
  budgetMax?: number;
  timeline: "0-3m" | "3-6m" | ">6m" | "Exploring";
  source: "Website" | "Referral" | "Walk-in" | "Call" | "Other";
  status: "New" | "Qualified" | "Contacted" | "Visited" | "Negotiation" | "Converted" | "Dropped";
  notes?: string;
  tags?: string[];
  attachmentUrl?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

const BuyerDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const buyerId = params.id as string;
  const { user } = useUser();
  const { isAdmin } = useIsAdmin();
  const { allTags } = useTags();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [editModeStartTime, setEditModeStartTime] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyer, setBuyer] = useState<Buyer | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [concurrencyError, setConcurrencyError] = useState(false);
  const [originalUpdatedAt, setOriginalUpdatedAt] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const form = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: "Chandigarh",
      propertyType: "Apartment",
      bhk: undefined,
      purpose: "Buy",
      budgetMin: undefined,
      budgetMax: undefined,
      timeline: "0-3m",
      source: "Website",
      notes: "",
      tags: [],
      attachmentUrl: "",
    } as Partial<BuyerFormData>,
  });

  // Fetch buyer data
  useEffect(() => {
    const fetchBuyer = async () => {
      if (!buyerId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch(`/api/buyers/${buyerId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Buyer not found');
          }
          throw new Error('Failed to fetch buyer');
        }
        
        const buyerData: Buyer = await response.json();
        setBuyer(buyerData);
        setTags(buyerData.tags || []);
        setOriginalUpdatedAt(buyerData.updatedAt);
        
        // Reset form with fetched data
        form.reset({
          fullName: buyerData.fullName,
          email: buyerData.email || "",
          phone: buyerData.phone,
          city: buyerData.city,
          propertyType: buyerData.propertyType,
          bhk: buyerData.bhk,
          purpose: buyerData.purpose,
          budgetMin: buyerData.budgetMin,
          budgetMax: buyerData.budgetMax,
          timeline: buyerData.timeline,
          source: buyerData.source,
          notes: buyerData.notes || "",
          tags: buyerData.tags || [],
          attachmentUrl: buyerData.attachmentUrl || "",
        });
        
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to fetch buyer');
        setError(err instanceof Error ? err.message : 'Failed to fetch buyer');
      } finally {
        setLoading(false);
      }
    };

    fetchBuyer();
  }, [buyerId]);

  const propertyType = form.watch("propertyType");
  const shouldShowBHK = propertyType === "Apartment" || propertyType === "Villa";

  // Check if current user can edit this buyer
  const canEdit = buyer && (isAdmin || buyer.ownerId === user?.id);

  // Handle tag operations
  const addTag = (tagToAdd?: string) => {
    const tagValue = tagToAdd || tagInput.trim();
    if (tagValue && !tags.includes(tagValue)) {
      const newTags = [...tags, tagValue];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
      setShowTagSuggestions(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    } else if (e.key === "Escape") {
      setShowTagSuggestions(false);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    setShowTagSuggestions(value.length > 0);
  };

  // Filter suggested tags based on input and exclude already selected ones
  const suggestedTags = allTags.filter(tag => 
    tag.toLowerCase().includes(tagInput.toLowerCase()) &&
    !tags.includes(tag)
  ).slice(0, 5); // Limit to 5 suggestions

  // Format functions
  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (!max) return `₹${(min! / 100000).toFixed(1)}L+`;
    if (!min) return `Up to ₹${(max / 100000).toFixed(1)}L`;
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-600/20 text-blue-400 border-blue-600/50';
      case 'Qualified': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/50';
      case 'Contacted': return 'bg-orange-600/20 text-orange-400 border-orange-600/50';
      case 'Visited': return 'bg-purple-600/20 text-purple-400 border-purple-600/50';
      case 'Negotiation': return 'bg-indigo-600/20 text-indigo-400 border-indigo-600/50';
      case 'Converted': return 'bg-green-600/20 text-green-400 border-green-600/50';
      case 'Dropped': return 'bg-red-600/20 text-red-400 border-red-600/50';
      default: return 'bg-zinc-600/20 text-zinc-400 border-zinc-600/50';
    }
  };

  const handleCancel = () => {
    if (!buyer) return;
    
    setIsEditMode(false);
    setEditModeStartTime(null);
    setConcurrencyError(false);
    toast.info('Edit cancelled');
    // Reset form to original values
    form.reset({
      fullName: buyer.fullName,
      email: buyer.email || "",
      phone: buyer.phone,
      city: buyer.city,
      propertyType: buyer.propertyType,
      bhk: buyer.bhk,
      purpose: buyer.purpose,
      budgetMin: buyer.budgetMin,
      budgetMax: buyer.budgetMax,
      timeline: buyer.timeline,
      source: buyer.source,
      notes: buyer.notes || "",
      tags: buyer.tags || [],
    } as Partial<BuyerFormData>);
    setTags(buyer.tags || []);
  };

  const onSubmit = async (data: BuyerFormData) => {
    if (!buyer) return;
    
    // Prevent auto-submission if not actually in edit mode
    if (!isEditMode) {
      return;
    }
    
    // Prevent submission if edit mode was just enabled (within 1 second)
    if (editModeStartTime && Date.now() - editModeStartTime < 1000) {
      return;
    }
    
    toast.info('Saving buyer...');
    
    setIsSubmitting(true);
    setConcurrencyError(false);
    
    try {
      // Check for concurrency issues by fetching current data
      const checkResponse = await fetch(`/api/buyers/${buyerId}`);
      if (checkResponse.ok) {
        const currentBuyer = await checkResponse.json();
        if (currentBuyer.updatedAt !== originalUpdatedAt) {
          setConcurrencyError(true);
          setIsSubmitting(false);
          return;
        }
      }
      
      console.log('Form data being submitted:', data);
      console.log('Tags from state:', tags);
      
      const submitData = {
        ...data,
        tags: tags, // Use the tags from state
      };
      
      console.log('Final submit data:', submitData);
      
      // Update buyer via API
      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update buyer');
      }
      
      const updatedBuyer = await response.json();
      setBuyer(updatedBuyer);
      setOriginalUpdatedAt(updatedBuyer.updatedAt);
      setIsEditMode(false);
      
      toast.success('Buyer updated successfully!');
      
      // Refresh the page to get updated data
      window.location.reload();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update buyer. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onDelete = async () => {
    if (!buyer) return;
    try {
      setIsSubmitting(true);
      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete buyer');
      }
      toast.success('Buyer deleted successfully!');
      router.push('/buyers');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete buyer. Please try again.';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
      setShowDeleteDialog(false);
    }
  };

  // Helper function to get initials
  const getInitials = (fullName: string) => {
    return fullName
      .split(' ')
      .map(name => name.charAt(0).toUpperCase())
      .slice(0, 2)
      .join('');
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-8">
                <div className="text-center text-zinc-300">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  Loading buyer details...
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-8">
                <div className="text-center text-red-400">
                  <AlertCircle className="h-8 w-8 mx-auto mb-4" />
                  <p className="mb-4">{error}</p>
                  <div className="space-x-4">
                    <Button 
                      onClick={() => window.location.reload()} 
                      className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                    >
                      Retry
                    </Button>
                    <Button 
                      onClick={() => router.push('/buyers')} 
                      variant="outline"
                      className="border-zinc-600 text-black cursor-pointer"
                    >
                      Back to Buyers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // No buyer found
  if (!buyer) {
    return (
      <div className="min-h-screen bg-zinc-900">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <Card className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-8">
                <div className="text-center text-zinc-400">
                  <User className="h-8 w-8 mx-auto mb-4" />
                  <p className="mb-4">Buyer not found</p>
                  <Button 
                    onClick={() => router.push('/buyers')} 
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Back to Buyers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 overflow-x-hidden">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-purple-600 text-white text-lg">
                    {getInitials(buyer.fullName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold text-white">{buyer.fullName}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getStatusColor(buyer.status)}>
                      {buyer.status}
                    </Badge>
                    <span className="text-zinc-400 text-sm">
                      Updated {formatDate(buyer.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <div className="flex gap-2">
                {canEdit && (
                  <>
                    <Button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Edit button clicked');
                        setIsEditMode(true);
                        setEditModeStartTime(Date.now());
                        toast.info('Edit mode enabled');
                      }}
                      className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                        type="button"
                        onClick={() => setShowDeleteDialog(true)}
                        disabled={isSubmitting}
                        className="border-zinc-600 bg-red-600 hover:bg-red-700 text-zinc-300 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                  </>
                )}
                {!canEdit && (
                  <div className="text-zinc-400 text-sm bg-zinc-800 px-3 py-1 rounded">
                    View Only - Added by {isAdmin ? `User ${buyer.ownerId.substring(0, 8)}...` : 'another user'}
                  </div>
                )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    form="buyer-form"
                    onClick={(e) => {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }}
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 cursor-pointer"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="border-zinc-600 bg-red-600 hover:bg-red-700 text-zinc-300 cursor-pointer"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Concurrency Error Alert */}
          {concurrencyError && (
            <Alert className="mb-6 border-yellow-600 bg-yellow-600/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-yellow-400">
                This buyer has been updated by another user. Please refresh to see the latest changes.
                <Button
                  variant="link"
                  className="p-0 h-auto ml-2 text-yellow-400 underline"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Details Panel */}
            <div className="lg:col-span-2">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">
                    {isEditMode ? "Edit Buyer Details" : "Buyer Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isEditMode ? (
                    <Form {...form}>
                      <form id="buyer-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Full Name *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    placeholder="Enter full name"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Email</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="email"
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    placeholder="Enter email address"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Phone *</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    placeholder="Enter phone number"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">City *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                      <SelectValue placeholder="Select city" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                    <SelectItem value="Chandigarh" className="focus:bg-zinc-700 focus:text-white">Chandigarh</SelectItem>
                                    <SelectItem value="Mohali" className="focus:bg-zinc-700 focus:text-white">Mohali</SelectItem>
                                    <SelectItem value="Zirakpur" className="focus:bg-zinc-700 focus:text-white">Zirakpur</SelectItem>
                                    <SelectItem value="Panchkula" className="focus:bg-zinc-700 focus:text-white">Panchkula</SelectItem>
                                    <SelectItem value="Other" className="focus:bg-zinc-700 focus:text-white">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="propertyType"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Property Type *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                      <SelectValue placeholder="Select property type" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                    <SelectItem value="Apartment" className="focus:bg-zinc-700 focus:text-white">Apartment</SelectItem>
                                    <SelectItem value="Villa" className="focus:bg-zinc-700 focus:text-white">Villa</SelectItem>
                                    <SelectItem value="Plot" className="focus:bg-zinc-700 focus:text-white">Plot</SelectItem>
                                    <SelectItem value="Office" className="focus:bg-zinc-700 focus:text-white">Office</SelectItem>
                                    <SelectItem value="Retail" className="focus:bg-zinc-700 focus:text-white">Retail</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {shouldShowBHK && (
                            <FormField
                              control={form.control}
                              name="bhk"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-zinc-300">BHK *</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                        <SelectValue placeholder="Select BHK" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                      <SelectItem value="Studio" className="focus:bg-zinc-700 focus:text-white">Studio</SelectItem>
                                      <SelectItem value="1" className="focus:bg-zinc-700 focus:text-white">1 BHK</SelectItem>
                                      <SelectItem value="2" className="focus:bg-zinc-700 focus:text-white">2 BHK</SelectItem>
                                      <SelectItem value="3" className="focus:bg-zinc-700 focus:text-white">3 BHK</SelectItem>
                                      <SelectItem value="4" className="focus:bg-zinc-700 focus:text-white">4 BHK</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          )}

                          <FormField
                            control={form.control}
                            name="purpose"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Purpose *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                      <SelectValue placeholder="Select purpose" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                    <SelectItem value="Buy" className="focus:bg-zinc-700 focus:text-white">Buy</SelectItem>
                                    <SelectItem value="Rent" className="focus:bg-zinc-700 focus:text-white">Rent</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="budgetMin"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Budget Min (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    placeholder="Enter minimum budget"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="budgetMax"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Budget Max (₹)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    className="bg-zinc-700 border-zinc-600 text-white"
                                    placeholder="Enter maximum budget"
                                    onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="timeline"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Timeline *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                      <SelectValue placeholder="Select timeline" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                    <SelectItem value="0-3m" className="focus:bg-zinc-700 focus:text-white">0-3 months</SelectItem>
                                    <SelectItem value="3-6m" className="focus:bg-zinc-700 focus:text-white">3-6 months</SelectItem>
                                    <SelectItem value=">6m" className="focus:bg-zinc-700 focus:text-white">&gt;6 months</SelectItem>
                                    <SelectItem value="Exploring" className="focus:bg-zinc-700 focus:text-white">Exploring</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="source"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-zinc-300">Source *</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                                      <SelectValue placeholder="Select source" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent className="bg-zinc-800 border-zinc-700  text-white">
                                    <SelectItem value="Website" className="focus:bg-zinc-700 focus:text-white">Website</SelectItem>
                                    <SelectItem value="Referral" className="focus:bg-zinc-700 focus:text-white">Referral</SelectItem>
                                    <SelectItem value="Walk-in" className="focus:bg-zinc-700 focus:text-white">Walk-in</SelectItem>
                                    <SelectItem value="Call" className="focus:bg-zinc-700 focus:text-white">Call</SelectItem>
                                    <SelectItem value="Other" className="focus:bg-zinc-700 focus:text-white">Other</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-300">Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="bg-zinc-700 border-zinc-600 text-white"
                                  placeholder="Enter any additional notes..."
                                  rows={4}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Tags Section */}
                        <div>
                          <Label className="text-zinc-300 text-sm font-medium">Tags</Label>
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {tags.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="bg-purple-600/20 text-purple-400 border-purple-600/50"
                                >
                                  {tag}
                                  <button
                                    type="button"
                                    onClick={() => removeTag(tag)}
                                    className="ml-2 hover:text-purple-300"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <div className="flex gap-2 relative">
                              <div className="flex-1 relative">
                                <Input
                                  value={tagInput}
                                  onChange={handleTagInputChange}
                                  onKeyPress={handleTagKeyPress}
                                  onFocus={() => setShowTagSuggestions(tagInput.length > 0)}
                                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)}
                                  placeholder="Add a tag..."
                                  className="bg-zinc-700 border-zinc-600 text-white"
                                />
                                {showTagSuggestions && suggestedTags.length > 0 && (
                                  <div className="absolute top-full left-0 right-0 bg-zinc-800 border border-zinc-600 rounded-md mt-1 z-10 max-h-40 overflow-y-auto">
                                    {suggestedTags.map((tag) => (
                                      <button
                                        key={tag}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 focus:bg-zinc-700 focus:outline-none"
                                        onMouseDown={() => addTag(tag)}
                                      >
                                        {tag}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <Button
                                type="button"
                                onClick={() => addTag()}
                                className="bg-purple-500 cursor-pointer text-zinc-300"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* File Upload Section */}
                        <FormField
                          control={form.control}
                          name="attachmentUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FileUpload
                                value={field.value}
                                onUpload={(url) => field.onChange(url)}
                                onRemove={() => field.onChange("")}
                                disabled={isSubmitting}
                                maxSize={10}
                              />
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </form>
                    </Form>
                  ) : (
                    /* View Mode */
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label className="text-zinc-400 text-sm">Email</Label>
                          <p className="text-white font-medium mt-1">
                            {buyer.email || "Not provided"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Phone</Label>
                          <p className="text-white font-medium mt-1">{buyer.phone}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">City</Label>
                          <p className="text-white font-medium mt-1">{buyer.city}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Property Type</Label>
                          <p className="text-white font-medium mt-1">{buyer.propertyType}</p>
                        </div>
                        {buyer.bhk && (
                          <div>
                            <Label className="text-zinc-400 text-sm">BHK</Label>
                            <p className="text-white font-medium mt-1">{buyer.bhk}</p>
                          </div>
                        )}
                        <div>
                          <Label className="text-zinc-400 text-sm">Purpose</Label>
                          <p className="text-white font-medium mt-1">{buyer.purpose}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Budget</Label>
                          <p className="text-white font-medium mt-1">
                            {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Timeline</Label>
                          <p className="text-white font-medium mt-1">{buyer.timeline}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Source</Label>
                          <p className="text-white font-medium mt-1">{buyer.source}</p>
                        </div>
                        <div>
                          <Label className="text-zinc-400 text-sm">Created</Label>
                          <p className="text-white font-medium mt-1">
                            {formatDate(buyer.createdAt)}
                          </p>
                        </div>
                      </div>
                      
                      {buyer.notes && (
                        <div>
                          <Label className="text-zinc-400 text-sm">Notes</Label>
                          <p className="text-white font-medium mt-1 p-3 bg-zinc-700 rounded-md">
                            {buyer.notes}
                          </p>
                        </div>
                      )}

                      {buyer.tags && buyer.tags.length > 0 && (
                        <div>
                          <Label className="text-zinc-400 text-sm">Tags</Label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {buyer.tags.map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="bg-purple-600/20 text-purple-400 border-purple-600/50"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {buyer.attachmentUrl && (
                        <div>
                          <Label className="text-zinc-400 text-sm">Attachment</Label>
                          <div className="mt-2">
                            <Button
                              size="sm"
                              onClick={() => window.open(buyer.attachmentUrl, '_blank')}
                              className="bg-purple-500 text-black hover:bg-zinc-700 hover:text-white cursor-pointer"
                            >
                              <FileIcon className="h-4 w-4 mr-2" />
                              View Document
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status & Actions Panel */}
            <div className="space-y-6">
              <Card className="bg-zinc-800 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Quick Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-zinc-400 text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline" className={getStatusColor(buyer.status)}>
                        {buyer.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-sm">Last Updated</Label>
                    <p className="text-white font-medium mt-1 text-sm">
                      {formatDate(buyer.updatedAt)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-zinc-400 text-sm">Buyer ID</Label>
                    <p className="text-white font-medium mt-1 text-sm font-mono">
                      {buyer.id}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="bg-zinc-800 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Buyer</DialogTitle>
            <DialogDescription className="text-zinc-300">
              Are you sure you want to delete this buyer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isSubmitting}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              Cancel
            </Button>
            <Button
              onClick={onDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerDetailPage;