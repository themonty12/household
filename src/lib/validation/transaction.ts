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

      if (transaction.toAccountId === transaction.accountId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transfer destination must be different from the source account.",
          path: ["toAccountId"]
        });
      }

      if (transaction.categoryId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Transfer transactions cannot include a category.",
          path: ["categoryId"]
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

    if (transaction.toAccountId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Only transfer transactions can include a destination account.",
        path: ["toAccountId"]
      });
    }
  });

export type TransactionFormValues = z.infer<typeof transactionSchema>;
