import type { FilterState, Loan, SortableColumn, SortDirection } from "../types"

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args)
            inThrottle = true
            setTimeout(() => (inThrottle = false), limit)
        }
    }
}

export function sortLoans(
    loans: Loan[],
    column: SortableColumn | null,
    direction: SortDirection
): Loan[] {
    if (!column || direction === 'none') {
        return loans
    }

    return [...loans].sort((a, b) => {
        let aVal = a[column]
        let bVal = b[column]

        // Handle different data types
        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase()
            bVal = (bVal as string).toLowerCase()
        }

        let result = 0
        if (aVal < bVal) {
            result = -1
        } else if (aVal > bVal) {
            result = 1
        } else {
            // Stable sort: fall back to ID comparison for equal values
            result = a.id - b.id
        }

        return direction === 'desc' ? -result : result
    })
}

export function filterLoans(loans: Loan[], filters: FilterState): Loan[] {
    return loans.filter((loan) => {
        // Search filter (case-insensitive substring match on borrowerName)
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase()
            if (!loan.borrowerName.toLowerCase().includes(searchTerm)) {
                return false
            }
        }

        // Status filter
        if (filters.status && filters.status !== 'All') {
            if (loan.status !== filters.status) {
                return false
            }
        }

        // Amount range filter
        if (filters.minAmount !== undefined && loan.amount < filters.minAmount) {
            return false
        }
        if (filters.maxAmount !== undefined && loan.amount > filters.maxAmount) {
            return false
        }

        // Date range filter
        if (filters.startDate && loan.closeDate < filters.startDate) {
            return false
        }
        if (filters.endDate && loan.closeDate > filters.endDate) {
            return false
        }

        return true
    })
}

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount)
}

export function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

export function getStatusColor(status: string): string {
    switch (status) {
        case 'Approved':
            return 'text-green-600 bg-green-50'
        case 'Rejected':
            return 'text-red-600 bg-red-50'
        case 'Pending':
        default:
            return 'text-yellow-600 bg-yellow-50'
    }
}

// Cache key generator for memoization
export function getCacheKey(filters: FilterState, sortColumn: string | null, sortDirection: string): string {
    return JSON.stringify({ filters, sortColumn, sortDirection })
}

// Virtual scrolling calculations
export function calculateVisibleRange(
    scrollTop: number,
    containerHeight: number,
    itemHeight: number,
    totalItems: number,
    overscan = 5
): { startIndex: number; endIndex: number } {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
        totalItems - 1,
        Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    return { startIndex, endIndex }
}