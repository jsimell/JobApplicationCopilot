import { forwardRef, useId, useState } from 'react'
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/services/utils'
import type { DateValue } from './types'

/* ---------- Buttons ---------- */

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'subtle'
type Size = 'sm' | 'md' | 'icon'

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  secondary: 'bg-card text-foreground border border-input hover:bg-muted',
  subtle: 'bg-secondary text-secondary-foreground hover:bg-accent',
  ghost: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  danger: 'bg-destructive text-white hover:bg-destructive/90',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  icon: 'size-8',
}

export const addButtonClassName =
  'h-10 border border-primary/20 bg-secondary/60 text-primary hover:border-primary/35 hover:bg-secondary'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size = 'md', loading, disabled, className, children, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
})

/* ---------- Form fields ---------- */

const controlBase =
  'w-full rounded-md border border-input bg-card px-3 text-sm text-foreground placeholder:text-muted-foreground/70 transition-colors focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/20 disabled:opacity-60'

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
  required,
}: {
  label: string
  htmlFor?: string
  hint?: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-foreground/80">
        {label}
        {required && (
          <>
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export const TextInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function TextInput({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlBase, 'h-9', className)} {...props} />
  },
)

/** Text field bound to a nullable number (SQL `decimal`). Invalid input becomes NaN so validation can reject it. */
export function DecimalInput({
  value,
  onChange,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: number | null
  onChange: (value: number | null) => void
}) {
  const [text, setText] = useState(value === null || Number.isNaN(value) ? '' : String(value))
  return (
    <TextInput
      inputMode="decimal"
      value={text}
      onChange={(e) => {
        setText(e.target.value)
        const normalized = e.target.value.trim().replace(',', '.')
        onChange(normalized === '' ? null : Number(normalized))
      }}
      {...props}
    />
  )
}

/** Maps an empty text input to `null` for nullable columns. */
export function orNull(value: string) {
  return value.trim() === '' ? null : value
}

export function TextArea({ className, rows = 4, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea rows={rows} className={cn(controlBase, 'resize-y py-2 leading-relaxed', className)} {...props} />
  )
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(controlBase, 'h-9 appearance-auto pr-2', className)} {...props}>
      {children}
    </select>
  )
}

/* ---------- Month / year ---------- */

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 60 }, (_, i) => String(currentYear + 5 - i))

export function MonthYearInput({
  id,
  value,
  onChange,
  disabled,
  ariaLabel,
}: {
  id?: string
  value: DateValue | null
  onChange: (value: DateValue | null) => void
  disabled?: boolean
  ariaLabel: string
}) {
  const [year, month] = value ? value.split('-') : ['', '']
  return (
    <div className="flex gap-2" role="group" aria-label={ariaLabel}>
      <Select
        id={id}
        aria-label={`${ariaLabel} month`}
        value={month}
        disabled={disabled}
        onChange={(e) => {
          const m = e.target.value
          onChange(m ? `${year || currentYear}-${m}-01` : null)
        }}
      >
        <option value="">Month</option>
        {MONTHS.map((name, i) => (
          <option key={name} value={String(i + 1).padStart(2, '0')}>
            {name}
          </option>
        ))}
      </Select>
      <Select
        aria-label={`${ariaLabel} year`}
        value={year}
        disabled={disabled}
        onChange={(e) => {
          const y = e.target.value
          onChange(y ? `${y}-${month || '01'}-01` : null)
        }}
      >
        <option value="">Year</option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  )
}

export function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId()
  return (
    <label htmlFor={id} className="inline-flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 rounded border-input accent-primary"
      />
      {label}
    </label>
  )
}

/* ---------- Formatting helpers ---------- */

export function formatMonth(value: DateValue | null) {
  if (!value) return ''
  const [y, m] = value.split('-')
  return `${MONTHS[Number(m) - 1]} ${y}`
}

export function formatRange(start: DateValue | null, end: DateValue | null, ongoingLabel = 'Present') {
  if (!start && !end) return ''
  return `${formatMonth(start) || '—'} – ${end ? formatMonth(end) : ongoingLabel}`
}

export function formatDuration(start: DateValue | null, end: DateValue | null) {
  if (!start) return ''
  const [sy, sm] = start.split('-').map(Number)
  const now = new Date()
  const [ey, em] = end ? end.split('-').map(Number) : [now.getFullYear(), now.getMonth() + 1]
  const total = (ey - sy) * 12 + (em - sm) + 1
  if (total <= 0) return ''
  const years = Math.floor(total / 12)
  const months = total % 12
  return [years && `${years} yr${years > 1 ? 's' : ''}`, months && `${months} mo${months > 1 ? 's' : ''}`]
    .filter(Boolean)
    .join(' ')
}

let nextTempId = -1

/**
 * Database ids are positive identity integers assigned by the backend.
 * Unsaved rows get negative temporary ids so they never collide with real ones.
 */
export function newTempId() {
  return nextTempId--
}

/* ---------- Skill chip colors ---------- */

const chipPalette = [
  'bg-sky-50 text-sky-900 border-sky-200',
  'bg-indigo-50 text-indigo-900 border-indigo-200',
  'bg-teal-50 text-teal-900 border-teal-200',
  'bg-blue-50 text-blue-900 border-blue-200',
  'bg-violet-50 text-violet-900 border-violet-200',
  'bg-slate-100 text-slate-800 border-slate-200',
]

export function chipColor(name: string) {
  let hash = 0
  for (const ch of name.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return chipPalette[hash % chipPalette.length]
}

export function useToggle(initial = false) {
  const [value, setValue] = useState(initial)
  return [value, () => setValue((v) => !v), setValue] as const
}
