import React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { FadeIn } from '@/components/ui/animations';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center py-24 px-6 sm:px-12 font-sans">
      <FadeIn className="w-full max-w-3xl">
        <Card>
          <CardContent className="p-8 md:p-12">
            <h1 className="text-4xl font-display font-bold text-zinc-900 dark:text-white mb-8 tracking-tight">Privacy Policy</h1>
            
            <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="space-y-8 text-zinc-600 dark:text-zinc-300">
              <section>
                <h2 className="text-xl font-display font-semibold text-zinc-900 dark:text-white mb-4">1. Information We Collect</h2>
                <p className="leading-relaxed">
                  When you use Founder OS, we collect personal information you provide to us, such as your name, email address, and authentication credentials. We may also collect data about your usage of the platform to improve our services.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-display font-semibold text-zinc-900 dark:text-white mb-4">2. How We Use Your Information</h2>
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
                <h2 className="text-xl font-display font-semibold text-zinc-900 dark:text-white mb-4">3. Data Security and GDPR Compliance</h2>
                <p className="leading-relaxed">
                  We take data security seriously. We implement strict security measures (such as Row-Level Security in our databases) to protect your personal information. We do not sell your personal data. If you are an EU resident, you have the right to access, rectify, or erase your personal data under the General Data Protection Regulation (GDPR).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-display font-semibold text-zinc-900 dark:text-white mb-4">4. Contact Us</h2>
                <p className="leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@founderos.io" className="text-zinc-900 dark:text-white font-medium hover:underline">privacy@founderos.io</a>.
                </p>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-zinc-200 dark:border-zinc-800">
              <Link href="/" className="text-zinc-900 dark:text-white hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors duration-200 font-medium">
                &larr; Back to Home
              </Link>
            </div>
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  );
}
