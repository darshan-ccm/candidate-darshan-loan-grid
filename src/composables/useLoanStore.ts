import { ref, shallowRef, computed, readonly } from 'vue'
import type { FilterState, Loan, PaginationState, SortState } from '../types'
import { filterLoans, getCacheKey, sortLoans } from '../utils'


// Global state
const allLoans = shallowRef<Loan[]>([])
const loadedLoans = shallowRef<Loan[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)

// Filter and sort state
const sortState = ref<SortState>({
    column: null,
    direction: 'none'
})

const filterState = ref<FilterState>({
    search: '',
    status: 'All',
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined
})

const paginationState = ref<PaginationState>({
    pageSize: 25,
    currentPage: 0,
    totalPages: 0,
    loadedRowsCount: 0
})

// Memoization cache for expensive operations
const resultCache = new Map<string, Loan[]>()

export function useLoanStore() {
    // Computed values with memoization
    const filteredAndSortedLoans = computed(() => {
        const cacheKey = getCacheKey(
            filterState.value,
            sortState.value.column,
            sortState.value.direction
        )

        if (resultCache.has(cacheKey)) {
            return resultCache.get(cacheKey)!
        }

        // Apply filters first
        const filtered = filterLoans(allLoans.value, filterState.value)

        // Then apply sorting
        const sorted = sortLoans(
            filtered,
            sortState.value.column,
            sortState.value.direction
        )

        // Cache result (clear cache if it gets too large)
        if (resultCache.size > 100) {
            resultCache.clear()
        }
        resultCache.set(cacheKey, sorted)

        return sorted
    })

    const totalFilteredCount = computed(() => filteredAndSortedLoans.value.length)

    const hasMoreData = computed(() =>
        loadedLoans.value.length < filteredAndSortedLoans.value.length
    )

    // Actions
    async function loadInitialData(dataUrl = '/data/loans.json') {
        try {
            isLoading.value = true
            error.value = null

            const response = await fetch(dataUrl)
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.statusText}`)
            }

            const data = await response.json()

            // Use shallowRef for large arrays to avoid deep reactivity overhead
            allLoans.value = data

            // Load initial page
            loadNextPage()

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load data'
            console.error('Error loading loan data:', err)
        } finally {
            isLoading.value = false
        }
    }

    function loadNextPage() {
        const { pageSize, currentPage } = paginationState.value
        const startIndex = currentPage * pageSize
        const endIndex = startIndex + pageSize

        const nextPageData = filteredAndSortedLoans.value.slice(startIndex, endIndex)

        if (nextPageData.length > 0) {
            // For initial load, replace; for subsequent loads, append
            if (currentPage === 0) {
                loadedLoans.value = nextPageData
            } else {
                loadedLoans.value = [...loadedLoans.value, ...nextPageData]
            }

            paginationState.value.currentPage++
            paginationState.value.loadedRowsCount = loadedLoans.value.length

            // Update total pages
            paginationState.value.totalPages = Math.ceil(
                filteredAndSortedLoans.value.length / pageSize
            )
        }
    }

    function setPageSize(newPageSize: number) {
        // Clear cache when changing page size
        resultCache.clear()

        paginationState.value.pageSize = newPageSize
        paginationState.value.currentPage = 0
        paginationState.value.loadedRowsCount = 0

        // Reload data with new page size
        const startIndex = 0
        const endIndex = newPageSize
        loadedLoans.value = filteredAndSortedLoans.value.slice(startIndex, endIndex)

        paginationState.value.currentPage = 1
        paginationState.value.loadedRowsCount = loadedLoans.value.length
        paginationState.value.totalPages = Math.ceil(
            filteredAndSortedLoans.value.length / newPageSize
        )
    }

    function setSortState(column: keyof Loan, direction: 'asc' | 'desc' | 'none') {
        // Clear cache when sort changes
        resultCache.clear()

        sortState.value = { column, direction }

        // Reset pagination and reload
        resetPagination()
    }

    function setFilter(newFilter: Partial<FilterState>) {
        // Clear cache when filter changes
        resultCache.clear()

        filterState.value = { ...filterState.value, ...newFilter }

        // Reset pagination and reload
        resetPagination()
    }

    function resetPagination() {
        paginationState.value.currentPage = 0
        paginationState.value.loadedRowsCount = 0

        // Load first page with current filters/sort
        loadNextPage()
    }

    function clearCache() {
        resultCache.clear()
    }

    // Read-only state exposure
    return {
        // State
        allLoans: readonly(allLoans),
        loadedLoans: readonly(loadedLoans),
        isLoading: readonly(isLoading),
        error: readonly(error),
        sortState: readonly(sortState),
        filterState: readonly(filterState),
        paginationState: readonly(paginationState),

        // Computed
        filteredAndSortedLoans,
        totalFilteredCount,
        hasMoreData,

        // Actions
        loadInitialData,
        loadNextPage,
        setPageSize,
        setSortState,
        setFilter,
        resetPagination,
        clearCache
    }
}