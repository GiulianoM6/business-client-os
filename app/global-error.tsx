"use client";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "Arial, sans-serif",
          background: "#f7f8f5",
          color: "#23312b",
        }}
      >
        <main style={{ maxWidth: 480, margin: "20vh auto", padding: 24 }}>
          <h1>Let’s try that again.</h1>
          <p>The workspace could not load. Please retry in a moment.</p>
          <button
            onClick={reset}
            style={{ padding: "12px 20px", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
