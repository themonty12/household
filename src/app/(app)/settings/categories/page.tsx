import Link from "next/link";
import { ArrowLeft, ChevronDown, Plus, Tags } from "lucide-react";

import { saveCategory } from "@/app/actions/settings";
import { requireAdmin } from "@/lib/auth/require-user";
import { categoryTypeLabel, recordStatusLabel } from "@/lib/domain/labels";
import { getSettingsData } from "@/lib/repositories/finance";
import type { SettingsCategory } from "@/lib/repositories/finance";

const categoryTypes = ["expense", "income", "transfer"] as const;
const recordStatuses = ["active", "archived"] as const;

function currentMonthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function CategoriesSettingsPage() {
  const { profile, supabase } = await requireAdmin();
  const { categories } = await getSettingsData(
    supabase,
    profile.household_id,
    currentMonthStart()
  );
  const rootCategories = categories.filter((category) => category.parent_category_id === null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/settings" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-ink/50 hover:text-ink">
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            설정
          </Link>
          <h1 className="page-title">카테고리 상세 관리</h1>
          <p className="mt-1 text-sm leading-6 text-ink/55">
            대분류를 만들고 각 대분류 안에서 소분류를 관리합니다.
          </p>
        </div>
      </div>

      <details className="panel group overflow-hidden" open>
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-leaf text-white">
              <Plus aria-hidden="true" className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-bold text-ink">대분류 추가</span>
              <span className="mt-0.5 block text-xs text-ink/45">새 최상위 카테고리를 만듭니다.</span>
            </span>
          </div>
          <ChevronDown aria-hidden="true" className="h-4 w-4 text-ink/40 transition group-open:rotate-180" />
        </summary>
        <CategoryEditor />
      </details>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title">대분류 및 소분류 관리</h2>
          <span className="text-xs font-semibold text-ink/40">{rootCategories.length}개 대분류</span>
        </div>

        {rootCategories.length === 0 ? (
          <div className="panel p-5 text-sm text-ink/55">저장된 대분류가 없습니다.</div>
        ) : (
          <div className="grid gap-3">
            {rootCategories.map((root) => {
              const children = categories.filter(
                (category) => category.parent_category_id === root.id
              );

              return (
                <details key={root.id} className="panel group overflow-hidden">
                  <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-paper text-info">
                        <Tags aria-hidden="true" className="h-4 w-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-ink">{root.name}</span>
                        <span className="mt-0.5 block text-xs text-ink/45">
                          {categoryTypeLabel(root.type)} · {recordStatusLabel(root.status)} · 소분류 {children.length}개
                        </span>
                      </span>
                    </div>
                    <ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 text-ink/40 transition group-open:rotate-180" />
                  </summary>

                  <div className="space-y-4 border-t border-line bg-paper/45 p-4">
                    <CategoryEditor category={root} />

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-ink/50">소분류 목록</p>
                      {children.map((child) => (
                        <details key={child.id} className="rounded-md border border-line bg-white group/child">
                          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2">
                            <span className="text-sm font-bold text-ink">{child.name}</span>
                            <span className="flex items-center gap-2 text-xs text-ink/40">
                              {recordStatusLabel(child.status)}
                              <ChevronDown aria-hidden="true" className="h-4 w-4 transition group-open/child:rotate-180" />
                            </span>
                          </summary>
                          <div className="border-t border-line p-3">
                            <CategoryEditor category={child} parent={root} />
                          </div>
                        </details>
                      ))}
                    </div>

                    <details className="rounded-md border border-dashed border-line bg-white group/child">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-bold text-info">
                        <Plus aria-hidden="true" className="h-4 w-4" />
                        소분류 추가
                      </summary>
                      <div className="border-t border-line p-3">
                        <CategoryEditor parent={root} />
                      </div>
                    </details>
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryEditor({
  category,
  parent
}: {
  category?: SettingsCategory;
  parent?: SettingsCategory;
}) {
  const isChild = Boolean(parent);

  return (
    <form action={saveCategory} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {category ? <input name="id" type="hidden" value={category.id} /> : null}
      {parent ? <input name="parentCategoryId" type="hidden" value={parent.id} /> : null}
      {parent ? <input name="type" type="hidden" value={parent.type} /> : null}

      <label className="field-label">
        {isChild ? "소분류명" : "대분류명"}
        <input className="field-control bg-white" defaultValue={category?.name} maxLength={80} name="name" required />
      </label>

      {!parent ? (
        <label className="field-label">
          유형
          <select className="field-control bg-white" defaultValue={category?.type ?? "expense"} name="type">
            {categoryTypes.map((type) => (
              <option key={type} value={type}>{categoryTypeLabel(type)}</option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="field-label">
        정렬 순서
        <input className="field-control bg-white" defaultValue={category?.sort_order ?? 0} min="0" name="sortOrder" type="number" />
      </label>

      <label className="field-label">
        상태
        <select className="field-control bg-white" defaultValue={category?.status ?? "active"} name="status">
          {recordStatuses.map((status) => (
            <option key={status} value={status}>{recordStatusLabel(status)}</option>
          ))}
        </select>
      </label>

      <button className="button-primary self-end sm:col-span-2 xl:col-span-3" type="submit">
        저장
      </button>
    </form>
  );
}
