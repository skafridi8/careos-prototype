// Central lookup maps for the "brand / sage / amber / rose" palette.
// Tailwind's scanner needs literal class strings, so we look them up rather
// than building them with template interpolation.

export const badgeClasses = {
  brand: "bg-brand-100 text-brand-700",
  sage: "bg-sage-100 text-sage-700",
  amber: "bg-amber-100 text-amber-600",
  rose: "bg-rose-100 text-rose-500",
};

export const avatarClasses = {
  brand: "bg-brand-500 text-white",
  sage: "bg-sage-500 text-white",
  amber: "bg-amber-400 text-white",
  rose: "bg-rose-400 text-white",
};

export const dotClasses = {
  brand: "bg-brand-500",
  sage: "bg-sage-500",
  amber: "bg-amber-400",
  rose: "bg-rose-400",
};

export const statCardClasses = {
  brand: "text-brand-700",
  sage: "text-sage-700",
  amber: "text-amber-600",
  rose: "text-rose-500",
};

export const softBgClasses = {
  brand: "bg-brand-50",
  sage: "bg-sage-50",
  amber: "bg-amber-50",
  rose: "bg-rose-50",
};

export const borderClasses = {
  brand: "border-brand-200",
  sage: "border-sage-200",
  amber: "border-amber-200",
  rose: "border-rose-200",
};
