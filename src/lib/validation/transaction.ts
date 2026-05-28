import { z } from "zod";

const requiredId = z.string().trim().min(1);
const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

export const transactionSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format."),
    type: z.enum(["income", "expense", "transfer", "adjustment"]),
    amount: z.coerce.number().positive(),
    accountId: requiredId,
    toAccountId: optionalId,
    categoryId: optionalId,
    memo: z
      .string()
      .trim()
      .max(240)
      .optional()
      .default("")
  })
  .superRefine((transaction, context) => {
    if (transaction.type === "transfer") {
      if (!transaction.toAccountId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transfer transactions require a destination account.",
          path: ["toAccountId"]
        });
      }

      return;
    }

    if (!transaction.categoryId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is required for non-transfer transactions.",
        path: ["categoryId"]
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
