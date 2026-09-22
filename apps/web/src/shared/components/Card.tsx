import type { ElementType, ComponentPropsWithoutRef } from "react";

type CardProps<T extends ElementType> = { as?: T; className?: string } & Omit<
  ComponentPropsWithoutRef<T>,
  "as" | "className"
>;

export function Card<T extends ElementType = "div">({ as, className, ...rest }: CardProps<T>) {
  const Component = as ?? "div";
  return <Component className={`rounded-2xl bg-white shadow-sm ${className ?? ""}`} {...rest} />;
}
