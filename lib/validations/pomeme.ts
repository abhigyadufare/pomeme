import * as z from "zod";

export const PomemeValidation = z.object({
  pomeme: z.string().nonempty().min(3, { message: "Minimum 3 characters" }),
  accountId: z.string(),
});

export const CommentValidation = z.object({
  pomeme: z.string().nonempty().min(3, { message: "Minimum 3 characters" }),
});
