import { Package, Users, Search, Inbox } from 'lucide-react';

function EmptyState({ 
  icon = Inbox, 
  title = 'No data found', 
  description = 'There are no items to display at the moment.',
  action = null 
}) {
  const Icon = icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-stone-100 rounded-full p-6 mb-4">
        <Icon className="h-12 w-12 text-stone-400" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 max-w-sm mb-6">{description}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}

export function EmptyProjects({ onNewProject }) {
  return (
    <EmptyState
      icon={Package}
      title="No projects yet"
      description="Get started by creating your first project."
      action={
        onNewProject && (
          <button
            onClick={onNewProject}
            className="btn-primary"
          >
            Create New Project
          </button>
        )
      }
    />
  );
}

export function EmptyCustomers({ onNewCustomer }) {
  return (
    <EmptyState
      icon={Users}
      title="No customers yet"
      description="Add your first customer to get started."
      action={
        onNewCustomer && (
          <button
            onClick={onNewCustomer}
            className="btn-primary"
          >
            Add New Customer
          </button>
        )
      }
    />
  );
}

export function EmptySearchResults({ searchTerm }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`No items match "${searchTerm}". Try a different search term.`}
    />
  );
}

export default EmptyState;
