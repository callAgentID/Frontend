"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ background: '#0A1931', color: '#F6FAFD', margin: 0, fontFamily: 'sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h2>
          {error?.digest && (
            <p style={{ color: '#B3CFE5', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={reset}
            style={{ padding: '0.75rem 1.5rem', background: '#4A7FA7', color: '#fff', border: 'none', borderRadius: '0.75rem', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
