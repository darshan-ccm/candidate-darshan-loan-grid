<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from "vue";
import { useLoanStore } from "./composables/useLoanStore";
import type { FilterState, SortableColumn, SortDirection } from "./types";
import LoanFilters from "./components/LoanFilters.vue";
import VirtualTable from "./components/VirtualTable.vue";

const loanStore = useLoanStore();

// Filter state
const filterValues = ref<FilterState>({
  search: "",
  status: "All",
  minAmount: undefined,
  maxAmount: undefined,
  startDate: undefined,
  endDate: undefined,
});

// Notification system
interface Notification {
  id: number;
  type: "success" | "error" | "info";
  message: string;
}

const notifications = ref<Notification[]>([]);
let notificationId = 0;

function addNotification(type: Notification["type"], message: string) {
  const id = ++notificationId;
  notifications.value.push({ id, type, message });

  // Auto dismiss after 5 seconds
  setTimeout(() => {
    dismissNotification(id);
  }, 3000);
}

function dismissNotification(id: number) {
  const index = notifications.value.findIndex((n) => n.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
}

// Event handlers
function handleLoadMore() {
  loanStore.loadNextPage();
}

function handlePageSizeChange(newPageSize: number) {
  loanStore.setPageSize(newPageSize);
  addNotification("info", `Page size changed to ${newPageSize} rows`);
}

function handleSort(column: SortableColumn, direction: SortDirection) {
  loanStore.setSortState(column, direction);

  if (direction === "none") {
    addNotification("info", `Sorting cleared`);
  } else {
    addNotification("info", `Sorted by ${column} (${direction}ending)`);
  }
}

function handleRowSelect(loan: any) {
  addNotification("info", `Selected loan #${loan.id} for ${loan.borrowerName}`);
}

async function retryLoad() {
  const dataUrl = "/data/loans.json";
  await loanStore.loadInitialData(dataUrl);

  if (!loanStore.error.value) {
    addNotification("success", "Data loaded successfully");
  }
}

function clearAllFilters() {
  filterValues.value = {
    search: "",
    status: "All",
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
  };
  addNotification("info", "All filters cleared");
}

// CSV Export functionality
function exportData() {
  try {
    const loans = loanStore.filteredAndSortedLoans.value.slice(0, 1000); // Export max 1000 rows

    if (loans.length === 0) {
      addNotification("error", "No data to export");
      return;
    }

    // Create CSV content
    const headers = ["ID", "Borrower Name", "Amount", "Status", "Close Date"];
    const csvContent = [
      headers.join(","),
      ...loans.map((loan) =>
        [
          loan.id,
          `"${loan.borrowerName}"`,
          loan.amount,
          loan.status,
          loan.closeDate,
        ].join(",")
      ),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `loans_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    addNotification("success", `Exported ${loans.length} loans to CSV`);
  } catch (error) {
    console.error("Export error:", error);
    addNotification("error", "Failed to export data");
  }
}

// Watch filter changes and update store
watch(
  filterValues,
  (newFilters) => {
    loanStore.setFilter(newFilters);
  },
  { deep: true }
);

// Load initial data on mount
onMounted(async () => {
  const dataUrl = "/data/loans.json";

  loanStore.setPageSize(25);

  try {
    await loanStore.loadInitialData(dataUrl);

    if (
      loanStore.loadedLoans.value.length === 0 &&
      loanStore.hasMoreData.value
    ) {
      loanStore.loadNextPage();
      await nextTick();
    }

    if (!loanStore.error.value) {
      addNotification(
        "success",
        `Loaded ${loanStore.loadedLoans.value.length} loans successfully`
      );
    } else {
      addNotification("error", loanStore.error.value || "Failed to load data");
    }
  } catch (err) {
    addNotification("error", "Failed to load data");
  }
});
</script>

<template>
  <div class="app">
    <header class="app-header">
      <div class="header-content">
        <h1 class="app-title">
          <svg
            class="title-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
          Loan Management Grid
        </h1>
        <div class="header-actions">
          <button
            type="button"
            class="export-btn"
            @click="exportData"
            :disabled="loanStore.loadedLoans.length === 0"
          >
            <svg class="btn-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clip-rule="evenodd"
              />
            </svg>
            Export CSV
          </button>
        </div>
      </div>
    </header>

    <main class="app-main">
      <div class="main-content">
        <!-- Error Display -->
        <div v-if="loanStore.error.value" class="error-banner" role="alert">
          <div class="error-content">
            <svg class="error-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div class="error-text">
              <h3>Error Loading Data</h3>
              <p>{{ loanStore.error.value }}</p>
            </div>
            <button type="button" class="retry-btn" @click="retryLoad">
              Retry
            </button>
          </div>
        </div>

        <!-- Filters -->
        <LoanFilters
          v-model="filterValues"
          :page-size="loanStore.paginationState.value.pageSize"
          @update:page-size="handlePageSizeChange"
        />

        <!-- Virtual Table -->
        <VirtualTable
          v-if="!loanStore.error.value"
          :items="loanStore.loadedLoans.value"
          :total-count="loanStore.totalFilteredCount.value"
          :loaded-count="loanStore.paginationState.value.loadedRowsCount"
          :is-loading="loanStore.isLoading.value"
          :has-more-data="loanStore.hasMoreData.value"
          :sort-state="loanStore.sortState.value"
          :container-height="600"
          :item-height="60"
          @load-more="handleLoadMore"
          @sort="handleSort"
          @row-select="handleRowSelect"
        />

        <!-- Empty State -->
        <div
          v-if="
            !loanStore.error.value &&
            !loanStore.isLoading.value &&
            loanStore.totalFilteredCount.value === 0
          "
          class="empty-state"
        >
          <div class="empty-content">
            <svg class="empty-icon" viewBox="0 0 20 20" fill="currentColor">
              <path
                fill-rule="evenodd"
                d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clip-rule="evenodd"
              />
            </svg>
            <h3>No loans found</h3>
            <p>Try adjusting your filters to see more results.</p>
            <button
              type="button"
              class="clear-filters-btn"
              @click="clearAllFilters"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Toast Notifications -->
    <div
      v-if="notifications.length > 0"
      class="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      <div
        v-for="notification in notifications"
        :key="notification.id"
        class="toast"
        :class="`toast-${notification.type}`"
        role="alert"
      >
        <div class="toast-content">
          <svg
            v-if="notification.type === 'success'"
            class="toast-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <svg
            v-else-if="notification.type === 'error'"
            class="toast-icon"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ notification.message }}</span>
        </div>
        <button
          type="button"
          class="toast-close"
          @click="dismissNotification(notification.id)"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

.app-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.app-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0;
  font-size: 1.875rem;
  font-weight: 700;
  color: #1f2937;
}

.title-icon {
  width: 2rem;
  height: 2rem;
  color: #6366f1;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover:not(:disabled) {
  background: #059669;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.export-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.btn-icon {
  width: 1rem;
  height: 1rem;
}

.app-main {
  padding: 2rem;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
}

.error-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  width: 2rem;
  height: 2rem;
  color: #ef4444;
  flex-shrink: 0;
}

.error-text {
  flex: 1;
}

.error-text h3 {
  margin: 0 0 0.5rem 0;
  color: #991b1b;
  font-weight: 600;
}

.error-text p {
  margin: 0;
  color: #7f1d1d;
}

.retry-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.retry-btn:hover {
  background: #dc2626;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-content {
  text-align: center;
  max-width: 400px;
  padding: 2rem;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  color: #9ca3af;
  margin: 0 auto 1rem;
}

.empty-content h3 {
  margin: 0 0 0.5rem 0;
  color: #374151;
  font-size: 1.25rem;
  font-weight: 600;
}

.empty-content p {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
}

.clear-filters-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters-btn:hover {
  background: #2563eb;
}

.toast-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 50;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.toast {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease;
}

.toast-success {
  background: #d1fae5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.toast-error {
  background: #fee2e2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.toast-info {
  background: #dbeafe;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.toast-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.toast-close {
  background: none;
  border: none;
  color: inherit;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
  padding: 0.25rem;
  margin: -0.25rem -0.25rem -0.25rem 0.5rem;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.toast-close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .app-header {
    padding: 1rem;
  }

  .header-content {
    padding: 1rem;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .app-title {
    font-size: 1.5rem;
    justify-content: center;
  }

  .header-actions {
    justify-content: center;
  }

  .app-main {
    padding: 1rem;
  }

  .toast-container {
    left: 1rem;
    right: 1rem;
    max-width: none;
  }
}
</style>
