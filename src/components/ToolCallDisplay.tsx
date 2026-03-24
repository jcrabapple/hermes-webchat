import { useState } from 'react'
import type { ToolCall } from '../types'

interface ToolCallDisplayProps {
  toolCall: ToolCall
}

export default function ToolCallDisplay({ toolCall }: ToolCallDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800">
      <div 
        className="p-3 cursor-pointer flex justify-between items-center"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="font-mono text-sm font-medium text-yellow-800 dark:text-yellow-200">
          🔧 {toolCall.name}
        </div>
        <div className="text-xs text-yellow-600 dark:text-yellow-400">
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </div>
      </div>
      
      {expanded && (
        <div className="p-3 pt-0 border-t border-yellow-200 dark:border-yellow-800">
          <div className="mb-2">
            <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Arguments:</h4>
            <pre className="text-xs bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded overflow-x-auto">
              {JSON.stringify(toolCall.arguments, null, 2)}
            </pre>
          </div>
          
          {toolCall.result && (
            <div>
              <h4 className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">Result:</h4>
              <pre className="text-xs bg-yellow-100 dark:bg-yellow-900/50 p-2 rounded overflow-x-auto">
                {JSON.stringify(toolCall.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}