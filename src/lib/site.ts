export const BASE = import.meta.env.BASE_URL;

export const SITE = {
  name: "sudostore",
  tagline: "Cool tech. Fair prices. Open source.",
  description:
    "Handheld consoles, card readers, custom hardware, 3D-printed gear and software — built in South Africa, sold at honest prices.",
  url: "https://sudostore.co.za",
  email: "shahidsingh1zn@gmail.com",
  location: "South Africa",
  github: "https://github.com/sudobreakstuff",
  portfolio: "https://sudobreakstuff.github.io",
  whatsappDisplay: "+27 65 822 4618",
};

const WHATSAPP_NUMBER = "27658224618";

export function waLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function orderLink(product: string): string {
  return waLink(`Hi! I'd like to order: ${product}. Please send me more info.`);
}

export function contactLink(): string {
  return waLink(`Hi! I have a question about sudostore.`);
}
