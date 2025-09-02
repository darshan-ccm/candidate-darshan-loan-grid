<template>
  <tr
    class="table-row"
    :style="{ height: `${height}px` }"
    :tabindex="0"
    role="row"
    @click="$emit('select', loan)"
    @keydown="handleKeydown"
  >
    <td class="cell cell-id" role="gridcell">
      {{ loan.id }}
    </td>
    <td class="cell cell-borrower-name" role="gridcell">
      <span class="borrower-name" :title="loan.borrowerName">
        {{ loan.borrowerName }}
      </span>
    </td>
    <td class="cell cell-amount" role="gridcell">
      <span class="amount">
        {{ formatCurrency(loan.amount) }}
      </span>
    </td>
    <td class="cell cell-status" role="gridcell">
      <span class="status-badge" :class="getStatusColor(loan.status)">
        {{ loan.status }}
      </span>
    </td>
    <td class="cell cell-close-date" role="gridcell">
      <time :datetime="loan.closeDate">
        {{ formatDate(loan.closeDate) }}
      </time>
    </td>
  </tr>
</template>

<script setup lang="ts">
import type { Loan } from "../types";
import { formatCurrency, formatDate, getStatusColor } from "../utils";

interface Props {
  loan: Loan;
  height?: number;
}

interface Emits {
  (e: "select", loan: Loan): void;
}

withDefaults(defineProps<Props>(), {
  height: 60,
});

const emit = defineEmits<Emits>();

function handleKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    emit("select", event.target as any);
  }
}
</script>

<style scoped>
.table-row {
  border-bottom: 1px solid #f3f4f6;
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.table-row:hover {
  background-color: #f9fafb;
}

.table-row:focus {
  outline: 2px solid #3b82f6;
  outline-offset: -2px;
  background-color: #eff6ff;
}

.table-row:nth-child(even) {
  background-color: #fafafa;
}

.table-row:nth-child(even):hover {
  background-color: #f3f4f6;
}

.cell {
  padding: 0.75rem 1rem;
  vertical-align: middle;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cell-id {
  width: 80px;
  min-width: 80px;
  font-weight: 500;
  color: #6b7280;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 0.875rem;
}

.cell-borrower-name {
  width: 30%;
  min-width: 200px;
}

.borrower-name {
  font-weight: 500;
  color: #1f2937;
}

.cell-amount {
  width: 140px;
  min-width: 140px;
  text-align: right;
  font-weight: 600;
  font-family: "Monaco", "Menlo", monospace;
}

.amount {
  color: #059669;
}

.cell-status {
  width: 120px;
  min-width: 120px;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cell-close-date {
  width: 140px;
  min-width: 140px;
  text-align: center;
  color: #6b7280;
  font-family: "Monaco", "Menlo", monospace;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .cell {
    padding: 0.5rem;
    font-size: 0.875rem;
  }

  .cell-id {
    width: 60px;
    font-size: 0.75rem;
  }

  .cell-borrower-name {
    min-width: 150px;
  }

  .borrower-name {
    font-size: 0.875rem;
  }

  .cell-amount,
  .cell-status,
  .cell-close-date {
    width: auto;
    min-width: 80px;
  }

  .amount {
    font-size: 0.875rem;
  }

  .status-badge {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
  }
}
</style>
