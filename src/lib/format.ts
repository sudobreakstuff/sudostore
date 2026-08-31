export function formatPrice(value?: number, note?: string): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return `R${value.toLocaleString("en-ZA")}`;
  }
  return note ?? "Price on request";
}
