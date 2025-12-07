import * as React from "react";
import {cva, type VariantProps} from "class-variance-authority";

import {cn} from "@/lib/utils";

const cardVariants = cva(
  "relative bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 text-card-foreground flex flex-col gap-6 rounded-2xl py-6 transition-all duration-500 overflow-hidden group",
  {
    variants: {
      variant: {
        default: "border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-2xl before:absolute before:inset-0 before:bg-gradient-to-br before:from-primary/5 before:via-transparent before:to-primary/10 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500 before:pointer-events-none",
        elevated: "border border-gray-200/50 dark:border-gray-700/50 shadow-xl hover:shadow-2xl backdrop-blur-sm",
        outlined: "border-2 border-gray-300 dark:border-gray-600 shadow-md hover:shadow-xl hover:border-primary/50",
      },
      hoverable: {
        true: "hover:shadow-2xl hover:-translate-y-2 cursor-pointer after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-gradient-to-r after:from-transparent after:via-primary/50 after:to-transparent after:opacity-0 hover:after:opacity-100 after:transition-opacity after:duration-500 after:pointer-events-none",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      hoverable: false,
    },
  }
);

interface CardProps extends React.ComponentProps<"div">, VariantProps<typeof cardVariants> {}

function Card({className, variant, hoverable, ...props}: CardProps) {
  return (
    <div data-slot="card" className={cn(cardVariants({variant, hoverable}), className)} {...props} />
  );
}

function CardHeader({className, ...props}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "relative z-10 @container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className
      )}
      {...props}
    />
  );
}

function CardTitle({className, ...props}: React.ComponentProps<"div">) {
  return <div data-slot="card-title" className={cn("leading-none font-semibold", className)} {...props} />;
}

function CardDescription({className, ...props}: React.ComponentProps<"div">) {
  return <div data-slot="card-description" className={cn("text-muted-foreground text-sm", className)} {...props} />;
}

function CardAction({className, ...props}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn("col-start-2 row-span-2 row-start-1 self-start justify-self-end", className)}
      {...props}
    />
  );
}

function CardContent({className, ...props}: React.ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("relative z-10 px-6", className)} {...props} />;
}

function CardFooter({className, ...props}: React.ComponentProps<"div">) {
  return (
    <div data-slot="card-footer" className={cn("flex items-center px-6 [.border-t]:pt-6", className)} {...props} />
  );
}

export {Card, CardHeader, CardFooter, CardTitle, CardAction, CardDescription, CardContent};
