import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { FontProvider, FontFamily } from "@/components/font-provider";
import { Noto_Sans, Outfit, Roboto_Slab, JetBrains_Mono, Inter } from "next/font/google";
import { cookies } from "next/headers";
import "../globals.css";

const notoSans = Noto_Sans({ subsets: ['latin'], variable: '--font-sans', weight: ['400', '500', '600', '700'] });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-geometric', weight: ['400', '500', '600', '700'] });
const robotoSlab = Roboto_Slab({ subsets: ['latin'], variable: '--font-slab', weight: ['400', '500', '600', '700'] });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono', weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-bold-heading', weight: ['400', '500', '600', '700', '800', '900'] });

const fontClassMap: Record<FontFamily, string> = {
  geometric: "font-geometric",
  slab: "font-slab",
  mono: "font-mono",
  bold: "font-bold-heading",
  default: "font-sans",
};

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const fontCookie = cookieStore.get("egelion-font")?.value as FontFamily | undefined;
  const activeFont = fontCookie && fontClassMap[fontCookie] ? fontCookie : "default";
  const fontClass = fontClassMap[activeFont];

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning className={fontClass}>
        <body className={`${notoSans.variable} ${outfit.variable} ${robotoSlab.variable} ${jetbrainsMono.variable} ${inter.variable} font-sans`}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <FontProvider initialFont={activeFont}>
              <ConvexClientProvider>
                {children}
              </ConvexClientProvider>
            </FontProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
