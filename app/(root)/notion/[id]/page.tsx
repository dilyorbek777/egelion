"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { 
  ArrowLeft, 
  Edit2, 
  Save, 
  X, 
  Trash2, 
  Lock, 
  Globe, 
  User,
  MoreVertical,
  Calendar,
  Clock,
  Eye,
  Share2,
  Download,
  Copy,
  Check
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { useUser } from "@clerk/nextjs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface Document {
  _id: Id<"documents">;
  authorId: Id<"users">;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: number;
  updatedAt: number;
  author: {
    _id: Id<"users">;
    username: string;
    fullName: string;
    profileImage?: string;
  };
}

export default function DocumentPage() {
  const params = useParams();
  const router = useRouter();
  const documentId = params.id as Id<"documents">;
  const { user, isSignedIn } = useUser();

  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [editedIsPublic, setEditedIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const document = useQuery(api.documents.getDocument, { 
    documentId,
    clerkUserId: isSignedIn && user ? user.id : undefined 
  }) as Document | undefined;
  const updateDocument = useMutation(api.documents.updateDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  useEffect(() => {
    if (document) {
      setEditedTitle(document.title);
      setEditedContent(document.content);
      setEditedIsPublic(document.isPublic);
    }
  }, [document]);

  const handleSave = async () => {
    if (!document) return;

    if (!isSignedIn || !user) {
      toast.error("Please sign in to update documents");
      return;
    }

    setIsSaving(true);
    try {
      await updateDocument({
        documentId: document._id,
        title: editedTitle,
        content: editedContent,
        isPublic: editedIsPublic,
        clerkUserId: user.id,
      });
      
      setIsEditing(false);
      toast.success("Document updated successfully!");
    } catch (error: any) {
      if (error.message?.includes("Authentication required")) {
        toast.error("Please sign in to update documents");
      } else {
        toast.error("Failed to update document");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyLink = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: document?.title,
        text: `Check out this document: ${document?.title}`,
        url: window.location.href,
      });
    } else {
      handleCopyLink();
    }
  };

  const handleDelete = async () => {
    if (!document) return;

    if (!isSignedIn || !user) {
      toast.error("Please sign in to delete documents");
      return;
    }

    if (!confirm("Are you sure you want to delete this document? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteDocument({ 
        documentId: document._id,
        clerkUserId: user.id 
      });
      toast.success("Document deleted successfully!");
      router.push("/notion");
    } catch (error: any) {
      if (error.message?.includes("Authentication required")) {
        toast.error("Please sign in to delete documents");
      } else {
        toast.error("Failed to delete document");
      }
    }
  };

  const handleCancel = () => {
    if (document) {
      setEditedTitle(document.title);
      setEditedContent(document.content);
      setEditedIsPublic(document.isPublic);
    }
    setIsEditing(false);
  };

  if (!document) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 to-slate-100">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-8">
            <Link href="/notion">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Documents
              </Button>
            </Link>
          </div>
          
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold mb-3">
                {isSignedIn ? "Document Not Found" : "Authentication Required"}
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                {isSignedIn 
                  ? "The document you're looking for doesn't exist or you don't have access to it."
                  : "Please sign in to access private documents."
                }
              </p>
              <div className="flex gap-3 justify-center">
                {!isSignedIn && (
                  <Link href="/sign-in">
                    <Button className="gap-2">
                      <User className="w-4 h-4" />
                      Sign In
                    </Button>
                  </Link>
                )}
                <Link href="/notion">
                  <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Documents
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:via-slate-900 dark:from-black/50 dark:to-slate-900">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/notion">
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-slate-100">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div className="h-6 w-px bg-slate-300" />
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Calendar className="w-4 h-4" />
                <span>Created {format(new Date(document.createdAt), "MMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Clock className="w-4 h-4" />
                <span>Updated {format(new Date(document.updatedAt), "MMM d, yyyy")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button 
                    onClick={handleSave} 
                    size="sm" 
                    disabled={isSaving}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="gap-2">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    onClick={() => setIsEditing(true)} 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-2">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={handleShare} className="gap-2">
                        <Share2 className="w-4 h-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleCopyLink} className="gap-2">
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied!" : "Copy Link"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={handleDelete} 
                        className="gap-2 text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Document Info Card */}
        <Card className="mb-8 border-0 shadow-lg bg-background/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={document.author?.profileImage || ""} alt={document.author?.fullName || "User"} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-500 text-white font-semibold">
                    {document.author?.fullName ? document.author.fullName.split(' ').map(n => n[0]).join('').toUpperCase() : "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">{document.author?.fullName || "Unknown User"}</p>
                  <p className="text-slate-600">@{document.author?.username || "unknown"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge 
                  variant={document.isPublic ? "default" : "secondary"}
                  className={cn(
                    "gap-2 px-3 py-1",
                    document.isPublic 
                      ? "bg-green-100 text-green-800 hover:bg-green-200 border-green-200" 
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200"
                  )}
                >
                  {document.isPublic ? (
                    <><Globe className="w-3 h-3" /> Public</>
                  ) : (
                    <><Lock className="w-3 h-3" /> Private</>
                  )}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-slate-600">
                  <Eye className="w-4 h-4" />
                  <span>{document.isPublic ? "Anyone with link" : "Only you"}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Content */}
        <Card className="border-0 shadow-lg overflow-hidden bg-background/50">
          <CardHeader className="bg-accent/50 py-6 border-b">
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Document title..."
                  className="text-2xl font-bold border-0 bg-white shadow-sm focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-700">Visibility:</label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={editedIsPublic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditedIsPublic(true)}
                        className={cn(
                          "gap-2",
                          editedIsPublic && "bg-green-600 hover:bg-green-700"
                        )}
                      >
                        <Globe className="w-3 h-3" />
                        Public
                      </Button>
                      <Button
                        type="button"
                        variant={!editedIsPublic ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditedIsPublic(false)}
                        className={cn(
                          "gap-2",
                          !editedIsPublic && "bg-slate-600 hover:bg-slate-700"
                        )}
                      >
                        <Lock className="w-3 h-3" />
                        Private
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-3xl font-bold text-foreground mb-2">
                    {document.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Created {format(new Date(document.createdAt), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>Updated {format(new Date(document.updatedAt), "MMMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {isEditing ? (
              <div className="border-0">
                <RichTextEditor
                  value={editedContent}
                  onChange={setEditedContent}
                  placeholder="Start writing your document..."
                  className="border-0 rounded-none"
                />
              </div>
            ) : (
              <div className="prose prose-slate max-w-none p-8 prose-headings:font-semibold prose-headings:text-slate-900 prose-p:text-slate-700 prose-li:text-slate-700 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-code:text-slate-800 prose-pre:bg-slate-900 prose-pre:text-slate-100 prose-blockquote:border-l-slate-300 prose-blockquote:text-slate-600 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline">
                {document.content ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                  >
                    {document.content}
                  </ReactMarkdown>
                ) : (
                  <div className="text-center py-12 text-slate-500">
                    <p className="text-lg">No content yet</p>
                    <p className="text-sm mt-2">Click edit to start writing</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
