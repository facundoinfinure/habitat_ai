import * as React from 'react'
import { cn } from '../../lib/utils'

export function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return <table className={cn('w-full text-sm', className)} {...props} />
}
export function THead({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('text-left text-gray-500', className)} {...props} />
}
export function TBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('divide-y', className)} {...props} />
}
export function TR({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('', className)} {...props} />
}
export function TH({ className, ...props }: React.ComponentProps<'th'>) {
  return <th className={cn('px-3 py-2 font-medium', className)} {...props} />
}
export function TD({ className, ...props }: React.ComponentProps<'td'>) {
  return <td className={cn('px-3 py-2', className)} {...props} />
}
