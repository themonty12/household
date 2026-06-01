import { z } from "zod";

function normalizeBudgetMonth(month: string) {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(month);

  if (!match) {
    throw new Error("월은 YYYY-MM 또는 YYYY-MM-DD 형식이어야 합니다.");
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const date = new Date(Date.UTC(year, monthIndex, 1));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== monthIndex) {
    throw new Error("올바른 월을 입력해 주세요.");
  }

  return date.toISOString().slice(0, 10);
}

const optionalId = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined));

const requiredName = z.string().trim().min(1, "이름을 입력해 주세요.").max(80);

export const accountTypeSchema = z.enum([
  "cash",
  "bank",
  "card",
  "investment",
  "loan",
  "other_asset",
  "other_liability"
]);

export const categoryTypeSchema = z.enum(["income", "expense", "transfer"]);
export const recordStatusSchema = z.enum(["active", "archived"]);

export const accountSettingsSchema = z.object({
  id: optionalId,
  name: requiredName,
  type: accountTypeSchema,
  currentBalance: z.coerce.number(),
  includeInNetWorth: z
    .union([z.literal("on"), z.literal("true"), z.literal("false")])
    .optional()
    .transform((value) => value === "on" || value === "true"),
  status: recordStatusSchema.default("active")
});

export const categorySettingsSchema = z.object({
  id: optionalId,
  name: requiredName,
  type: categoryTypeSchema,
  parentCategoryId: optionalId,
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status: recordStatusSchema.default("active")
});

export const budgetSettingsSchema = z.object({
  id: optionalId,
  month: z
    .string()
    .trim()
    .min(1)
    .transform((month) => normalizeBudgetMonth(month)),
  categoryId: z.string().trim().min(1),
  amount: z.coerce.number().min(0)
});

export type AccountSettingsFormValues = z.infer<typeof accountSettingsSchema>;
export type CategorySettingsFormValues = z.infer<typeof categorySettingsSchema>;
export type BudgetSettingsFormValues = z.infer<typeof budgetSettingsSchema>;
