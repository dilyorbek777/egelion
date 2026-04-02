"use client";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useUploadThing } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLoading } from "@/components/loading";
import { Label } from "@/components/ui/label";

export default function ProfileCompletePage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { startUpload } = useUploadThing("profileImage");

  const completeProfile = useMutation(api.users.completeProfile);
  const checkAvailability = useQuery(api.users.checkUsernameAvailability, suggestions.length > 0 ? { usernames: suggestions } : "skip");
  const dbUser = useQuery(
    api.users.getByClerkId,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Redirect if profile already complete
  useEffect(() => {
    if (dbUser?.isProfileComplete) router.replace("/");
  }, [dbUser, router]);

  // Pre-fill from Clerk
  useEffect(() => {
    if (user) {
      setFullName(user.fullName ?? "");
      setUsername(user.username ?? "");
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const generateSuggestions = (baseName: string) => {
    const base = baseName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    const suffixes = ['123', '2024', '_dev', '_official', 'real', 'the', '', '_1', '_2', '_3'];
    return suffixes.map(suffix => base + suffix).filter(name => name.length >= 3 && name.length <= 20);
  };

  const handleUsernameFocus = () => {
    if (!username && fullName.trim()) {
      const newSuggestions = generateSuggestions(fullName);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const selectSuggestion = (suggestion: string) => {
    setUsername(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSuggestions && suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSuggestions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!username.trim()) return setError("Username is required");
    if (!fullName.trim()) return setError("Full name is required");
    if (!/^[a-z0-9_]{3,20}$/.test(username))
      return setError("Username: 3-20 chars, lowercase letters, numbers, underscores only");

    setLoading(true);
    setError("");

    try {
      let profileImage: string | undefined;
      if (imageFile) {
        const res = await startUpload([imageFile]);
        profileImage = res?.[0]?.ufsUrl;
      }

      await completeProfile({
        clerkId: user.id,
        username: username.toLowerCase(),
        fullName,
        profileImage,
      });

      router.replace("/");
    } catch (err: any) {
      setError(err.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) return <PageLoading text="Loading..." />;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Complete your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            This info is shown publicly on your profile.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Profile image */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-muted border">
              {preview ? (
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Photo
                </div>
              )}
            </div>
            <Label
              htmlFor="image"
              className="cursor-pointer text-sm text-primary underline"
            >
              {preview ? "Change photo" : "Add profile photo (optional)"}
            </Label>
            <input
              id="image"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          {/* Full name */}
          <div className="space-y-1">
            <Label htmlFor="fullName">Full name *</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              required
            />
          </div>

          {/* Username */}
          <div className="space-y-1 relative">
            <Label htmlFor="username">Username *</Label>
            <Input
              id="username"
              value={username}
              onChange={handleUsernameChange}
              onFocus={handleUsernameFocus}
              placeholder="janedoe"
              required
            />
            <p className="text-xs text-muted-foreground">
              3–20 chars, lowercase letters, numbers, underscores
            </p>
            
            {/* Suggestions dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-40 overflow-y-auto"
              >
                {!checkAvailability ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Checking availability...</div>
                ) : (
                  checkAvailability.map(({ username: suggestion, available }) => (
                    <div
                      key={suggestion}
                      onClick={() => available && selectSuggestion(suggestion)}
                      className={`px-3 py-2 cursor-pointer hover:bg-muted text-sm ${
                        !available ? 'text-muted-foreground cursor-not-allowed' : ''
                      }`}
                    >
                      {suggestion}
                      {!available && <span className="ml-2 text-xs">(taken)</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}