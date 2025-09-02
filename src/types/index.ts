export interface Loan {
    id: number
    borrowerName: string
    amount: number
    status: 'Pending' | 'Approved' | 'Rejected'
    closeDate: string
}

export type SortDirection = 'asc' | 'desc' | 'none'

export type SortableColumn = keyof Loan

export interface SortState {
    column: SortableColumn | null
    direction: SortDirection
}

export interface FilterState {
    search: string
    status: string
    minAmount?: number
    maxAmount?: number
    startDate?: string
    endDate?: string
}

export interface PaginationState {
    pageSize: number
    currentPage: number
    totalPages: number
    loadedRowsCount: number
}

export interface VirtualScrollState {
    startIndex: number
    endIndex: number
    scrollTop: number
    containerHeight: number
    itemHeight: number
}