export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMin: number;
  category: "Maintenance" | "Repair" | "Inspection" | "Other";
}
