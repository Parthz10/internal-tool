export interface TableColumn {
  key: string
  label: string
}

export function Table({ columns, rows }: { columns: TableColumn[]; rows: Record<string, unknown>[] }): JSX.Element {
  return (
    <div className="overflow-auto rounded border border-neutral-800">
      <table className="min-w-full divide-y divide-neutral-800 text-left text-sm">
        <thead className="bg-neutral-950 text-neutral-400">
          <tr>{columns.map((column) => <th key={column.key} className="px-3 py-2 font-medium">{column.label}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.map((row, index) => (
            <tr key={index} className="bg-neutral-900">
              {columns.map((column) => <td key={column.key} className="px-3 py-2 text-neutral-200">{String(row[column.key] ?? "")}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
