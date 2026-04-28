import { ref, computed } from 'vue'
import type { PaginationMeta } from '@/types'

export function usePagination(limit = 15) {
  const currentPage = ref(1)
  const pagination = ref<PaginationMeta | null>(null)
  const PAGE_LIMIT = limit

  const pageNumbers = computed<(number | string)[]>(() => {
    if (!pagination.value) return []
    const total = pagination.value.totalPages
    const cur = currentPage.value
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const pages: (number | string)[] = [1]
    if (cur > 3) pages.push('...')
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
    if (cur < total - 2) pages.push('...')
    pages.push(total)
    return pages
  })

  return { currentPage, pagination, pageNumbers, PAGE_LIMIT }
}
