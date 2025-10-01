export const metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Email Client Application'
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 mb-4">
              By accessing or using our Email Client application (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, you may not use the Service.
            </p>
            <p className="text-gray-300 mb-4">
              These Terms constitute a legally binding agreement between you and us. We reserve the right to modify these Terms at any time, and your continued use of the Service after such changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-300 mb-4">
              Our Service provides a web-based email client that allows you to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Connect and access multiple email accounts (Gmail, Outlook, etc.)</li>
              <li>Read, compose, send, and manage emails</li>
              <li>Organize emails with labels, folders, and filters</li>
              <li>Search and archive email messages</li>
              <li>Manage email attachments</li>
            </ul>
            <p className="text-gray-300 mb-4">
              The Service acts as an interface to your existing email accounts and does not provide email hosting services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration and Security</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">3.1 Account Creation</h3>
            <p className="text-gray-300 mb-4">
              To use the Service, you must:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Connect at least one email account (Gmail, Outlook, etc.) via OAuth authentication</li>
              <li>Provide accurate and complete information</li>
              <li>Maintain and update your information as necessary</li>
              <li>Be at least 13 years of age</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">3.2 Account Security</h3>
            <p className="text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Maintaining the security of your email account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access or security breach</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You may revoke our access to your email account at any time through your email provider&apos;s security settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Acceptable Use Policy</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">4.1 Permitted Use</h3>
            <p className="text-gray-300 mb-4">
              You may use the Service only for lawful purposes and in accordance with these Terms.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">4.2 Prohibited Activities</h3>
            <p className="text-gray-300 mb-4">
              You agree NOT to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Send spam, unsolicited emails, or bulk commercial messages</li>
              <li>Transmit malware, viruses, or malicious code</li>
              <li>Attempt to gain unauthorized access to our systems or other users&apos; accounts</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use automated systems (bots, scrapers) without our permission</li>
              <li>Impersonate others or provide false information</li>
              <li>Violate the terms of service of your email providers (Gmail, Outlook, etc.)</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Collect or harvest user data without consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Privacy and Data Protection</h2>
            <p className="text-gray-300 mb-4">
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>, which explains how we collect, use, and protect your data. By using the Service, you consent to our data practices as described in the Privacy Policy.
            </p>
            <p className="text-gray-300 mb-4">
              Key points:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>We access your email data only with your explicit authorization</li>
              <li>We do not sell or share your email data with third parties for marketing</li>
              <li>We comply with Gmail API User Data Policy and Microsoft Graph API requirements</li>
              <li>You can revoke access at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property Rights</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">6.1 Our Rights</h3>
            <p className="text-gray-300 mb-4">
              The Service, including its code, design, features, and content (excluding your email data), is owned by us and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or reverse engineer the Service without our permission.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">6.2 Your Rights</h3>
            <p className="text-gray-300 mb-4">
              You retain all rights to your email content and data. By using the Service, you grant us a limited license to access, store, and display your email data solely for the purpose of providing the Service to you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Third-Party Services</h2>
            <p className="text-gray-300 mb-4">
              The Service integrates with third-party email providers (Google, Microsoft, etc.). Your use of these providers is subject to their respective terms of service:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>
                <a
                  href="https://policies.google.com/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="https://www.microsoft.com/en-us/servicesagreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Microsoft Services Agreement
                </a>
              </li>
            </ul>
            <p className="text-gray-300 mb-4">
              We are not responsible for the availability, content, or practices of third-party services. Any issues with your email accounts should be directed to the respective providers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Service Availability and Modifications</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">8.1 Service Availability</h3>
            <p className="text-gray-300 mb-4">
              We strive to provide reliable and continuous service, but we do not guarantee that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>The Service will be uninterrupted or error-free</li>
              <li>Defects will be corrected immediately</li>
              <li>The Service will be available at all times</li>
            </ul>
            <p className="text-gray-300 mb-4">
              We may perform maintenance, updates, or modifications that temporarily affect availability.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">8.2 Service Modifications</h3>
            <p className="text-gray-300 mb-4">
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Modify, suspend, or discontinue any part of the Service</li>
              <li>Change features, functionality, or pricing</li>
              <li>Impose limits on certain features</li>
            </ul>
            <p className="text-gray-300 mb-4">
              We will provide reasonable notice of material changes when possible.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Termination</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">9.1 Your Right to Terminate</h3>
            <p className="text-gray-300 mb-4">
              You may stop using the Service at any time by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Disconnecting your email accounts in the app settings</li>
              <li>Revoking access through your email provider&apos;s security settings</li>
              <li>Deleting your account (if applicable)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">9.2 Our Right to Terminate</h3>
            <p className="text-gray-300 mb-4">
              We may suspend or terminate your access to the Service at any time if:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>You violate these Terms</li>
              <li>Your use poses a security or legal risk</li>
              <li>Your account has been inactive for an extended period</li>
              <li>We discontinue the Service</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">9.3 Effect of Termination</h3>
            <p className="text-gray-300 mb-4">
              Upon termination:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Your access to the Service will cease</li>
              <li>We will delete your authentication tokens and stored data</li>
              <li>Provisions regarding liability, indemnification, and dispute resolution survive termination</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Disclaimers and Limitations of Liability</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">10.1 Disclaimer of Warranties</h3>
            <p className="text-gray-300 mb-4 uppercase font-semibold">
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
            <p className="text-gray-300 mb-4">
              We do not warrant that:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>The Service will meet your requirements</li>
              <li>The Service will be secure, timely, or error-free</li>
              <li>Results obtained from the Service will be accurate or reliable</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">10.2 Limitation of Liability</h3>
            <p className="text-gray-300 mb-4 uppercase font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, OR USE, ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE.
            </p>
            <p className="text-gray-300 mb-4 uppercase font-semibold">
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT YOU PAID TO US (IF ANY) IN THE 12 MONTHS PRIOR TO THE EVENT GIVING RISE TO LIABILITY.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Indemnification</h2>
            <p className="text-gray-300 mb-4">
              You agree to indemnify, defend, and hold harmless us and our officers, directors, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Your email content or activities</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Dispute Resolution</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">12.1 Governing Law</h3>
            <p className="text-gray-300 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">12.2 Dispute Resolution Process</h3>
            <p className="text-gray-300 mb-4">
              In the event of a dispute:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>First, contact us to resolve the issue informally</li>
              <li>If unresolved within 30 days, disputes may be resolved through binding arbitration or small claims court</li>
              <li>You agree to waive the right to participate in class action lawsuits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Miscellaneous</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">13.1 Entire Agreement</h3>
            <p className="text-gray-300 mb-4">
              These Terms, together with our Privacy Policy, constitute the entire agreement between you and us regarding the Service.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">13.2 Severability</h3>
            <p className="text-gray-300 mb-4">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">13.3 No Waiver</h3>
            <p className="text-gray-300 mb-4">
              Our failure to enforce any provision of these Terms does not constitute a waiver of that provision.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">13.4 Assignment</h3>
            <p className="text-gray-300 mb-4">
              You may not assign or transfer these Terms without our consent. We may assign these Terms without restriction.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">13.5 Changes to Terms</h3>
            <p className="text-gray-300 mb-4">
              We reserve the right to modify these Terms at any time. We will provide notice of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Updating the &quot;Last Updated&quot; date</li>
              <li>Posting a notice in the Service</li>
              <li>Sending you an email (for significant changes)</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Your continued use after changes constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Contact Information</h2>
            <p className="text-gray-300 mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="glass-dark p-4 rounded-lg">
              <p className="text-gray-300">
                <strong>Email:</strong> legal@yourdomain.com<br />
                <strong>Address:</strong> [Your Company Address]<br />
                <strong>Response Time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              By using our Email Client service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
