export type Category =
  | "handhelds"
  | "card-readers"
  | "input-devices"
  | "3d-printing"
  | "software-services"
  | "diy-kits";

export const CATEGORIES: { id: Category; label: string; icon: string; blurb: string }[] = [
  {
    id: "handhelds",
    label: "Handheld Consoles",
    icon: "lucide:gamepad-2",
    blurb: "Pocket consoles running SudoOS, preloaded and ready to play.",
  },
  {
    id: "card-readers",
    label: "Card Readers",
    icon: "lucide:credit-card",
    blurb: "RFID readers and the software to actually read and write cards.",
  },
  {
    id: "input-devices",
    label: "Input Devices",
    icon: "lucide:keyboard",
    blurb: "Macro keyboards, touch controllers and cyberdeck firmware.",
  },
  {
    id: "3d-printing",
    label: "3D Printed",
    icon: "lucide:printer",
    blurb: "Custom enclosures, stands and keycaps, designed and printed to order.",
  },
  {
    id: "software-services",
    label: "Software & Services",
    icon: "lucide:terminal",
    blurb: "Automation, setup, flashing and honest tech support.",
  },
  {
    id: "diy-kits",
    label: "DIY Build Kits",
    icon: "lucide:puzzle",
    blurb: "Pokémon-themed build kits — learn electronics, collect them all.",
  },
];

export const categoryLabel = (id: Category): string =>
  CATEGORIES.find((c) => c.id === id)?.label ?? id;

export const categoryIcon = (id: Category): string =>
  CATEGORIES.find((c) => c.id === id)?.icon ?? "lucide:box";

export const CATEGORY_PRIORITY: Record<Category, number> = {
  handhelds: 0,
  "diy-kits": 1,
  "card-readers": 2,
  "input-devices": 3,
  "3d-printing": 4,
  "software-services": 5,
};

export const sortByCategoryPriority = <T extends { data: { category: Category } }>(
  a: T,
  b: T
): number =>
  (CATEGORY_PRIORITY[a.data.category] ?? 99) - (CATEGORY_PRIORITY[b.data.category] ?? 99) ||
  a.data.title.localeCompare(b.data.title);
