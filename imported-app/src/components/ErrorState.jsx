import { AlertCircle, RefreshCw } from 'lucide-react';

function ErrorState({ 
  title = 'Something went wrong', 
  description = 'An error occurred while loading the data. Please try again.',
  onRetry = null 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="bg-red-100 rounded-full p-6 mb-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-stone-900 mb-2">{title}</h3>
      <p className="text-stone-500 max-w-sm mb-6">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="btn-primary flex items-center"
        >
          <RefreshCw className="h-5 w-5 mr-2" />
          Try Again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
