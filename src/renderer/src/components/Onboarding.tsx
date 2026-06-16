interface Props {
  onChoose: () => void
}

export default function Onboarding({ onChoose }: Props): JSX.Element {
  return (
    <div className="drag-region flex h-screen w-screen items-center justify-center bg-app text-text-primary">
      <div className="no-drag flex max-w-sm flex-col items-center gap-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-2xl text-accent">
          ✦
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Welcome to Lumen</h1>
          <p className="text-sm text-text-secondary">
            Your notes live as plain Markdown files in a folder you choose — synced however you like.
          </p>
        </div>
        <button
          onClick={onChoose}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-app transition-opacity hover:opacity-90"
        >
          Choose your Lumen vault
        </button>
      </div>
    </div>
  )
}
