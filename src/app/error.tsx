"use client";
export default function ErrorPage({ reset }: { reset: () => void }) { return <main id="main" className="loading-page"><h1>Let’s try that again.</h1><p>The workspace could not open. Your saved group records are still available.</p><button className="btn" onClick={reset}>Try again</button></main>; }
