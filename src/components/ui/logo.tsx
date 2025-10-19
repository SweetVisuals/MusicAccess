import * as React from "react";
import { Volume2, AudioWaveform } from "lucide-react";
import { cn } from "@/lib/utils";
import logoImage from "@/img/MUSIC ACCESS LOGO WHITE.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  variant?: "default" | "minimal";
}

export function Logo({
  className,
  showText = true,
  size = "xl",
  variant = "default",
}: LogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
    xl: "h-20 w-20",
    "2xl": "h-24 w-24",
  };

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-xl",
    xl: "text-2xl",
    "2xl": "text-2xl",
  };

  return (
    <div className={cn("flex items-center", className)}>
      <img
        src={logoImage}
        alt="Music Access Logo"
        className="w-[150px] h-[50px]"
      />
    </div>
  );
}
