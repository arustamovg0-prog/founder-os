"use client";

import React from 'react';

export default function SentryExamplePage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: '20px' }}>
      <h1>Sentry Test Error Page</h1>
      <p>Click the button below to trigger a sample error and verify your Sentry setup.</p>
      <button 
        style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer', backgroundColor: '#e00000', color: 'white', border: 'none', borderRadius: '5px' }}
        onClick={() => {
          // @ts-expect-error - testing sentry
          myUndefinedFunction();
        }}
      >
        Throw Error
      </button>
    </div>
  );
}
