"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Frown, Home, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import './globals.css'

import { Noto_Sans, Outfit, Roboto_Slab, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-geometric', weight: ['400', '500', '600', '700'] });
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-slab', weight: ['400', '500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-bold-heading', weight: ['400', '500', '600', '700', '800', '900'] });


export default function NotFound() {
  return (
    <div className={`min-h-screen bg-background flex flex-col items-center justify-center px-4 ${notoSans.variable} ${outfit.variable} ${robotoSlab.variable} ${jetbrainsMono.variable} ${inter.variable} font-sans`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="text-center max-w-lg"
      >
        {/* Animated 404 Number */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="relative mb-8"
        >
          <span className="text-[8rem] font-sans sm:text-[10rem] font-bold leading-none tracking-tighter bg-gradient-to-br from-primary via-primary/80 to-muted-foreground bg-clip-text text-transparent select-none">
            404
          </span>
          
          {/* Floating Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
            className="absolute -top-2 -right-2 sm:top-0 sm:right-0"
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-muted flex items-center justify-center shadow-lg border border-border/50">
              <Frown className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
            </div>
          </motion.div>
        </motion.div>

        {/* Text Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
            Page not found
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg mb-8 max-w-md mx-auto">
            Sorry, we couldn&apos;t find the page you&apos;re looking for. It might have been moved, deleted, or never existed.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link href="/">
              <Button size="lg" className="rounded-full px-6">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full px-6"
              onClick={() => typeof window !== "undefined" && window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go back
            </Button>
          </div>
        </motion.div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="mt-12 flex justify-center gap-2"
        >
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                y: [0, -8, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ 
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-2 h-2 rounded-full bg-primary/40"
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
