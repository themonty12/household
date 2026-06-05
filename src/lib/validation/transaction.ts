import { z } from "zod";

const requiredId = z.string().trim().min(1);
const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const transactionBaseSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜는 YYYY-MM-DD 형식이어야 합니다."),
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
});

function validateTransactionRules(
  transaction: z.infer<typeof transactionBaseSchema>,
  context: z.RefinementCtx
) {
    if (transaction.type === "transfer") {
      if (!transaction.toAccountId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "이체 거래에는 받을 계좌가 필요합니다.",
          path: ["toAccountId"]
        });
      }

      if (transaction.toAccountId === transaction.accountId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "받을 계좌는 출금 계좌와 달라야 합니다.",
          path: ["toAccountId"]
        });
      }

      if (transaction.categoryId) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "이체 거래에는 카테고리를 지정할 수 없습니다.",
          path: ["categoryId"]
        });
      }

      return;
    }

    if (!transaction.categoryId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "이체가 아닌 거래에는 카테고리가 필요합니다.",
        path: ["categoryId"]
      });
    }

    if (transaction.toAccountId) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "받을 계좌는 이체 거래에만 지정할 수 있습니다.",
        path: ["toAccountId"]
      });
    }
}

export const transactionSchema = transactionBaseSchema.superRefine(validateTransactionRules);

export type TransactionFormValues = z.infer<typeof transactionSchema>;

export const transactionUpdateSchema = transactionBaseSchema
  .extend({
    id: requiredId
  })
  .superRefine(validateTransactionRules);

export type TransactionUpdateFormValues = z.infer<typeof transactionUpdateSchema>;
