"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MessageSquareX, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function ConversationNotFound() {
  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
          <MessageSquareX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">
          Conversation not found
        </h1>
        <p className="text-muted-foreground mb-6">
          This conversation may have been deleted or you don&apos;t have access to it.
        </p>
        <Link href="/messages">
          <Button className="rounded-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to messages
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
