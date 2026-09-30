'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-white p-6 flex flex-col items-center justify-center">
      <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong!</h2>
      <div className="w-full max-w-md bg-stone-100 p-4 rounded-lg overflow-auto mb-4 border border-stone-300">
        <p className="font-mono text-sm text-stone-800 break-words">{error.message}</p>
        {error.stack && (
          <pre className="mt-4 text-xs text-stone-600 whitespace-pre-wrap">{error.stack}</pre>
        )}
      </div>
      <button
        className="px-6 py-2 bg-stone-800 text-white rounded-lg shadow"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
