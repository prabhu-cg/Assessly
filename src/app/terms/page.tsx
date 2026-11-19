import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/shared/info-page'

export const metadata: Metadata = { title: 'Terms of Use', description: 'The rules for using Assessly as a teacher or a student.' }

export default function TermsPage() {
  return (
    <InfoPage title="Terms of Use" updated="19 November 2026">
      <InfoSection title="The short version">
        <p>
          Use Assessly honestly and respectfully, keep your sign-in details to yourself, and only put in work you have
          the right to share. The service is provided as it is, and we may improve or change it over time. By using
          Assessly you agree to these terms and to our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </InfoSection>

      <InfoSection title="Accounts">
        <ul>
          <li>Teachers sign in with an email address and password. Keep your password private and tell us if you think someone else has it.</li>
          <li>Students are added by a teacher and use a personal link or invite code. Do not share your link: anyone who has it can open your work.</li>
          <li>A teacher is responsible for the students they add and for how the work they set is used.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Your content">
        <p>
          Teachers keep ownership of the tests, assignments, questions and files they create. Students keep ownership of
          the work they hand in. You give Assessly permission to store and display that content, and only to the people
          who should see it, so the service can work.
        </p>
        <p>
          You must have the right to upload what you upload, and it must not infringe anyone&apos;s rights or contain
          anything unlawful, abusive or harmful. Files are limited in size and type, and we may remove content that
          breaks these terms.
        </p>
      </InfoSection>

      <InfoSection title="Fair use and test integrity">
        <ul>
          <li>Do not try to access another person&apos;s account or work, or to get around the limits of your own.</li>
          <li>Do not disrupt, overload or probe the service, or use it to send spam or malware.</li>
          <li>In a test, complete the work yourself. Assessly records when a student leaves the test window and shows that count to the teacher.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Availability">
        <p>
          We work to keep Assessly running, but we cannot promise it will always be available or error-free. Save your
          own copy of anything important. Features may change, and we may pause or end the service with reasonable
          notice where we can.
        </p>
      </InfoSection>

      <InfoSection title="Marks and results">
        <p>
          Marks and comments are decided by the teacher. Multiple-choice answers are marked automatically against the
          answer the teacher set, and the teacher can review the outcome. Assessly is a tool; it is not responsible for
          academic decisions made from its results.
        </p>
      </InfoSection>

      <InfoSection title="Liability">
        <p>
          To the extent the law allows, Assessly is provided without warranties, and we are not liable for indirect or
          consequential losses, or for loss of data or work caused by use of the service. Nothing here limits any right
          you have that cannot lawfully be limited.
        </p>
      </InfoSection>

      <InfoSection title="Ending your use">
        <p>
          You can stop using Assessly at any time, and teachers can delete their content and students. We may suspend an
          account that breaks these terms or puts others at risk.
        </p>
      </InfoSection>

      <InfoSection title="Changes and contact">
        <p>
          If these terms change we will update the date above, and continuing to use Assessly means you accept the
          update. For questions, start with the teacher or school that gave you access. Learn more on the{' '}
          <Link href="/about">About page</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
