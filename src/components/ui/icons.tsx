import type { SVGProps } from "react";

/** Small stroke icons (24 px grid) that take the current text color. Decorative by default. */
function Icon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-5 shrink-0"
      {...props}
    >
      {children}
    </svg>
  );
}

type IconProps = SVGProps<SVGSVGElement>;

export const BagIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 7h12l1 13H5L6 7Z" />
    <path d="M9 7a3 3 0 0 1 6 0" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Icon>
);

export const TruckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M3 6h11v10H3zM14 10h4l3 3v3h-7" />
    <circle cx="7" cy="17.5" r="1.5" />
    <circle cx="17" cy="17.5" r="1.5" />
  </Icon>
);

export const GiftIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13" />
    <path d="M12 7c-1.5-3-5-3-5-1s3 1 5 1c2 0 5 1 5-1s-3.5-2-5 1Z" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12 4.5 4.5L19 7" />
  </Icon>
);

export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Icon>
);

export const ChevronDownIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);

export const ArrowRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Icon>
);

export const ClockIcon = (props: IconProps) => (
  <Icon {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Icon>
);

export const MinusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M5 12h14" />
  </Icon>
);

export const PlusIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
