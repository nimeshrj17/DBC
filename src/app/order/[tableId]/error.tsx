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
      <div className="w-full bg-stone-100 p-4 border border-red-300">
        <p className="font-bold text-red-700 text-lg mb-2">ERROR MESSAGE:</p>
        <p className="font-mono text-md text-stone-900 break-words font-bold">{error.message || 'No error message available'}</p>
        {error.digest && <p className="mt-2 text-xs">Digest: {error.digest}</p>}
      </div>
      <button
        className="mt-6 px-6 py-2 bg-stone-800 text-white rounded-lg shadow"
        onClick={() => reset()}
      >
        Try again
      </button>
    </div>
  );
}
