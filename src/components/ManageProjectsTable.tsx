"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useIsAdmin } from "../hooks/useIsAdmin";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { BuyersEmptyState, SearchEmptyState, ErrorEmptyState } from "./EmptyState";

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
  status:
    | "New"
    | "Qualified"
    | "Contacted"
    | "Visited"
    | "Negotiation"
    | "Converted"
    | "Dropped";
  notes?: string;
  tags?: string[];
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskCounts {
  new: number;
  qualified: number;
  contacted: number;
  visited: number;
  negotiation: number;
  converted: number;
  dropped: number;
}

interface BuyersApiResponse {
  buyers: Buyer[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface ManageBuyersTableProps {
  taskCounts?: TaskCounts;
  initialData?: BuyersApiResponse | null;
  searchParams?: {
    page?: string;
    search?: string;
    city?: string;
    status?: string;
    propertyType?: string;
  };
}

// Custom debounce hook
const useDebounceHook = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Helper function to generate initials
const getInitials = (fullName: string) => {
  return fullName
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
};

// Helper function to calculate task counts from buyers data
const calculateTaskCounts = (buyers: Buyer[]): TaskCounts => {
  return buyers.reduce((counts, buyer) => {
    const status = buyer.status.toLowerCase() as keyof TaskCounts;
    if (status in counts) {
      counts[status]++;
    }
    return counts;
  }, {
    new: 0,
    qualified: 0,
    contacted: 0,
    visited: 0,
    negotiation: 0,
    converted: 0,
    dropped: 0,
  });
};

export default function ManageBuyersTable({
  taskCounts,
  initialData,
  searchParams: initialSearchParams,
}: ManageBuyersTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { user } = useUser();

  // State for buyers data (initialize with SSR data if available)
  const [buyers, setBuyers] = useState<Buyer[]>(initialData?.buyers || []);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState(
    initialData?.pagination || {
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      limit: 10,
      hasNextPage: false,
      hasPreviousPage: false,
    }
  );

  // State for filters and search (initialize with SSR params or URL params)
  const [searchTerm, setSearchTerm] = useState(
    initialSearchParams?.search || searchParams.get("search") || ""
  );
  const [actualSearchTerm, setActualSearchTerm] = useState(
    initialSearchParams?.search || searchParams.get("search") || ""
  );
  const [cityFilter, setCityFilter] = useState(
    initialSearchParams?.city || searchParams.get("city") || "all"
  );
  const [propertyTypeFilter, setPropertyTypeFilter] = useState(
    initialSearchParams?.propertyType || searchParams.get("propertyType") || "all"
  );
  const [statusFilter, setStatusFilter] = useState(() => {
    const urlStatus = initialSearchParams?.status || searchParams.get("status");
    const validStatuses = ["all", "New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"];
    return urlStatus && validStatuses.includes(urlStatus) ? urlStatus : "all";
  });
  const [timelineFilter, setTimelineFilter] = useState(
    searchParams.get("timeline") || "all"
  );
  const [sortField, setSortField] = useState<keyof Buyer>("updatedAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Handle search on Enter key press
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setActualSearchTerm(searchTerm);
    }
  };

  // Handle search button click
  const handleSearchClick = () => {
    setActualSearchTerm(searchTerm);
  };

  // Clean up invalid URL parameters on mount
  useEffect(() => {
    const validStatuses = ["all", "New", "Qualified", "Contacted", "Visited", "Negotiation", "Converted", "Dropped"];
    const currentStatus = searchParams.get("status");
    
    if (currentStatus && !validStatuses.includes(currentStatus)) {
      // Invalid status parameter, clean it up
      const url = new URL(window.location.href);
      url.searchParams.delete('status');
      window.history.replaceState({}, '', url.toString());
      setStatusFilter('all');
    }
  }, []);

  // Status update function
  const handleStatusUpdate = async (buyerId: string, newStatus: string, buyerOwnerId: string) => {
    // Check permissions: admin can change all, user can only change their own
    if (!isAdmin && buyerOwnerId !== user?.id) {
      toast.error('You can only update your own buyers');
      return;
    }

    console.log('Updating status:', { buyerId, newStatus, buyerOwnerId });

    try {
      const requestBody = { status: newStatus };
      console.log('Request body:', requestBody);
      
      const response = await fetch(`/api/buyers/${buyerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error('Failed to update status');
      }

      const updatedBuyer = await response.json();
      console.log('Updated buyer:', updatedBuyer);
      
      // Update the local state
      setBuyers(prevBuyers => 
        prevBuyers.map(buyer => 
          buyer.id === buyerId ? { ...buyer, status: newStatus as any, updatedAt: updatedBuyer.updatedAt } : buyer
        )
      );

      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Status update error:', error);
    }
  };

  // Fetch buyers from API with SSR pagination
  const fetchBuyers = async (
    page: number = pagination.currentPage,
    search: string = actualSearchTerm,
    city: string = cityFilter === 'all' ? '' : cityFilter,
    status: string = statusFilter === 'all' ? '' : statusFilter,
    propertyType: string = propertyTypeFilter === 'all' ? '' : propertyTypeFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '10');
      if (search) params.set('search', search);
      if (city) params.set('city', city);
      if (status) params.set('status', status);
      if (propertyType) params.set('propertyType', propertyType);

      const res = await fetch(`/api/buyers?${params.toString()}`);
      if (!res.ok) {
        throw new Error('Failed to fetch buyers');
      }
      const data = await res.json();
      setBuyers(data.buyers);
      setPagination(data.pagination);

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('page', page.toString());
      if (search) url.searchParams.set('search', search);
      else url.searchParams.delete('search');
      if (city) url.searchParams.set('city', city);
      else url.searchParams.delete('city');
      if (status) url.searchParams.set('status', status);
      else url.searchParams.delete('status');
      if (propertyType) url.searchParams.set('propertyType', propertyType);
      else url.searchParams.delete('propertyType');
      
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      toast.error('Failed to load buyers');
      setError('Failed to load buyers');
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if we don't have initial data
    if (!initialData) {
      fetchBuyers();
    }
  }, []);

  // Refetch when filters change
  useEffect(() => {
    fetchBuyers(1); // Reset to page 1 when filters change
  }, [actualSearchTerm, cityFilter, statusFilter, propertyTypeFilter, timelineFilter]);

  // Calculate task counts from actual data or use provided ones
  const actualTaskCounts = useMemo(() => {
    return taskCounts || calculateTaskCounts(buyers);
  }, [taskCounts, buyers]);

  // Sort logic (filtering is now done server-side)
  const processedBuyers = useMemo(() => {
    // Since filtering is done server-side, we only need to sort client-side
    const sorted = [...buyers];
    
    sorted.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortDirection === "asc" ? -1 : 1;
      if (bValue === undefined) return sortDirection === "asc" ? 1 : -1;

      // Handle different types
      if (typeof aValue === "string" && typeof bValue === "string") {
        const compareResult = aValue.localeCompare(bValue);
        return sortDirection === "asc" ? compareResult : -compareResult;
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        const compareResult = aValue - bValue;
        return sortDirection === "asc" ? compareResult : -compareResult;
      }

      // For dates (updatedAt)
      if (sortField === "updatedAt") {
        const dateA = new Date(aValue as string).getTime();
        const dateB = new Date(bValue as string).getTime();
        const compareResult = dateA - dateB;
        return sortDirection === "asc" ? compareResult : -compareResult;
      }

      // Fallback: convert to string and compare
      const stringA = String(aValue);
      const stringB = String(bValue);
      const compareResult = stringA.localeCompare(stringB);
      return sortDirection === "asc" ? compareResult : -compareResult;
    });

    return sorted;
  }, [buyers, sortField, sortDirection]);

  // No client-side pagination needed - data is already paginated server-side
  const paginatedBuyers = processedBuyers;

  // Format budget range
  const formatBudget = (min?: number, max?: number) => {
    if (!min && !max) return "Not specified";
    if (!max) return `₹${(min! / 100000).toFixed(1)}L+`;
    if (!min) return `Up to ₹${(max / 100000).toFixed(1)}L`;
    return `₹${(min / 100000).toFixed(1)}L - ₹${(max / 100000).toFixed(1)}L`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Handle sort
  const handleSort = (field: keyof Buyer) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Navigation handlers
  const handleViewBuyer = (buyerId: string) => {
    router.push(`/buyers/${buyerId}`);
  };

  const handleEditBuyer = (buyerId: string) => {
    router.push(`/buyers/${buyerId}/edit`);
  };

  // Loading state
  if (loading) {
    return (
      <Card className="bg-zinc-800 border-zinc-700">
        <CardContent className="p-8">
          <div className="text-center text-zinc-300">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            Loading buyers...
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return <ErrorEmptyState onRetry={() => fetchBuyers()} />;
  }

  // No buyers at all (check total count, not current page)
  if (pagination.totalCount === 0 && !actualSearchTerm && cityFilter === 'all' && statusFilter === 'all' && propertyTypeFilter === 'all') {
    return <BuyersEmptyState onAddBuyer={() => router.push('/buyers/new')} />;
  }

  // No results after filtering (has filters but no results)
  if (pagination.totalCount === 0 && (actualSearchTerm || cityFilter !== 'all' || statusFilter !== 'all' || propertyTypeFilter !== 'all')) {
    return <SearchEmptyState onClearFilters={() => {
      setSearchTerm('');
      setActualSearchTerm('');
      setCityFilter('all');
      setPropertyTypeFilter('all');
      setStatusFilter('all');
      setTimelineFilter('all');
      // Reset URL params and fetch page 1
      const newSearchParams = new URLSearchParams();
      router.push(`${pathname}?${newSearchParams.toString()}`);
      fetchBuyers(1, '', '', '', '');
    }} />;
  }

  return (
    <Card className="bg-zinc-800 border-zinc-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-white">
            Manage Buyers ({pagination.totalCount} leads)
          </CardTitle>
          <div className="flex items-center space-x-2">
            {/* SSR Pagination Controls */}
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-600  text-zinc-300 bg-purple-500 hover:bg-zinc-700 hover:text-purple-500 cursor-pointer"
              onClick={() => fetchBuyers(pagination.currentPage - 1)}
              disabled={!pagination.hasPreviousPage || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-zinc-400">
              {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-zinc-600 text-zinc-300 bg-purple-500 hover:bg-zinc-700 hover:text-purple-500 cursor-pointer"
              onClick={() => fetchBuyers(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Status Counts */}
        <div className="flex items-center space-x-2 mt-4 flex-wrap">
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
            New: {actualTaskCounts.new}
          </Badge>
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
            Qualified: {actualTaskCounts.qualified}
          </Badge>
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
            Contacted: {actualTaskCounts.contacted}
          </Badge>
          <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
            Visited: {actualTaskCounts.visited}
          </Badge>
          <Badge
            variant="secondary"
            className="bg-purple-600/20 text-purple-400"
          >
            Converted: {actualTaskCounts.converted}
          </Badge>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4 relative">
          <div className="relative">
            <Input
              placeholder="Search by name, phone, email... (Press Enter)"
              className="bg-zinc-700 text-zinc-300 border-zinc-600 placeholder-zinc-500 pr-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <Button
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 text-zinc-400 hover:text-zinc-200"
              onClick={handleSearchClick}
              type="button"
            >
              🔍
            </Button>
          </div>

          <Select value={cityFilter || "all"} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-zinc-700 text-zinc-300 border-zinc-600">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
              <SelectItem value="all">All Cities</SelectItem>
              <SelectItem value="Chandigarh">Chandigarh</SelectItem>
              <SelectItem value="Mohali">Mohali</SelectItem>
              <SelectItem value="Zirakpur">Zirakpur</SelectItem>
              <SelectItem value="Panchkula">Panchkula</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={propertyTypeFilter || "all"}
            onValueChange={setPropertyTypeFilter}
          >
            <SelectTrigger className="bg-zinc-700 text-zinc-300 border-zinc-600">
              <SelectValue placeholder="Property Type" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Plot">Plot</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
              <SelectItem value="Retail">Retail</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter || "all"} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-zinc-700 text-zinc-300 border-zinc-600">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Qualified">Qualified</SelectItem>
              <SelectItem value="Contacted">Contacted</SelectItem>
              <SelectItem value="Visited">Visited</SelectItem>
              <SelectItem value="Negotiation">Negotiation</SelectItem>
              <SelectItem value="Converted">Converted</SelectItem>
              <SelectItem value="Dropped">Dropped</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timelineFilter || "all"} onValueChange={setTimelineFilter}>
            <SelectTrigger className="bg-zinc-700 text-zinc-300 border-zinc-600">
              <SelectValue placeholder="Timeline" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
              <SelectItem value="all">All Timelines</SelectItem>
              <SelectItem value="0-3m">0-3 months</SelectItem>
              <SelectItem value="3-6m">3-6 months</SelectItem>
              <SelectItem value=">6m">&gt;6 months</SelectItem>
              <SelectItem value="Exploring">Exploring</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-700 hover:bg-transparent">
              <TableHead className="text-zinc-400">
                <div className="flex items-center">
                  <span>Name</span>
                  <button
                    className="ml-2 p-1 rounded cursor-pointer group"
                    onClick={() => handleSort("fullName")}
                  >
                    <ArrowUpDown className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </TableHead>
              <TableHead className="text-zinc-400">Phone</TableHead>
              <TableHead className="text-zinc-400">
                <div className="flex items-center">
                  <span>City</span>
                  <button
                    className="ml-2 p-1 rounded cursor-pointer group"
                    onClick={() => handleSort("city")}
                  >
                    <ArrowUpDown className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </TableHead>
              <TableHead className="text-zinc-400">Property Type</TableHead>
              <TableHead className="text-zinc-400">Budget</TableHead>
              <TableHead className="text-zinc-400">Timeline</TableHead>
              <TableHead className="text-zinc-400">Tags</TableHead>
              <TableHead className="text-zinc-400">Status</TableHead>
              {isAdmin && <TableHead className="text-zinc-400">Owner</TableHead>}
              <TableHead className="text-zinc-400">
                <div className="flex items-center">
                  <span>Updated</span>
                  <button
                    className="ml-2 p-1 rounded cursor-pointer group"
                    onClick={() => handleSort("updatedAt")}
                  >
                    <ArrowUpDown className="h-4 w-4 text-zinc-400 group-hover:text-white transition-colors" />
                  </button>
                </div>
              </TableHead>
              <TableHead className="text-zinc-400">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBuyers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={isAdmin ? 11 : 10}
                  className="text-center text-zinc-500 py-8"
                >
                  No buyers found matching your criteria
                </TableCell>
              </TableRow>
            ) : (
              paginatedBuyers.map((buyer) => (
                <TableRow
                  key={buyer.id}
                  className="border-zinc-700 hover:bg-zinc-750 cursor-pointer"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-purple-600 text-white text-xs">
                          {getInitials(buyer.fullName)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <span className="text-white block">
                          {buyer.fullName}
                        </span>
                        {buyer.email && (
                          <span className="text-zinc-400 text-xs">
                            {buyer.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-300">{buyer.phone}</TableCell>
                  <TableCell className="text-zinc-300">{buyer.city}</TableCell>
                  <TableCell className="text-zinc-300">
                    {buyer.propertyType}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {formatBudget(buyer.budgetMin, buyer.budgetMax)}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    {buyer.timeline}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    <div className="flex flex-wrap gap-1 max-w-32">
                      {buyer.tags && buyer.tags.length > 0 ? (
                        buyer.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-purple-600/20 text-purple-400 border-purple-600/50 text-xs px-1 py-0 h-5"
                          >
                            {tag}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-zinc-500 text-xs">No tags</span>
                      )}
                      {buyer.tags && buyer.tags.length > 2 && (
                        <Badge
                          variant="secondary"
                          className="bg-zinc-600/20 text-zinc-400 border-zinc-600/50 text-xs px-1 py-0 h-5"
                        >
                          +{buyer.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(isAdmin || buyer.ownerId === user?.id) ? (
                      <Select
                        value={buyer.status}
                        onValueChange={(newStatus) => handleStatusUpdate(buyer.id, newStatus, buyer.ownerId)}
                      >
                        <SelectTrigger className={`w-32 border-0 bg-transparent focus:ring-0 focus:ring-offset-0 text-xs font-medium ${
                          buyer.status === "New"
                            ? "text-blue-400"
                            : buyer.status === "Qualified"
                            ? "text-yellow-400"
                            : buyer.status === "Contacted"
                            ? "text-orange-400"
                            : buyer.status === "Visited"
                            ? "text-purple-400"
                            : buyer.status === "Negotiation"
                            ? "text-indigo-400"
                            : buyer.status === "Converted"
                            ? "text-green-400"
                            : "text-red-400"
                        }`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
                          <SelectItem value="New" className="focus:bg-zinc-700 focus:text-blue-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
                              New
                            </div>
                          </SelectItem>
                          <SelectItem value="Qualified" className="focus:bg-zinc-700 focus:text-yellow-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-yellow-400 mr-2"></div>
                              Qualified
                            </div>
                          </SelectItem>
                          <SelectItem value="Contacted" className="focus:bg-zinc-700 focus:text-orange-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
                              Contacted
                            </div>
                          </SelectItem>
                          <SelectItem value="Visited" className="focus:bg-zinc-700 focus:text-purple-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-purple-400 mr-2"></div>
                              Visited
                            </div>
                          </SelectItem>
                          <SelectItem value="Negotiation" className="focus:bg-zinc-700 focus:text-indigo-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-indigo-400 mr-2"></div>
                              Negotiation
                            </div>
                          </SelectItem>
                          <SelectItem value="Converted" className="focus:bg-zinc-700 focus:text-green-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-green-400 mr-2"></div>
                              Converted
                            </div>
                          </SelectItem>
                          <SelectItem value="Dropped" className="focus:bg-zinc-700 focus:text-red-400">
                            <div className="flex items-center">
                              <div className="w-2 h-2 rounded-full bg-red-400 mr-2"></div>
                              Dropped
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={
                          buyer.status === "New" || buyer.status === "Qualified"
                            ? "secondary"
                            : buyer.status === "Converted"
                            ? "default"
                            : buyer.status === "Dropped"
                            ? "destructive"
                            : "outline"
                        }
                        className={
                          buyer.status === "New"
                            ? "bg-blue-600/20 text-blue-400 border-blue-600/50"
                            : buyer.status === "Qualified"
                            ? "bg-yellow-600/20 text-yellow-400 border-yellow-600/50"
                            : buyer.status === "Contacted"
                            ? "bg-orange-600/20 text-orange-400 border-orange-600/50"
                            : buyer.status === "Visited"
                            ? "bg-purple-600/20 text-purple-400 border-purple-600/50"
                            : buyer.status === "Negotiation"
                            ? "bg-indigo-600/20 text-indigo-400 border-indigo-600/50"
                            : buyer.status === "Converted"
                            ? "bg-green-600/20 text-green-400 border-green-600/50"
                            : "bg-red-600/20 text-red-400 border-red-600/50"
                        }
                      >
                        {buyer.status}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-zinc-300 text-sm">
                      {buyer.ownerId.substring(0, 8)}...
                    </TableCell>
                  )}
                  <TableCell className="text-zinc-300 text-sm">
                    {formatDate(buyer.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-zinc-700 cursor-pointer"
                        onClick={() => handleViewBuyer(buyer.id)}
                      >
                        <Eye className="h-4 w-4 text-zinc-400" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
