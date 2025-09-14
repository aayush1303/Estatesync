import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Plus, Search, FileX, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'no-data' | 'no-results' | 'error' | 'loading';
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className = ''
}) => {
  // Default configurations for different types
  const getDefaults = () => {
    switch (type) {
      case 'no-results':
        return {
          title: title || 'No results found',
          description: description || 'Try adjusting your search filters to find what you\'re looking for.',
          icon: icon || <Search className="h-12 w-12 text-zinc-500" />,
          actionLabel: actionLabel || 'Clear Filters'
        };
      
      case 'error':
        return {
          title: title || 'Something went wrong',
          description: description || 'We encountered an error while loading your data. Please try again.',
          icon: icon || <AlertCircle className="h-12 w-12 text-red-500" />,
          actionLabel: actionLabel || 'Retry'
        };
      
      case 'loading':
        return {
          title: title || 'Loading...',
          description: description || 'Please wait while we fetch your data.',
          icon: icon || <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>,
          actionLabel: null
        };
      
      default: // no-data
        return {
          title: title || 'No buyers yet',
          description: description || 'Get started by adding your first buyer to the CRM system.',
          icon: icon || <Users className="h-12 w-12 text-zinc-500" />,
          actionLabel: actionLabel || 'Add First Buyer'
        };
    }
  };

  const defaults = getDefaults();

  return (
    <Card className={`bg-zinc-800 border-zinc-700 ${className}`}>
      <CardContent className="p-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            {defaults.icon}
          </div>
          
          <h3 className="text-lg font-semibold text-white mb-2">
            {defaults.title}
          </h3>
          
          <p className="text-zinc-400 mb-6 max-w-md mx-auto">
            {defaults.description}
          </p>

          {defaults.actionLabel && onAction && (
            <Button
              onClick={onAction}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {type === 'no-data' && <Plus className="h-4 w-4 mr-2" />}
              {type === 'error' && <AlertCircle className="h-4 w-4 mr-2" />}
              {type === 'no-results' && <Search className="h-4 w-4 mr-2" />}
              {defaults.actionLabel}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Specific empty state components for common use cases
export const BuyersEmptyState: React.FC<{ onAddBuyer?: () => void }> = ({ onAddBuyer }) => (
  <EmptyState
    type="no-data"
    title="No buyers in your CRM"
    description="Start building your client base by adding buyer information. Track leads, manage follow-ups, and convert prospects into customers."
    actionLabel="Add Your First Buyer"
    onAction={onAddBuyer}
    icon={<Users className="h-12 w-12 text-zinc-500" />}
  />
);

export const SearchEmptyState: React.FC<{ onClearFilters?: () => void }> = ({ onClearFilters }) => (
  <EmptyState
    type="no-results"
    title="No buyers match your search"
    description="Try adjusting your search terms or filters. You can search by name, phone, email, or use the filter options to narrow down results."
    actionLabel="Clear All Filters"
    onAction={onClearFilters}
    icon={<Search className="h-12 w-12 text-zinc-500" />}
  />
);

export const ErrorEmptyState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    type="error"
    title="Failed to load buyers"
    description="We couldn't fetch your buyer data. This might be a temporary issue with your connection or our servers."
    actionLabel="Try Again"
    onAction={onRetry}
    icon={<AlertCircle className="h-12 w-12 text-red-500" />}
  />
);

export const LoadingEmptyState: React.FC = () => (
  <EmptyState
    type="loading"
    title="Loading your buyers..."
    description="Please wait while we fetch your data from the server."
    icon={<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>}
  />
);

export default EmptyState;