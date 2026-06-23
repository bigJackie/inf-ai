import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Loader2, CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

type ToolState = 'input-streaming' | 'call' | 'output-available' | 'partial-call' | 'output-error'

interface Props {
  toolName: string
  state: ToolState
  input: Record<string, unknown>
  output?: unknown
  errorText?: string
}

export function ToolInvocationCard({ toolName, state, input, output, errorText }: Props) {
  const [expanded, setExpanded] = useState(true)
  const isDone = state === 'output-available'
  const isError = state === 'output-error'
  const isFinished = isDone || isError

  useEffect(() => {
    if (isFinished) setExpanded(false)
  }, [isFinished])

  return (
    <Card className="overflow-hidden border-dashed py-0 text-xs">
      <div
        className="hover:bg-muted/50 flex cursor-pointer items-center gap-2 px-3 py-2 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {isDone && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />}
        {isError && <XCircle className="h-3.5 w-3.5 shrink-0 text-red-500" />}
        {!isFinished && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />}

        <span className="font-medium">工具调用</span>
        <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
          {toolName}
        </Badge>

        <div className="flex-1" />

        <Badge
          variant={isDone ? 'secondary' : isError ? 'destructive' : 'outline'}
          className="px-1.5 py-0 text-[10px]"
        >
          {isDone ? '完成' : isError ? '失败' : '调用中...'}
        </Badge>
        {expanded ? (
          <ChevronUp className="text-muted-foreground h-3 w-3" />
        ) : (
          <ChevronDown className="text-muted-foreground h-3 w-3" />
        )}
      </div>

      {expanded && (
        <div className="bg-muted/30 space-y-2 border-t px-3 py-2">
          <div>
            <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase">入参</p>
            <pre className="bg-background overflow-x-auto rounded p-2 text-[11px]">
              {JSON.stringify(input, null, 2)}
            </pre>
          </div>
          {isDone && output !== undefined && (
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase">结果</p>
              <pre className="bg-background overflow-x-auto rounded p-2 text-[11px]">
                {JSON.stringify(output, null, 2)}
              </pre>
            </div>
          )}
          {isError && (
            <div>
              <p className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase">错误</p>
              <pre className="bg-background overflow-x-auto rounded p-2 text-[11px] text-red-500">
                {errorText ?? 'An error occurred.'}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
