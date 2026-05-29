import { TestForm } from '@/components/teacher/test-form'

export default function NewTestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Test</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fill in the details below. You can add questions after saving.
        </p>
      </div>
      <TestForm />
    </div>
  )
}
