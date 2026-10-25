import type { Service } from "../types/service";

export const services: Service[] = [
  { id: "oil-change", name: "Oil Change", description: "Full synthetic oil and filter replacement to keep your engine running smoothly.", price: 89, durationMin: 45, category: "Maintenance" },
  { id: "brake-inspection", name: "Brake Inspection", description: "Complete brake system check: pads, rotors, fluid, and lines.", price: 49, durationMin: 30, category: "Inspection" },
  { id: "brake-replacement", name: "Brake Replacement", description: "Pad and rotor replacement with a full safety check.", price: 249, durationMin: 90, category: "Repair" },
  { id: "tire-rotation", name: "Tire Rotation", description: "Extend tire life and even out wear across all four wheels.", price: 39, durationMin: 30, category: "Maintenance" },
  { id: "tire-replacement", name: "Tire Replacement", description: "New tire installation, balancing, and disposal of old tires.", price: 99, durationMin: 45, category: "Repair" },
  { id: "wheel-alignment", name: "Wheel Alignment", description: "Precision alignment to improve handling and tire wear.", price: 99, durationMin: 60, category: "Maintenance" },
  { id: "battery-service", name: "Battery Service", description: "Battery testing, charging, and replacement if needed.", price: 59, durationMin: 30, category: "Repair" },
  { id: "engine-diagnostics", name: "Engine Diagnostics", description: "Computer diagnostic scan to identify warning lights and issues.", price: 79, durationMin: 45, category: "Inspection" },
  { id: "ac-service", name: "AC Service", description: "AC system check, recharge, and leak inspection.", price: 119, durationMin: 60, category: "Maintenance" },
  { id: "transmission-service", name: "Transmission Service", description: "Fluid change and full transmission system inspection.", price: 189, durationMin: 90, category: "Maintenance" },
  { id: "full-inspection", name: "Full Vehicle Inspection", description: "Comprehensive multi-point inspection of your entire vehicle.", price: 149, durationMin: 90, category: "Inspection" },
  { id: "detailing", name: "Detailing", description: "Interior and exterior detailing to restore that showroom shine.", price: 149, durationMin: 120, category: "Other" },
  { id: "other", name: "Other", description: "Not sure what you need? Tell us what is going on and we will take a look.", price: 0, durationMin: 30, category: "Other" },
];
