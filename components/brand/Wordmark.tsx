import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";

type WordmarkProps = {
  variant?: "header" | "footer";
};

export function Wordmark({ variant = "header" }: WordmarkProps) {
  const isHeader = variant === "header";

  return (
    <Link
      className={cn(
        "group inline-flex focus:outline-none focus-visible:shadow-focus",
        isHeader ? "rounded-full" : "rounded-3xl",
      )}
      href="/#inicio"
    >
      <Image
        alt="SolutiogeniZ"
        className={cn(
          "w-auto transition group-hover:opacity-90",
          isHeader ? "h-9 sm:h-10" : "h-12 md:h-14",
        )}
        height={92}
        priority
        src="/solutiogeniz-lockup-dark.svg"
        width={544}
      />
    </Link>
  );
}
