import { cn } from '@/lib/utils'

interface BadgeProps {
  color?: 'green' | 'red' | 'blue' | 'yellow' | 'orange' | 'gray' | 'purple'
  size?: 'sm' | 'md'
  children: React.ReactNode
  className?: string
}

const colorMap = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

export default function Badge({ color = 'gray', size = 'sm', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        colorMap[color],
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        className
      )}
    >
      {children}
    </span>
  )
}
