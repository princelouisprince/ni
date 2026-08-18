import { useEffect, useState } from 'react';

function ConfigCheck() {
  const [config, setConfig] = useState({
    hasSupabaseUrl: false,
    hasSupabaseKey: false,
  });

  useEffect(() => {
    setConfig({
      hasSupabaseUrl: !!import.meta.env.VITE_SUPABASE_URL,
      hasSupabaseKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    });
  }, []);

  const isConfigured = config.hasSupabaseUrl && config.hasSupabaseKey;

  if (isConfigured) {
    return null; // Let the normal app render
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="bg-wood-100 rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-10 h-10 text-wood-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-stone-900 mb-2">NESTIA RW</h1>
          <p className="text-stone-600">Workshop Management System</p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="font-semibold text-yellow-800 mb-2">⚠️ Configuration Required</h2>
          <p className="text-yellow-700 text-sm">
            To use this application, you need to configure your Supabase credentials.
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
            <span className="text-sm font-medium text-stone-700">Supabase URL</span>
            <span className={`text-sm font-medium ${config.hasSupabaseUrl ? 'text-green-600' : 'text-red-600'}`}>
              {config.hasSupabaseUrl ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-lg">
            <span className="text-sm font-medium text-stone-700">Supabase Anon Key</span>
            <span className={`text-sm font-medium ${config.hasSupabaseKey ? 'text-green-600' : 'text-red-600'}`}>
              {config.hasSupabaseKey ? '✓ Configured' : '✗ Missing'}
            </span>
          </div>
        </div>

        <div className="bg-stone-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-stone-900 mb-2">Setup Instructions:</h3>
          <ol className="text-sm text-stone-700 space-y-2 list-decimal list-inside">
            <li>Create a <code className="bg-stone-200 px-1 rounded">.env</code> file in the project root</li>
            <li>Copy contents from <code className="bg-stone-200 px-1 rounded">.env.example</code></li>
            <li>Add your Supabase project URL and anon key</li>
            <li>Restart the development server</li>
          </ol>
        </div>

        <div className="text-center">
          <button
            onClick={() => window.location.reload()}
            className="btn-primary"
          >
            Reload After Configuration
          </button>
        </div>

        <p className="text-xs text-stone-500 text-center mt-4">
          Refer to SETUP.md for detailed database configuration instructions
        </p>
      </div>
    </div>
  );
}

export default ConfigCheck;
