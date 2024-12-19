"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { FileIcon } from "lucide-react"

export function FileUpload({ onClose }: { onClose: () => void }) {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col gap-1 p-6 items-center">
          <FileIcon className="w-12 h-12 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Drag and drop a file or click to browse</span>
          <span className="text-xs text-muted-foreground">PDF, image, video, or audio</span>
        </div>
        <div className="space-y-2 text-sm">
          <Label htmlFor="file" className="text-sm font-medium">
            File
          </Label>
          <Input id="file" type="file" placeholder="File" accept="image/*" />
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button>Upload</Button>
      </CardFooter>
    </Card>
  )
} 