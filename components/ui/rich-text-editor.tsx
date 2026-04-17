"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Heading1, 
  Heading2, 
  Heading3,
  Link,
  Undo,
  Redo
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const RichTextEditor = forwardRef<HTMLTextAreaElement, RichTextEditorProps>(
  ({ value, onChange, placeholder = "Start typing...", className = "" }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [linkUrl, setLinkUrl] = useState("");
    const [linkPopoverOpen, setLinkPopoverOpen] = useState(false);

    useEffect(() => {
      if (textareaRef.current && !ref) {
        ref = textareaRef;
      }
    }, [ref]);

    const insertText = (before: string, after: string = "") => {
      const textarea = textareaRef.current || (ref as any)?.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end);
      
      const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
      onChange(newText);
      
      // Set cursor position after insertion
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + before.length,
          start + before.length + selectedText.length
        );
      }, 0);
    };

    const insertLink = () => {
      if (!linkUrl.trim()) return;
      
      const textarea = textareaRef.current || (ref as any)?.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = value.substring(start, end) || linkUrl;
      
      const linkMarkdown = `[${selectedText}](${linkUrl})`;
      const newText = value.substring(0, start) + linkMarkdown + value.substring(end);
      onChange(newText);
      
      setLinkUrl("");
      setLinkPopoverOpen(false);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + 1,
          start + 1 + selectedText.length
        );
      }, 0);
    };

    const formatText = (format: string) => {
      switch (format) {
        case "bold":
          insertText("**", "**");
          break;
        case "italic":
          insertText("*", "*");
          break;
        case "underline":
          insertText("<ins>", "</ins>");
          break;
        case "strikethrough":
          insertText("~~", "~~");
          break;
        case "code":
          insertText("`", "`");
          break;
        case "heading1":
          insertText("# ");
          break;
        case "heading2":
          insertText("## ");
          break;
        case "heading3":
          insertText("### ");
          break;
        case "bullet":
          insertText("- ");
          break;
        case "numbered":
          insertText("1. ");
          break;
        case "quote":
          insertText("> ");
          break;
        default:
          break;
      }
    };

    const handleUndo = () => {
      // Simple undo implementation - in a real app you'd want a more sophisticated solution
      const textarea = textareaRef.current || (ref as any)?.current;
      if (textarea) {
        textarea.focus();
        document.execCommand('undo');
      }
    };

    const handleRedo = () => {
      // Simple redo implementation
      const textarea = textareaRef.current || (ref as any)?.current;
      if (textarea) {
        textarea.focus();
        document.execCommand('redo');
      }
    };

    return (
      <div className={`border rounded-lg overflow-hidden ${className}`}>
        {/* Toolbar */}
        <div className="border-b bg-muted/50 p-2 flex flex-wrap gap-1">
          {/* Undo/Redo */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            title="Undo"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRedo}
            title="Redo"
          >
            <Redo className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Text Formatting */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("bold")}
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("italic")}
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("underline")}
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("strikethrough")}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("code")}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Headings */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("heading1")}
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("heading2")}
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("heading3")}
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Lists */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("bullet")}
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("numbered")}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => formatText("quote")}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </Button>
          
          <Separator orientation="vertical" className="mx-1 h-6" />
          
          {/* Link */}
          <Popover open={linkPopoverOpen} onOpenChange={setLinkPopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" title="Insert Link">
                <Link className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Insert Link</h4>
                <Input
                  placeholder="Enter URL..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && insertLink()}
                />
                <Button size="sm" onClick={insertLink} className="w-full">
                  Insert
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 resize-none focus:outline-none focus:ring-0"
          style={{ fontFamily: 'inherit' }}
        />
      </div>
    );
  }
);

RichTextEditor.displayName = "RichTextEditor";
