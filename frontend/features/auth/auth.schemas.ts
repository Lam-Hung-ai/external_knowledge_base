import * as z from "zod";
export const loginSchema = z.object({
  email: z.email(),
  password: z
    .string()
    .min(8, "The password must be more than 8 characters long."),
});
export type loginType = z.infer<typeof loginSchema>;
