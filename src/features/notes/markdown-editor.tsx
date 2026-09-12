"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import { BubbleMenu } from "@tiptap/react/menus"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Highlight from "@tiptap/extension-highlight"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Markdown } from "@tiptap/markdown"
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code2,
  Highlighter,
  Undo2,
  Redo2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function ToolbarItem({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className={cn("h-7 px-1.5 text-muted-foreground", active && "bg-accent text-foreground")}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </Button>
  )
}

export function MarkdownEditor({
  content,
  onChange,
  placeholder,
}: {
  content: string
  onChange: (markdown: string) => void
  placeholder?: string
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Write something…" }),
      Markdown,
    ],
    content: content || "",
    contentType: "markdown",
    editorProps: {
      attributes: {
        class: "tiptap min-h-[8rem] px-3 py-2 text-sm focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => {
      if (typeof e.getMarkdown === "function") onChange(e.getMarkdown())
    },
  })

  if (!editor) return null

  const is = (fn: (e: typeof editor) => boolean) => fn(editor)

  const run = (fn: () => void) => () => {
    fn()
    onChange(editor.getMarkdown())
  }

  return (
    <div className="rounded-md border">
      <div className="hidden md:flex flex-wrap items-center gap-0.5 border-b bg-muted/40 px-1 py-0.5">
        <ToolbarItem label="Bold" active={is((e) => e.isActive("bold"))} onClick={run(() => editor.chain().focus().toggleBold().run())}>
          <Bold className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Italic" active={is((e) => e.isActive("italic"))} onClick={run(() => editor.chain().focus().toggleItalic().run())}>
          <Italic className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Underline" active={is((e) => e.isActive("underline"))} onClick={run(() => editor.chain().focus().toggleUnderline().run())}>
          <UnderlineIcon className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Strikethrough" active={is((e) => e.isActive("strike"))} onClick={run(() => editor.chain().focus().toggleStrike().run())}>
          <Strikethrough className="size-3.5" />
        </ToolbarItem>
        <SeparatorDot />
        <ToolbarItem label="H1" active={is((e) => e.isActive("heading", { level: 1 }))} onClick={run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
          <Heading1 className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="H2" active={is((e) => e.isActive("heading", { level: 2 }))} onClick={run(() => editor.chain().focus().toggleHeading({ level: 2 }).run())}>
          <Heading2 className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="H3" active={is((e) => e.isActive("heading", { level: 3 }))} onClick={run(() => editor.chain().focus().toggleHeading({ level: 3 }).run())}>
          <Heading3 className="size-3.5" />
        </ToolbarItem>
        <SeparatorDot />
        <ToolbarItem label="Bullet list" active={is((e) => e.isActive("bulletList"))} onClick={run(() => editor.chain().focus().toggleBulletList().run())}>
          <List className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Ordered list" active={is((e) => e.isActive("orderedList"))} onClick={run(() => editor.chain().focus().toggleOrderedList().run())}>
          <ListOrdered className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Task list" active={is((e) => e.isActive("taskList"))} onClick={run(() => editor.chain().focus().toggleTaskList().run())}>
          <ListChecks className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Quote" active={is((e) => e.isActive("blockquote"))} onClick={run(() => editor.chain().focus().toggleBlockquote().run())}>
          <Quote className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Code block" active={is((e) => e.isActive("codeBlock"))} onClick={run(() => editor.chain().focus().toggleCodeBlock().run())}>
          <Code2 className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Inline code" active={is((e) => e.isActive("code"))} onClick={run(() => editor.chain().focus().toggleCode().run())}>
          <Code className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Highlight" active={is((e) => e.isActive("highlight"))} onClick={run(() => editor.chain().focus().toggleHighlight().run())}>
          <Highlighter className="size-3.5" />
        </ToolbarItem>
        <SeparatorDot />
        <ToolbarItem label="Undo" onClick={run(() => editor.chain().focus().undo().run())}>
          <Undo2 className="size-3.5" />
        </ToolbarItem>
        <ToolbarItem label="Redo" onClick={run(() => editor.chain().focus().redo().run())}>
          <Redo2 className="size-3.5" />
        </ToolbarItem>
      </div>
      <EditorContent editor={editor} />

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor: e }) => e.isEditable && e.isFocused && !e.state.selection.empty}
        options={{ strategy: "fixed" }}
        className="flex items-center gap-0.5 rounded-full border border-border bg-background/95 p-1 shadow-lg shadow-black/10 backdrop-blur"
      >
        <BubbleItem label="Bold" active={is((e) => e.isActive("bold"))} onClick={run(() => editor.chain().focus().toggleBold().run())}>
          <Bold />
        </BubbleItem>
        <BubbleItem label="Italic" active={is((e) => e.isActive("italic"))} onClick={run(() => editor.chain().focus().toggleItalic().run())}>
          <Italic />
        </BubbleItem>
        <BubbleItem label="Underline" active={is((e) => e.isActive("underline"))} onClick={run(() => editor.chain().focus().toggleUnderline().run())}>
          <UnderlineIcon />
        </BubbleItem>
        <BubbleItem label="Strikethrough" active={is((e) => e.isActive("strike"))} onClick={run(() => editor.chain().focus().toggleStrike().run())}>
          <Strikethrough />
        </BubbleItem>
        <BubbleItem label="Inline code" active={is((e) => e.isActive("code"))} onClick={run(() => editor.chain().focus().toggleCode().run())}>
          <Code />
        </BubbleItem>
        <BubbleItem label="Highlight" active={is((e) => e.isActive("highlight"))} onClick={run(() => editor.chain().focus().toggleHighlight().run())}>
          <Highlighter />
        </BubbleItem>
        <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
        <BubbleItem label="Bullet list" active={is((e) => e.isActive("bulletList"))} onClick={run(() => editor.chain().focus().toggleBulletList().run())}>
          <List />
        </BubbleItem>
        <BubbleItem label="Quote" active={is((e) => e.isActive("blockquote"))} onClick={run(() => editor.chain().focus().toggleBlockquote().run())}>
          <Quote />
        </BubbleItem>
        <BubbleItem label="H1" active={is((e) => e.isActive("heading", { level: 1 }))} onClick={run(() => editor.chain().focus().toggleHeading({ level: 1 }).run())}>
          <Heading1 />
        </BubbleItem>
      </BubbleMenu>
    </div>
  )
}

function BubbleItem({
  active,
  label,
  onClick,
  children,
}: {
  active?: boolean
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant="ghost"
      aria-label={label}
      onClick={onClick}
      className={cn("h-8 w-8 rounded-full text-muted-foreground", active && "bg-accent text-foreground")}
    >
      {children}
    </Button>
  )
}

function SeparatorDot() {
  return <span className="mx-1 h-4 w-px bg-border" aria-hidden />
}