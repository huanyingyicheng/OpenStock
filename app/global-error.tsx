'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        <main className="min-h-screen container py-10 text-gray-200">
          <h1 className="text-2xl font-semibold">OpenStock crashed</h1>
          <p className="mt-2 text-gray-400">
            Check your terminal logs. Common causes are missing .env values or MongoDB not running.
          </p>

          <div className="mt-6 rounded-md border border-gray-800 bg-black/40 p-4">
            <div className="text-sm text-gray-400">Error</div>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-gray-200">{error.message}</pre>
            {error.digest ? (
              <div className="mt-2 text-xs text-gray-500">digest: {error.digest}</div>
            ) : null}
          </div>

          <button
            type="button"
            className="mt-6 rounded-md bg-yellow-500 px-4 py-2 font-medium text-black hover:bg-yellow-400"
            onClick={() => reset()}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}

