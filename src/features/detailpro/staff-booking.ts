import { z } from "zod";
export const STAFF_LOCATIONS = ["Unidade Centro", "Unidade Zona Sul", "Atendimento em domicílio"] as const;
export const STAFF_TIMES = ["08:00", "09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"] as const;
export const staffBookingSchema = z.object({
  service: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.enum(STAFF_TIMES),
  location: z.enum(STAFF_LOCATIONS),
  name: z.string().trim().min(2).max(100),
  phone: z.string().max(25).regex(/^[0-9 ()+.\-]*$/).optional(),
  plate: z.string().regex(/^([A-Z]{3}[0-9][A-Z][0-9]{2})?$/).optional(),
  model: z.string().trim().max(60).optional(),
});
export type StaffBookingInput = z.infer<typeof staffBookingSchema>;