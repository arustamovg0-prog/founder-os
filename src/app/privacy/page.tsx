import React from 'react';
import Link from 'next/link';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-neutral-300 py-24 px-6 sm:px-12">
      <div className="max-w-3xl mx-auto bg-[#111] border border-[#222] p-8 md:p-12 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold text-white mb-8 tracking-tight">Privacy Policy</h1>
        
        <p className="mb-6 text-sm text-neutral-500">Last updated: {new Date().toLocaleDateString()}</p>
        
        <div className="space-y-8 text-neutral-400">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed">
              When you use Founder OS, we collect personal information you provide to us, such as your name, email address, and authentication credentials. We may also collect data about your usage of the platform to improve our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">2. How We Use Your Information</h2>
            <p className="leading-relaxed">
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-2">
              <li>Provide, operate, and maintain our platform</li>
              <li>Improve, personalize, and expand our services</li>
              <li>Understand and analyze how you use our platform</li>
              <li>Communicate with you, either directly or through one of our partners</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">3. Data Security and GDPR Compliance</h2>
            <p className="leading-relaxed">
              We take data security seriously. We implement strict security measures (such as Row-Level Security in our databases) to protect your personal information. We do not sell your personal data. If you are an EU resident, you have the right to access, rectify, or erase your personal data under the General Data Protection Regulation (GDPR).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">4. Contact Us</h2>
            <p className="leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@founderos.io" className="text-[#00F0FF] hover:underline">privacy@founderos.io</a>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-[#333]">
          <Link href="/" className="text-[#00F0FF] hover:text-white transition-colors duration-200 font-medium">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
