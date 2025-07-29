import { ChevronRight, Home } from 'lucide-react'
import { Button } from './button'
import { useRouter } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2 text-sm text-blue-200 mb-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/')}
        className="text-blue-300 hover:text-white p-1"
      >
        <Home className="w-4 h-4" />
      </Button>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight className="w-3 h-3" />
          {item.href ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(item.href!)}
              className="text-blue-300 hover:text-white p-1 h-auto"
            >
              {item.label}
            </Button>
          ) : (
            <span className="text-white">{item.label}</span>
          )}
        </div>
      ))}
    </div>
  )
}