import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { CheckCircle2, Home, BookOpen } from 'lucide-react'

interface ResultsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ submission?: string }>
}

export default async function ResultsPage({ params, searchParams }: ResultsPageProps) {
  const { id } = await params
  const { submission: submissionId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: test } = await supabase
    .from('tests').select('title, pass_mark').eq('id', id).single()

  const { data: submission } = await supabase
    .from('submissions').select('*').eq('id', submissionId ?? '').eq('student_id', user.id).single()

  const passed =
    submission?.status === 'evaluated' &&
    test?.pass_mark !== null &&
    submission.obtained_marks !== null &&
    submission.obtained_marks >= (test?.pass_mark ?? 0)

  return (
    <div className="space-y-6 max-w-md mx-auto text-center">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle2 className="h-9 w-9 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Test Submitted!</h1>
          <p className="text-muted-foreground text-sm mt-1">{test?.title}</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <Badge variant={submission?.status === 'evaluated' ? 'default' : 'secondary'}>
                {submission?.status === 'evaluated' ? 'Evaluated' : 'Awaiting Review'}
              </Badge>
            </div>

            {submission?.submitted_at && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Submitted at</span>
                <span className="text-sm font-medium">
                  {new Date(submission.submitted_at).toLocaleString()}
                </span>
              </div>
            )}

            {submission?.status === 'evaluated' && submission.obtained_marks !== null && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Score</span>
                  <span className="text-xl font-bold">
                    {submission.obtained_marks}/{submission.total_marks}
                  </span>
                </div>
                {test?.pass_mark !== null && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Result</span>
                    <span className={`text-sm font-semibold ${passed ? 'text-green-600' : 'text-destructive'}`}>
                      {passed ? '✓ Passed' : '✗ Failed'}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {submission?.status !== 'evaluated' && (
            <p className="text-xs text-muted-foreground">
              Your teacher will review and grade your submission. Results will be available once evaluation is complete.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="outline" render={<Link href="/student/dashboard" />}>
          <Home className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
        <Button render={<Link href="/student/join" />}>
          <BookOpen className="h-4 w-4 mr-2" />
          Join Another Test
        </Button>
      </div>
    </div>
  )
}
