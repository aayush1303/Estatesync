"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { buyerSchema, type BuyerFormData } from "../../../validations/buyer";
import Navbar from "../../../components/Navbar";

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "../../../components/FileUpload";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";

const NewBuyerPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const form = useForm<BuyerFormData>({
    resolver: zodResolver(buyerSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      city: undefined,
      propertyType: undefined,
      bhk: undefined,
      purpose: undefined,
      budgetMin: undefined,
      budgetMax: undefined,
      timeline: undefined,
      source: undefined,
      notes: "",
      tags: [],
      attachmentUrl: "",
    },
  });

  const propertyType = form.watch("propertyType");
  const shouldShowBHK =
    propertyType === "Apartment" || propertyType === "Villa";

  // Handle tag operations
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()];
      setTags(newTags);
      form.setValue("tags", newTags);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter((tag) => tag !== tagToRemove);
    setTags(newTags);
    form.setValue("tags", newTags);
  };

  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

const onSubmit = async (data: BuyerFormData) => {
  setIsSubmitting(true);
  try {
    const response = await fetch('/api/buyers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error('Failed to create buyer');
    }

    const newBuyer = await response.json();
    toast.success('Buyer created successfully!');

    // Redirect to buyers list after successful creation
    router.push("/buyers");
  } catch (error) {
    toast.error('Failed to create buyer. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <div className="min-h-screen bg-zinc-900 overflow-x-hidden">
      <Navbar />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Create New Lead
            </h1>
            <p className="text-zinc-400">
              Add a new buyer lead to your pipeline
            </p>
          </div>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Buyer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-8"
                >
                  {/* Personal Information Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                      Personal Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-zinc-200 font-medium">
                              Full Name <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter full name"
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                                {...field}
                              />
                            </FormControl>
                            {/* Empty space to match other fields */}
                            <div className="h-5"></div>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-zinc-200 font-medium">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                                {...field}
                              />
                            </FormControl>
                            {/* Empty space to match other fields */}
                            <div className="h-5"></div>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-zinc-200 font-medium">
                              Phone <span className="text-red-400">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter phone number"
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-zinc-400 text-sm h-5 flex items-center">
                              10-15 digits only
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel className="text-zinc-200 font-medium">
                              City <span className="text-red-400">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl className="w-full">
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11 py-[21px]">
                                  <SelectValue
                                    placeholder="Select city"
                                    className="text-zinc-400"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                <SelectItem
                                  value="Chandigarh"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Chandigarh
                                </SelectItem>
                                <SelectItem
                                  value="Mohali"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Mohali
                                </SelectItem>
                                <SelectItem
                                  value="Zirakpur"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Zirakpur
                                </SelectItem>
                                <SelectItem
                                  value="Panchkula"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Panchkula
                                </SelectItem>
                                <SelectItem
                                  value="Other"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Other
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            {/* Empty space to match other fields */}
                            <div className="h-5"></div>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Property Information Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                      Property Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <FormField
                        control={form.control}
                        name="propertyType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Property Type{" "}
                              <span className="text-red-400">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11">
                                  <SelectValue
                                    placeholder="Select property type"
                                    className="text-zinc-400"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                <SelectItem
                                  value="Apartment"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Apartment
                                </SelectItem>
                                <SelectItem
                                  value="Villa"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Villa
                                </SelectItem>
                                <SelectItem
                                  value="Plot"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Plot
                                </SelectItem>
                                <SelectItem
                                  value="Office"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Office
                                </SelectItem>
                                <SelectItem
                                  value="Retail"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Retail
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      {shouldShowBHK && (
                        <FormField
                          control={form.control}
                          name="bhk"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-zinc-200 font-medium">
                                BHK <span className="text-red-400">*</span>
                              </FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11">
                                    <SelectValue
                                      placeholder="Select BHK"
                                      className="text-zinc-400"
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                  <SelectItem
                                    value="Studio"
                                    className="focus:bg-zinc-700 focus:text-white"
                                  >
                                    Studio
                                  </SelectItem>
                                  <SelectItem
                                    value="1"
                                    className="focus:bg-zinc-700 focus:text-white"
                                  >
                                    1 BHK
                                  </SelectItem>
                                  <SelectItem
                                    value="2"
                                    className="focus:bg-zinc-700 focus:text-white"
                                  >
                                    2 BHK
                                  </SelectItem>
                                  <SelectItem
                                    value="3"
                                    className="focus:bg-zinc-700 focus:text-white"
                                  >
                                    3 BHK
                                  </SelectItem>
                                  <SelectItem
                                    value="4"
                                    className="focus:bg-zinc-700 focus:text-white"
                                  >
                                    4 BHK
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage className="text-red-400" />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={form.control}
                        name="purpose"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Purpose <span className="text-red-400">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11">
                                  <SelectValue
                                    placeholder="Select purpose"
                                    className="text-zinc-400"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                <SelectItem
                                  value="Buy"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Buy
                                </SelectItem>
                                <SelectItem
                                  value="Rent"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Rent
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Budget Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                      Budget Range (₹)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Minimum Budget
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 5000000"
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-zinc-400 text-sm">
                              Amount in INR (e.g., 5000000 for ₹50 lakhs)
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Maximum Budget
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="e.g., 8000000"
                                className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11"
                                value={field.value || ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? Number(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormDescription className="text-zinc-400 text-sm">
                              Amount in INR (e.g., 8000000 for ₹80 lakhs)
                            </FormDescription>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Additional Information Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="timeline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Timeline <span className="text-red-400">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11">
                                  <SelectValue
                                    placeholder="Select timeline"
                                    className="text-zinc-400"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                <SelectItem
                                  value="0-3m"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  0-3 months
                                </SelectItem>
                                <SelectItem
                                  value="3-6m"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  3-6 months
                                </SelectItem>
                                <SelectItem
                                  value=">6m"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  More than 6 months
                                </SelectItem>
                                <SelectItem
                                  value="Exploring"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Just exploring
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="source"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-zinc-200 font-medium">
                              Source <span className="text-red-400">*</span>
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="bg-zinc-800 border-zinc-600 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11">
                                  <SelectValue
                                    placeholder="Select source"
                                    className="text-zinc-400"
                                  />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-zinc-800 border-zinc-600 text-white">
                                <SelectItem
                                  value="Website"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Website
                                </SelectItem>
                                <SelectItem
                                  value="Referral"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Referral
                                </SelectItem>
                                <SelectItem
                                  value="Walk-in"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Walk-in
                                </SelectItem>
                                <SelectItem
                                  value="Call"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Call
                                </SelectItem>
                                <SelectItem
                                  value="Other"
                                  className="focus:bg-zinc-700 focus:text-white"
                                >
                                  Other
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-red-400" />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-white border-b border-zinc-700 pb-2">
                      Notes & Tags
                    </h3>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-zinc-200 font-medium">
                            Notes
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional notes about this lead..."
                              className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 min-h-[120px] resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-zinc-400 text-sm">
                            Maximum 1000 characters
                          </FormDescription>
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />

                    {/* Tags Section */}
                    <div className="space-y-4">
                      <Label className="text-zinc-200 font-medium">Tags</Label>

                      {/* Tag Input */}
                      <div className="flex gap-3">
                        <Input
                          placeholder="Add a tag and press Enter..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={handleTagKeyPress}
                          className="bg-zinc-800 border-zinc-600 text-white placeholder:text-zinc-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 h-11 flex-1"
                        />
                        <Button
                          type="button"
                          onClick={addTag}
                          size="default"
                          className="bg-purple-600 hover:bg-purple-700 h-11 px-4"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Display Tags */}
                      {tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-zinc-800/50 rounded-lg border border-zinc-700">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="bg-purple-600/20 text-purple-300 border-purple-600/30 hover:bg-purple-600/30 px-3 py-1"
                            >
                              {tag}
                              <Button
                                type="button"
                                onClick={() => removeTag(tag)}
                                size="sm"
                                variant="ghost"
                                className="ml-2 p-0 h-4 w-4 hover:bg-red-600/20 rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      )}
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
                          <FormMessage className="text-red-400" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Form Actions */}
                  <div className="border-t border-zinc-700 pt-6">
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/buyers")}
                        className="border-zinc-600 text-purple-600 cursor-pointer hover:bg-zinc-700 hover:text-white h-11 px-6"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-purple-600 cursor-pointer hover:bg-purple-700 disabled:opacity-50 h-11 px-8"
                      >
                        {isSubmitting ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                          </>
                        ) : (
                          "Create Lead"
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NewBuyerPage;
