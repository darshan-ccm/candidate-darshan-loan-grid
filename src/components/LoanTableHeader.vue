<template>
  <thead class="table-header" :class="{ sticky: isSticky }">
    <tr>
      <th
        v-for="column in columns"
        :key="column.key"
        :class="[
          'header-cell',
          `header-${column.key}`,
          { 'sortable': column.sortable, 'sorted': sortState.column === column.key }
        ]"
        :aria-sort="getSortAriaLabel(column.key)"
        @click="column.sortable ? handleSort(column.key) : null"
        @keydown="column.sortable ? handleKeydown($event, column.key) : null"
        :tabindex="column.sortable ? 0 : -1"
        role="columnheader"
      >
        <div class="header-content">
          <span class="header-text">{{ column.label }}</span>
          <span
            v-if="column.sortable"
            class="sort-indicator"
            :class="getSortIndicatorClass(column.key)"
            aria-hidden="true"
          >
            <svg class="sort-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                v-if="getSortDirection(column.key) === 'asc'"
                fill-rule="evenodd"
                d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                clip-rule="evenodd"
              />
              <path
                v-else-if="getSortDirection(column.key) === 'desc'"
                fill-rule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
              <g v-else>
                <!-- Unsorted - show both arrows -->
                <path
                  opacity="0.3"
                  fill-rule="evenodd"
                  d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                  clip-rule="evenodd"
                />
                <path
                  opacity="0.3"
                  fill-rule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clip-rule="evenodd"
                />
              </g>
            </svg>
          </span>
        </div>
      </th>
    </tr>
  </thead>
</template>

<script setup lang="ts">
import type { SortableColumn, SortDirection, SortState } from '../types'


interface Column {
  key: SortableColumn
  label: string
  sortable: boolean
}

interface Props {
  sortState: SortState
  isSticky?: boolean
}

interface Emits {
  (e: 'sort', column: SortableColumn, direction: SortDirection): void
}

const props = withDefaults(defineProps<Props>(), {
  isSticky: false
})

const emit = defineEmits<Emits>()

const columns: Column[] = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'borrowerName', label: 'Borrower Name', sortable: true },
  { key: 'amount', label: 'Amount', sortable: true },
  { key: 'status', label: 'Status', sortable: true },
  { key: 'closeDate', label: 'Close Date', sortable: true }
]

function getSortDirection(columnKey: SortableColumn): SortDirection {
  return props.sortState.column === columnKey ? props.sortState.direction : 'none'
}

function getNextSortDirection(currentDirection: SortDirection): SortDirection {
  switch (currentDirection) {
    case 'none':
      return 'asc'
    case 'asc':
      return 'desc'
    case 'desc':
      return 'none'
    default:
      return 'asc'
  }
}

function getSortAriaLabel(columnKey: SortableColumn): string | undefined {
  const direction = getSortDirection(columnKey)
  switch (direction) {
    case 'asc':
      return 'ascending'
    case 'desc':
      return 'descending'
    case 'none':
    default:
      return 'none'
  }
}

function getSortIndicatorClass(columnKey: SortableColumn): string {
  const direction = getSortDirection(columnKey)
  return `sort-${direction}`
}

function handleSort(columnKey: SortableColumn) {
  const currentDirection = getSortDirection(columnKey)
  const nextDirection = getNextSortDirection(currentDirection)
  emit('sort', columnKey, nextDirection)
}

function handleKeydown(event: KeyboardEvent, columnKey: SortableColumn) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleSort(columnKey)
  }
}
</script>

<style scoped>
.table-header {
  background-color: #f8fafc;
  border-bottom: 2px solid #e2e8f0;
}

.table-header.sticky {
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-cell {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  white-space: nowrap;
}

.header-cell.sortable {
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s, color 0.2s;
}

.header-cell.sortable:hover {
  background-color: #e5e7eb;
  color: #1f2937;
}

.header-cell.sortable:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
}

.header-cell.sorted {
  background-color: #ddd6fe;
  color: #5b21b6;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.header-text {
  flex: 1;
}

.sort-indicator {
  display: flex;
  align-items: center;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.header-cell.sorted .sort-indicator,
.header-cell.sortable:hover .sort-indicator {
  opacity: 1;
}

.sort-icon {
  width: 1rem;
  height: 1rem;
}

.sort-asc {
  color: #10b981;
}

.sort-desc {
  color: #f59e0b;
}

.sort-none {
  color: #6b7280;
}

/* Column-specific widths - consistent with row component */
.header-id {
  width: 80px;
  min-width: 80px;
}

.header-borrowerName {
  width: 30%;
  min-width: 200px;
}

.header-amount {
  width: 140px;
  min-width: 140px;
  text-align: right;
}

.header-status {
  width: 120px;
  min-width: 120px;
  text-align: center;
}

.header-closeDate {
  width: 140px;
  min-width: 140px;
  text-align: center;
}

@media (max-width: 768px) {
  .header-cell {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
  
  .header-id {
    width: 60px;
  }
  
  .header-borrowerName {
    min-width: 150px;
  }
  
  .header-amount,
  .header-status,
  .header-closeDate {
    width: auto;
    min-width: 80px;
  }
}
</style>