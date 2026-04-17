"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Plus, Search, FileText, Lock, Globe, User, LogIn, Loader2, Sparkles, Clock, MoreVertical, Trash2, Bookmark, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

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
    profileImage?: string | null;
  } | null;
}

export default function NotionPage() {
  const { user, isSignedIn } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isCreatingDocument, setIsCreatingDocument] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Id<"documents"> | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "new" | "saved" | "my-docs">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [savedDocuments, setSavedDocuments] = useState<Set<Id<"documents">>>(new Set());
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    showPublicOnly: false,
    showPrivateOnly: false,
    sortBy: 'updatedAt' as 'updatedAt' | 'createdAt' | 'title'
  });
  
  const documents = useQuery(api.documents.getDocuments, { 
    clerkUserId: isSignedIn && user ? user.id : undefined 
  });
  const createDocument = useMutation(api.documents.createDocument);
  const deleteDocument = useMutation(api.documents.deleteDocument);

  const isLoading = documents === undefined;

  // Get the current user's Convex ID from the documents data
  const currentUserConvexId = useMemo(() => {
    if (!user || !documents) return null;
    // Find a document where the author's clerkId matches the current user's clerkId
    const userDoc = documents.find(doc => 
      doc.author?.clerkId === user.id || 
      // Fallback: check if this user is the author of any document
      doc.authorId && documents.some(d => d.authorId === doc.authorId)
    );
    return userDoc?.authorId || null;
  }, [user, documents]);

  const filteredDocuments = useMemo(() => {
    if (!documents) return [];
    
    let filtered = documents.filter(doc => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;
      
      return (
        doc.title?.toLowerCase().includes(searchLower) ||
        doc.content?.toLowerCase().includes(searchLower) ||
        doc.author?.username?.toLowerCase().includes(searchLower)
      );
    });

    // Apply additional filters
    if (filterOptions.showPublicOnly) {
      filtered = filtered.filter(doc => doc.isPublic);
    }
    if (filterOptions.showPrivateOnly) {
      filtered = filtered.filter(doc => !doc.isPublic);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filterOptions.sortBy) {
        case 'createdAt':
          return b.createdAt - a.createdAt;
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        case 'updatedAt':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    // Apply category filters
    if (selectedCategory === "new") {
      // Sort by creation date and take last 6
      filtered = filtered
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 6);
    } else if (selectedCategory === "saved") {
      // Filter by saved documents
      filtered = filtered.filter(doc => savedDocuments.has(doc._id));
    } else if (selectedCategory === "my-docs") {
      // Filter by current user's documents (both private and public)
      if (currentUserConvexId) {
        filtered = filtered.filter(doc => doc.authorId === currentUserConvexId);
      } else {
        filtered = []; // No user logged in or no documents found, show empty
      }
    } else if (selectedCategory === "all") {
      // For "all" category, shuffle for random display and apply pagination
      const shuffled = [...filtered].sort(() => Math.random() - 0.5);
      const startIndex = (currentPage - 1) * 12;
      filtered = shuffled.slice(startIndex, startIndex + 12);
    }

    return filtered;
  }, [documents, searchQuery, selectedCategory, currentPage, savedDocuments, currentUserConvexId, filterOptions]);

  const totalPages = useMemo(() => {
    if (!documents || selectedCategory !== "all") return 1;
    const filteredCount = documents.filter(doc => {
      const searchLower = searchQuery.toLowerCase().trim();
      if (!searchLower) return true;
      return (
        doc.title?.toLowerCase().includes(searchLower) ||
        doc.content?.toLowerCase().includes(searchLower) ||
        doc.author?.username?.toLowerCase().includes(searchLower)
      );
    }).length;
    return Math.ceil(filteredCount / 12);
  }, [documents, searchQuery, selectedCategory]);

  const handleCreateDocument = async () => {
    if (!newTitle.trim()) {
      toast.error("Please enter a title");
      return;
    }

    if (!isSignedIn || !user) {
      toast.error("Please sign in to create documents");
      return;
    }

    setIsCreatingDocument(true);
    
    try {
      await createDocument({
        title: newTitle.trim(),
        content: "",
        isPublic: false,
        clerkUserId: user.id,
      });
      
      setNewTitle("");
      setIsDialogOpen(false);
      toast.success("Document created successfully!");
    } catch (error: any) {
      console.error("Error creating document:", error);
      if (error.message?.includes("User not found")) {
        toast.error("User account not found");
      } else {
        toast.error("Failed to create document");
      }
    } finally {
      setIsCreatingDocument(false);
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete || !user) return;
    
    try {
      await deleteDocument({
        documentId: documentToDelete,
        clerkUserId: user.id,
      });
      
      setDeleteConfirmOpen(false);
      setDocumentToDelete(null);
      toast.success("Document deleted successfully!");
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleSaveDocument = (docId: Id<"documents">) => {
    setSavedDocuments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(docId)) {
        newSet.delete(docId);
        toast.success("Document removed from saved!");
      } else {
        newSet.add(docId);
        toast.success("Document saved!");
      }
      return newSet;
    });
  };

  const handleCategoryChange = (category: "all" | "new" | "saved" | "my-docs") => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (key: keyof typeof filterOptions, value: any) => {
    setFilterOptions(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilterOptions({
      showPublicOnly: false,
      showPrivateOnly: false,
      sortBy: 'updatedAt'
    });
    toast.success("Filters cleared!");
  };

  const DocumentCard = ({ doc }: { doc: Document }) => (
    <Link href={`/notion/${doc._id}`}>
      <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 h-full">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/20 to-primary/10 dark:from-primary/5 dark:via-primary/10 dark:to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <CardHeader className="relative pb-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-semibold line-clamp-2 text-foreground group-hover:text-primary dark:group-hover:text-primary/90 transition-colors">
                {doc.title || "Untitled Document"}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge 
                variant={doc.isPublic ? "default" : "secondary"}
                className="text-xs px-2 py-1"
              >
                {doc.isPublic ? (
                  <Globe className="w-3 h-3 mr-1" />
                ) : (
                  <Lock className="w-3 h-3 mr-1" />
                )}
                {doc.isPublic ? "Public" : "Private"}
              </Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.preventDefault()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveDocument(doc._id);
                    }}
                    className={`flex items-center gap-2 ${savedDocuments.has(doc._id) ? 'text-green-600 dark:text-green-400' : ''}`}
                  >
                    <Bookmark className={`w-4 h-4 ${savedDocuments.has(doc._id) ? 'fill-current' : ''}`} />
                    {savedDocuments.has(doc._id) ? 'Saved' : 'Save'}
                  </DropdownMenuItem>
                  {user && doc.authorId === doc.author?._id && (
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        setDocumentToDelete(doc._id);
                        setDeleteConfirmOpen(true);
                      }}
                      className="flex items-center gap-2 text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="relative space-y-4">
          <div className="text-sm text-muted-foreground line-clamp-3 leading-relaxed prose prose-sm max-w-none dark:prose-invert">
            {doc.content ? (
              <ReactMarkdown
                components={{
                  h1: ({children}) => <h1 className="text-base font-semibold text-foreground mb-1">{children}</h1>,
                  h2: ({children}) => <h2 className="text-sm font-semibold text-foreground mb-1">{children}</h2>,
                  h3: ({children}) => <h3 className="text-sm font-medium text-foreground mb-1">{children}</h3>,
                  strong: ({children}) => <strong className="font-semibold text-foreground">{children}</strong>,
                  em: ({children}) => <em className="italic text-foreground">{children}</em>,
                  p: ({children}) => <p className="mb-1">{children}</p>,
                  ul: ({children}) => <ul className="list-disc list-inside mb-1">{children}</ul>,
                  ol: ({children}) => <ol className="list-decimal list-inside mb-1">{children}</ol>,
                  li: ({children}) => <li className="mb-0">{children}</li>,
                  code: ({children}) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                  blockquote: ({children}) => <blockquote className="border-l-2 border-muted-foreground/30 pl-2 italic text-muted-foreground">{children}</blockquote>,
                  a: ({href, children}) => <span className="text-blue-600 dark:text-blue-400 underline">{children}</span>,
                  // Handle HTML elements that might be in the content
                  div: ({children, className}) => <div className={className}>{children}</div>,
                  span: ({children, className}) => <span className={className}>{children}</span>,
                  br: () => <br />,
                  hr: () => <hr className="my-2 border-border" />,
                  img: ({src, alt, className}) => <img src={src} alt={alt} className={className} />,
                  table: ({children}) => <table className="min-w-full border-collapse">{children}</table>,
                  thead: ({children}) => <thead>{children}</thead>,
                  tbody: ({children}) => <tbody>{children}</tbody>,
                  tr: ({children}) => <tr className="border-b">{children}</tr>,
                  th: ({children}) => <th className="px-2 py-1 text-left font-medium">{children}</th>,
                  td: ({children}) => <td className="px-2 py-1">{children}</td>,
                  pre: ({children}) => <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{children}</pre>,
                }}
                remarkPlugins={[]}
                rehypePlugins={[]}
              >
                {doc.content}
              </ReactMarkdown>
            ) : (
              "Start writing to see your content here..."
            )}
          </div>
          
          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/80 dark:from-primary/90 dark:to-primary/70 flex items-center justify-center shadow-sm">
                  {doc.author?.profileImage ? (
                    <img 
                      src={doc.author.profileImage} 
                      alt={doc.author.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-foreground">
                    {doc.author?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {doc.author?.fullName}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{format(new Date(doc.updatedAt), "MMM d")}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-900 dark:via-slate-800 dark:to-emerald-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-primary to-primary/80 rounded-xl shadow-lg">
                  <FileText className="w-6 h-6 text-primary-foreground" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  Documents
                </h1>
              </div>
              <p className="text-lg text-muted-foreground ml-11">
                Create and manage your knowledge base
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {!isSignedIn ? (
                <Link href="/sign-in">
                  <Button 
                    size="lg" 
                    className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In
                  </Button>
                </Link>
              ) : (
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      size="lg"
                      className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      New Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="w-8 h-8 text-primary mb-4" />
                        Create New Document
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Document Title</Label>
                        <Input
                          id="title"
                          placeholder="Enter document title..."
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && handleCreateDocument()}
                          autoFocus
                          className="text-base"
                        />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={handleCreateDocument} 
                          disabled={isCreatingDocument}
                          className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                        >
                          {isCreatingDocument ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            "Create Document"
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsDialogOpen(false);
                            setNewTitle("");
                          }}
                          disabled={isCreatingDocument}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>

        {/* Category Buttons */}
        <div className="mb-8">
          <div className="flex gap-2 p-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-200 dark:border-slate-700">
            <Button
              variant={selectedCategory === "all" ? "default" : "ghost"}
              onClick={() => handleCategoryChange("all")}
              className="flex-1"
            >
              All
            </Button>
            <Button
              variant={selectedCategory === "new" ? "default" : "ghost"}
              onClick={() => handleCategoryChange("new")}
              className="flex-1"
            >
              New
            </Button>
            <Button
              variant={selectedCategory === "saved" ? "default" : "ghost"}
              onClick={() => handleCategoryChange("saved")}
              className="flex-1"
            >
              Saved
            </Button>
            <Button
              variant={selectedCategory === "my-docs" ? "default" : "ghost"}
              onClick={() => handleCategoryChange("my-docs")}
              className="flex-1"
            >
              My docs
            </Button>
          </div>
        </div>

        {/* Search Bar with Filter */}
        <div className="relative mb-8">
          <div className="flex gap-2">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Search documents by title, content, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-base bg-white/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* Filter Button */}
            <DropdownMenu open={showFilterMenu} onOpenChange={setShowFilterMenu}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="default"
                  className="px-4 py-3 bg-white/50 backdrop-blur-sm border-slate-200 dark:border-slate-700 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all duration-200"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                  {(filterOptions.showPublicOnly || filterOptions.showPrivateOnly || filterOptions.sortBy !== 'updatedAt') && (
                    <div className="w-2 h-2 bg-primary rounded-full ml-2" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Sort by</div>
                  <div className="space-y-1">
                    <DropdownMenuItem
                      onClick={() => handleFilterChange('sortBy', 'updatedAt')}
                      className={filterOptions.sortBy === 'updatedAt' ? 'bg-accent' : ''}
                    >
                      Last Updated
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange('sortBy', 'createdAt')}
                      className={filterOptions.sortBy === 'createdAt' ? 'bg-accent' : ''}
                    >
                      Date Created
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange('sortBy', 'title')}
                      className={filterOptions.sortBy === 'title' ? 'bg-accent' : ''}
                    >
                      Title (A-Z)
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="text-sm font-medium mb-2 mt-4">Visibility</div>
                  <div className="space-y-1">
                    <DropdownMenuItem
                      onClick={() => handleFilterChange('showPublicOnly', !filterOptions.showPublicOnly)}
                      className={filterOptions.showPublicOnly ? 'bg-accent' : ''}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Public Only
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleFilterChange('showPrivateOnly', !filterOptions.showPrivateOnly)}
                      className={filterOptions.showPrivateOnly ? 'bg-accent' : ''}
                    >
                      <Lock className="w-4 h-4 mr-2" />
                      Private Only
                    </DropdownMenuItem>
                  </div>
                  
                  <div className="pt-2 mt-2 border-t">
                    <DropdownMenuItem
                      onClick={clearFilters}
                      className="text-destructive"
                    >
                      Clear Filters
                    </DropdownMenuItem>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Documents Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Loading your documents...</p>
          </div>
        ) : filteredDocuments && filteredDocuments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => (
              <DocumentCard key={doc._id} doc={doc} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-primary/10 dark:from-primary/15 dark:to-primary/8 rounded-full flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">
              {selectedCategory === "my-docs" && (!currentUserConvexId || !documents || documents.filter(doc => doc.authorId === currentUserConvexId).length === 0)
                ? "No documents yet"
                : selectedCategory === "saved" && savedDocuments.size === 0
                ? "No saved documents"
                : selectedCategory === "new" && (!documents || documents.length === 0)
                ? "No new documents"
                : searchQuery
                ? "No documents found"
                : "No documents yet"
              }
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {selectedCategory === "my-docs" && (!currentUserConvexId || !documents || documents.filter(doc => doc.authorId === currentUserConvexId).length === 0)
                ? user ? "Create your first document to see it here." : "Sign in to see your documents."
                : selectedCategory === "saved" && savedDocuments.size === 0
                ? "Start saving documents to see them here."
                : selectedCategory === "new" && (!documents || documents.length === 0)
                ? "Create some documents to see the newest ones."
                : searchQuery
                ? "Try adjusting your search terms or create a new document to get started."
                : "Create your first document to start building your knowledge base."
              }
            </p>
            {!isSignedIn && (
              <Link href="/sign-in">
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In to Get Started
                </Button>
              </Link>
            )}
          </div>
        )}

        {/* Pagination for All category */}
        {selectedCategory === "all" && filteredDocuments && filteredDocuments.length > 0 && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your document
              and remove all of its data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
