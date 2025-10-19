import { CardProps } from './types'
import { clsx } from 'clsx'

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-lg border border-gray-200 bg-white p-6 shadow-sm',
        className
      )}
    >
      {children}
    </div>
  )
}