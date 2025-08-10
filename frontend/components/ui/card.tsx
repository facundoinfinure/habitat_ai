import * as React from 'react'
import { cn } from '../../lib/utils'

export function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('rounded-lg border bg-white shadow-sm', className)} {...props} />
}

export function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4 border-b', className)} {...props} />
}

export function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
  return <h3 className={cn('font-semibold leading-none tracking-tight', className)} {...props} />
}

export function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} {...props} />
}
