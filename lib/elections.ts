import states from "@/data/states-2027.json";

export type ElectionState = {
  slug: string;
  name: string;
  seats: number;
  wave: string;
  status: "expected";
  pollDate: null;
};

// Planning data is not an official ECI poll notification. Treat official updates separately.
export const states2027 = states as ElectionState[];

export const seatTotal2027 = states2027.reduce((total, state) => total + state.seats, 0);

export function getStateBySlug(slug: string): ElectionState | undefined {
  return states2027.find((state) => state.slug === slug);
}

export const officialReferences = [
  { label: "ECI — Election Commission of India", href: "https://www.eci.gov.in/" },
  { label: "ECI — Terms of the Houses", href: "https://www.eci.gov.in/term-of-the-houses/" },
  { label: "ECI — Election Results", href: "https://results.eci.gov.in/" },
  { label: "ECI — Voter Services", href: "https://voters.eci.gov.in/" },
] as const;
