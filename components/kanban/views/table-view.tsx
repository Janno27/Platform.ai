"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function TableView({ tests }: { tests: any[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Team</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tests.map((test) => (
          <TableRow key={test.id}>
            <TableCell>{test.name}</TableCell>
            <TableCell>{test.status}</TableCell>
            <TableCell>{test.type}</TableCell>
            <TableCell>{test.created_at}</TableCell>
            <TableCell>
              {/* Team members */}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
} 