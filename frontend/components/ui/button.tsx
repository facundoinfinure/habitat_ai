import * as React from 'react'
import { cn } from '../../lib/utils'

type Variant = 'default' | 'secondary' | 'outline'
const styles: Record<Variant, string> = {
  default: 'bg-black text-white hover:bg-gray-800',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  outline: 'border bg-white hover:bg-gray-50'
}

export function Button({ className, variant = 'default', ...props }: React.ComponentProps<'button'> & { variant?: Variant }) {
  return (
    <button
      className={cn('inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50', styles[variant], className)}
      {...props}
    />
  )
}
