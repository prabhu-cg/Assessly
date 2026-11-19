import type { Metadata } from 'next'
import Link from 'next/link'
import { InfoPage, InfoSection } from '@/components/shared/info-page'

export const metadata: Metadata = { title: 'Privacy Policy', description: 'What Assessly collects, why, where it lives and who can see it.' }

export default function PrivacyPage() {
  return (
    <InfoPage title="Privacy Policy" updated="19 November 2026">
      <InfoSection title="The short version">
        <p>
          Assessly collects only what it needs to run tests and assignments: who the teacher and students are, the work
          students do, and the marks and comments teachers give. We do not sell data, show advertising, or use
          tracking or analytics cookies.
        </p>
      </InfoSection>

      <InfoSection title="What we collect">
        <ul>
          <li><strong>Teachers:</strong> name, email address and a password (stored by our sign-in provider as a hash, never in plain text).</li>
          <li><strong>Students:</strong> the name and optional year label a teacher enters, and a personal access link. No student email address is needed.</li>
          <li><strong>Work:</strong> answers to questions, typed responses, files a student attaches, the time work was started and handed in, and whether it was late.</li>
          <li><strong>Marking:</strong> marks, comments and whether a result has been shared.</li>
          <li><strong>Test integrity:</strong> during a test, a count of times the student left the test window.</li>
          <li><strong>Teacher content:</strong> tests, assignments, questions, briefs, attached files and question images.</li>
        </ul>
      </InfoSection>

      <InfoSection title="How it is used">
        <p>
          Only to provide the service: to let teachers set and mark work, to let students do it and see their results,
          and to keep accounts secure. We do not use student work to train models, build profiles or contact anyone
          for marketing.
        </p>
      </InfoSection>

      <InfoSection title="Who can see it">
        <ul>
          <li>A teacher can see the students they created, anyone who joined one of their tests, and the work those students hand in.</li>
          <li>A student can see only their own work. Marks, comments and answer keys stay hidden until the teacher shares the result.</li>
          <li>Assignment files are kept private and are opened through short-lived links. Images added to questions are stored in a public folder, so anyone holding an image&apos;s exact link can view it. Do not put personal information in a question image.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Where your data lives">
        <p>
          Accounts, work and files are stored with Supabase (database and file storage), and the application is served
          by Vercel. Both act on our behalf as service providers. Data is protected in transit, and access is limited
          by row-level security rules in the database.
        </p>
      </InfoSection>

      <InfoSection title="Cookies and tracking">
        <p>
          Assessly sets the cookies needed to keep you signed in. Your light or dark theme choice is saved in your
          browser. We do not use advertising cookies, third-party trackers or analytics.
        </p>
      </InfoSection>

      <InfoSection title="Data sharing and subprocessors">
        <p>
          We do not sell or rent personal data. Data is shared only with the providers above, to run the service, and
          where the law requires it.
        </p>
      </InfoSection>

      <InfoSection title="Keeping, deleting and your rights">
        <ul>
          <li>Deleting a test or assignment removes its questions, submissions, answers and files.</li>
          <li>A teacher can remove a student they created, which removes that student&apos;s account and work.</li>
          <li>You can ask to see, correct or delete your information. Students should ask their teacher first; teachers and schools can ask us.</li>
        </ul>
      </InfoSection>

      <InfoSection title="Children">
        <p>
          Assessly is used in classrooms, so many students are children. Students never create their own accounts: a
          teacher adds them and shares a link. The teacher or school that does so is responsible for having the right
          to use Assessly with their students, including any consent a parent or guardian must give where the law asks
          for it.
        </p>
      </InfoSection>

      <InfoSection title="Changes and contact">
        <p>
          If this policy changes we will update the date above. Questions about your information are best sent first
          to the teacher or school that gave you access to Assessly. See also our <Link href="/terms">Terms of Use</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
