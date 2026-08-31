export function formatPrice(value?: number, note?: string): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    const grouped = Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `R${grouped}`;
  }
  return note ?? "Price on request";
}
