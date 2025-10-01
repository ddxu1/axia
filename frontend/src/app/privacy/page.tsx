export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Email Client Application'
}

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto glass-card rounded-2xl p-8 md:p-12">
        <h1 className="text-4xl font-bold text-white mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-400 mb-8">Last Updated: {new Date().toLocaleDateString()}</p>

        <div className="prose prose-lg prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p className="text-gray-300 mb-4">
              Welcome to our Email Client application (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and handling your data in an open and transparent manner. This Privacy Policy explains how we collect, use, store, and share your information when you use our email client service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">2.1 Information You Provide</h3>
            <p className="text-gray-300 mb-4">
              When you connect your email account(s) to our service, we collect:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Your email address</li>
              <li>Your name and profile information from your email provider</li>
              <li>OAuth access tokens and refresh tokens for authentication</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">2.2 Email Data</h3>
            <p className="text-gray-300 mb-4">
              With your explicit authorization, we access your email data including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Email messages (subject, sender, recipients, body, attachments)</li>
              <li>Email metadata (timestamps, labels, read/unread status)</li>
              <li>Contact information from your emails</li>
              <li>Email folder and label structure</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">2.3 Usage Information</h3>
            <p className="text-gray-300 mb-4">
              We automatically collect certain information when you use our service:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Log data (IP address, browser type, access times)</li>
              <li>Device information (operating system, device identifiers)</li>
              <li>Usage patterns and feature interactions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-300 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li><strong>Provide email services:</strong> Display, organize, send, and manage your emails</li>
              <li><strong>Authenticate your account:</strong> Verify your identity and maintain secure access</li>
              <li><strong>Improve our service:</strong> Analyze usage patterns to enhance features and user experience</li>
              <li><strong>Communicate with you:</strong> Send service updates, security alerts, and support messages</li>
              <li><strong>Ensure security:</strong> Detect and prevent fraud, abuse, and security incidents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Gmail API Services User Data Policy</h2>
            <p className="text-gray-300 mb-4">
              Our use of information received from Gmail APIs adheres to the{' '}
              <a
                href="https://developers.google.com/terms/api-services-user-data-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google API Services User Data Policy
              </a>, including the Limited Use requirements.
            </p>
            <p className="text-gray-300 mb-4">
              Specifically:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>We only request access to Gmail data necessary for providing email client functionality</li>
              <li>We do not use Gmail data for serving advertisements</li>
              <li>We do not allow humans to read your email data except as necessary for security purposes, to comply with applicable law, or with your explicit consent</li>
              <li>We do not transfer Gmail data to third parties except as necessary to provide the service, comply with applicable law, or as part of a merger or acquisition with notice to users</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Microsoft Graph API Data Usage</h2>
            <p className="text-gray-300 mb-4">
              For users connecting Outlook/Microsoft 365 accounts, our use of Microsoft Graph API data follows Microsoft&apos;s data handling requirements:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>We only access data necessary for email client functionality</li>
              <li>We do not use your Outlook data for advertising or marketing purposes</li>
              <li>Data is processed in accordance with Microsoft&apos;s security and privacy standards</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Data Storage and Security</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">6.1 How We Store Your Data</h3>
            <p className="text-gray-300 mb-4">
              We store minimal data on our servers:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li><strong>Authentication tokens:</strong> Encrypted OAuth tokens to access your email on your behalf</li>
              <li><strong>User profile:</strong> Basic account information (email, name, provider)</li>
              <li><strong>Preferences:</strong> Your app settings and customization choices</li>
              <li><strong>Email content:</strong> We do not permanently store your email content on our servers. Emails are fetched in real-time from your provider</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">6.2 Security Measures</h3>
            <p className="text-gray-300 mb-4">
              We implement industry-standard security measures:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encrypted storage of authentication credentials</li>
              <li>Regular security audits and updates</li>
              <li>Access controls and authentication requirements</li>
              <li>Secure coding practices and vulnerability testing</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">6.3 Data Retention</h3>
            <p className="text-gray-300 mb-4">
              We retain your data only as long as necessary to provide our services. When you disconnect an email account or delete your account, we promptly delete associated authentication tokens and user data from our servers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Data Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">7.1 Third-Party Services</h3>
            <p className="text-gray-300 mb-4">
              We interact with the following third-party services to provide our functionality:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li><strong>Google (Gmail API):</strong> To access and manage your Gmail account</li>
              <li><strong>Microsoft (Graph API):</strong> To access and manage your Outlook/Microsoft 365 account</li>
              <li><strong>Hosting providers:</strong> For application infrastructure and database services</li>
            </ul>
            <p className="text-gray-300 mb-4">
              We do not sell, rent, or share your personal information or email data with third parties for their marketing purposes.
            </p>

            <h3 className="text-xl font-semibold text-gray-300 mb-3">7.2 Legal Requirements</h3>
            <p className="text-gray-300 mb-4">
              We may disclose your information if required by law, such as:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Responding to legal process (subpoenas, court orders)</li>
              <li>Protecting our rights, property, or safety</li>
              <li>Preventing fraud or abuse</li>
              <li>Complying with regulatory requirements</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Your Rights and Choices</h2>
            <p className="text-gray-300 mb-4">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request corrections to inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
              <li><strong>Revoke access:</strong> Disconnect email accounts at any time through your account settings or provider&apos;s security settings</li>
              <li><strong>Data portability:</strong> Request your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from non-essential communications</li>
            </ul>
            <p className="text-gray-300 mb-4">
              To revoke our access to your Gmail account, visit{' '}
              <a
                href="https://myaccount.google.com/permissions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Google Account Permissions
              </a>.
            </p>
            <p className="text-gray-300 mb-4">
              To revoke our access to your Microsoft account, visit{' '}
              <a
                href="https://account.microsoft.com/privacy/app-access"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Microsoft Account Privacy
              </a>.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
            <p className="text-gray-300 mb-4">
              We use cookies and similar technologies to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Maintain your session and keep you logged in</li>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our service</li>
            </ul>
            <p className="text-gray-300 mb-4">
              You can control cookies through your browser settings, though disabling cookies may limit functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. International Data Transfers</h2>
            <p className="text-gray-300 mb-4">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy and applicable laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Children&apos;s Privacy</h2>
            <p className="text-gray-300 mb-4">
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you believe we have inadvertently collected such information, please contact us to have it removed.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Posting the updated policy on this page with a new &quot;Last Updated&quot; date</li>
              <li>Sending you an email notification (for significant changes)</li>
              <li>Displaying a prominent notice in the application</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Your continued use of the service after changes become effective constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
            <p className="text-gray-300 mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="glass-dark p-4 rounded-lg">
              <p className="text-gray-300">
                <strong>Email:</strong> privacy@yourdomain.com<br />
                <strong>Address:</strong> [Your Company Address]<br />
                <strong>Response Time:</strong> We aim to respond within 48 hours
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">14. Additional Information for EU Users (GDPR)</h2>
            <p className="text-gray-300 mb-4">
              If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Right to object to processing</li>
              <li>Right to restriction of processing</li>
              <li>Right to lodge a complaint with a supervisory authority</li>
              <li>Right to withdraw consent at any time</li>
            </ul>
            <p className="text-gray-300 mb-4">
              Our legal basis for processing your data is your consent, which you provide when authorizing access to your email account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">15. Additional Information for California Users (CCPA)</h2>
            <p className="text-gray-300 mb-4">
              If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-300">
              <li>Right to know what personal information is collected</li>
              <li>Right to know if personal information is sold or disclosed</li>
              <li>Right to say no to the sale of personal information (we do not sell your data)</li>
              <li>Right to access your personal information</li>
              <li>Right to equal service and price</li>
            </ul>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10">
            <p className="text-sm text-gray-400 text-center">
              This Privacy Policy is designed to comply with Google API Services User Data Policy, Microsoft Graph API requirements, GDPR, CCPA, and other applicable privacy laws.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
