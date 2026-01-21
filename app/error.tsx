'use client';

import React from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="min-h-screen container py-10 text-gray-200">
      <h1 className="text-2xl font-semibold">OpenStock failed to load</h1>
      <p className="mt-2 text-gray-400">
        This usually happens when required environment variables or MongoDB are not configured.
      </p>

      <div className="mt-6 rounded-md border border-gray-800 bg-black/40 p-4">
        <div className="text-sm text-gray-400">Error</div>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-200">{error.message}</pre>
        {error.digest ? (
          <div className="mt-2 text-xs text-gray-500">digest: {error.digest}</div>
        ) : null}
      </div>

      <div className="mt-6 space-y-2 text-sm text-gray-300">
        <div>Checklist:</div>
        <ul className="list-disc pl-6 text-gray-400">
          <li>Open the site using HTTP: http://localhost:3000 (not https)</li>
          <li>Copy .env.example to .env and set MONGODB_URI, BETTER_AUTH_SECRET, BETTER_AUTH_URL</li>
          <li>Make sure MongoDB is running and reachable by MONGODB_URI</li>
        </ul>
      </div>

      <button
        type="button"
        className="mt-6 rounded-md bg-yellow-500 px-4 py-2 font-medium text-black hover:bg-yellow-400"
        onClick={() => reset()}
      >
        Try again
      </button>
    </main>
  );
}

