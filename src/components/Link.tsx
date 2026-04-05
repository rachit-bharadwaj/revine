import type { ReactNode } from "react";
import {
  Link as RouterLink,
  type LinkProps as RouterLinkProps,
} from "react-router-dom";

export interface LinkProps extends Omit<RouterLinkProps, "to"> {
  href: string;
  children?: ReactNode;
}

export function Link({ href, children, ...rest }: LinkProps) {
  return (
    <RouterLink to={href} {...rest}>
      {children}
    </RouterLink>
  );
}
