export function ApplicationLoadingStep({
  message,
}: {
  message: string
}) {
  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-5 pt-8 text-center sm:pt-12">
      <span
        className="mx-auto mt-8 size-10 animate-spin rounded-full border-4 border-primary/15 border-t-primary"
        aria-hidden="true"
      />
      <p className="mt-5 text-sm font-medium text-foreground" role="status" aria-live="polite">
        {message}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">This may take a little while.</p>
    </div>
  )
}
