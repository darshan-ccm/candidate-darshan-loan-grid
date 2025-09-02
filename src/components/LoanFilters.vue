<script setup lang="ts">
import { ref, watch } from "vue";
import { debounce } from "../utils";

interface Props {
  modelValue: {
    search: string;
    status: string;
    minAmount?: number;
    maxAmount?: number;
    startDate?: string;
    endDate?: string;
  };
  pageSize: number;
}

interface Emits {
  (e: "update:modelValue", value: Props["modelValue"]): void;
  (e: "update:pageSize", value: number): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// Local state for immediate UI updates
const searchInput = ref(props.modelValue.search);
const statusFilter = ref(props.modelValue.status);
const minAmount = ref(props.modelValue.minAmount);
const maxAmount = ref(props.modelValue.maxAmount);
const startDate = ref(props.modelValue.startDate);
const endDate = ref(props.modelValue.endDate);
const pageSizeValue = ref(props.pageSize);
const showAdvanced = ref(false);

// Debounced handlers for expensive operations
const debouncedSearchUpdate = debounce((value: string) => {
  emit("update:modelValue", {
    ...props.modelValue,
    search: value,
  });
}, 300);

const debouncedAmountUpdate = debounce(() => {
  emit("update:modelValue", {
    ...props.modelValue,
    minAmount: minAmount.value || undefined,
    maxAmount: maxAmount.value || undefined,
  });
}, 500);

// Event handlers
function handleSearchInput() {
  debouncedSearchUpdate(searchInput.value);
}

function handleStatusChange() {
  emit("update:modelValue", {
    ...props.modelValue,
    status: statusFilter.value,
  });
}

function handlePageSizeChange() {
  emit("update:pageSize", pageSizeValue.value);
}

function handleAmountChange() {
  debouncedAmountUpdate();
}

function handleDateChange() {
  emit("update:modelValue", {
    ...props.modelValue,
    startDate: startDate.value || undefined,
    endDate: endDate.value || undefined,
  });
}

function clearAllFilters() {
  searchInput.value = "";
  statusFilter.value = "All";
  minAmount.value = undefined;
  maxAmount.value = undefined;
  startDate.value = undefined;
  endDate.value = undefined;

  emit("update:modelValue", {
    search: "",
    status: "All",
    minAmount: undefined,
    maxAmount: undefined,
    startDate: undefined,
    endDate: undefined,
  });
}

// Watch for external changes to props
watch(
  () => props.modelValue,
  (newValue) => {
    searchInput.value = newValue.search;
    statusFilter.value = newValue.status;
    minAmount.value = newValue.minAmount;
    maxAmount.value = newValue.maxAmount;
    startDate.value = newValue.startDate;
    endDate.value = newValue.endDate;
  },
  { deep: true }
);

watch(
  () => props.pageSize,
  (newValue) => {
    pageSizeValue.value = newValue;
  }
);
</script>

<template>
  <div class="loan-filters">
    <div class="filters-row">
      <!-- Search Input -->
      <div class="filter-group">
        <label for="search-input" class="filter-label"> Search Borrower </label>
        <input
          id="search-input"
          v-model="searchInput"
          type="text"
          placeholder="Search by borrower name..."
          class="filter-input"
          @input="handleSearchInput"
        />
      </div>

      <!-- Status Filter -->
      <div class="filter-group">
        <label for="status-select" class="filter-label"> Status </label>
        <select
          id="status-select"
          v-model="statusFilter"
          class="filter-select"
          @change="handleStatusChange"
        >
          <option value="All">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      <!-- Page Size Selector -->
      <div class="filter-group">
        <label for="page-size-select" class="filter-label">
          Rows per Page
        </label>
        <select
          id="page-size-select"
          v-model="pageSizeValue"
          class="filter-select"
          @change="handlePageSizeChange"
        >
          <option :value="25">25</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>
    </div>

    <!-- Optional Advanced Filters -->
    <div v-if="showAdvanced" class="filters-row advanced-filters">
      <div class="filter-group">
        <label for="min-amount" class="filter-label"> Min Amount </label>
        <input
          id="min-amount"
          v-model.number="minAmount"
          type="number"
          placeholder="Min"
          class="filter-input number-input"
          @input="handleAmountChange"
        />
      </div>

      <div class="filter-group">
        <label for="max-amount" class="filter-label"> Max Amount </label>
        <input
          id="max-amount"
          v-model.number="maxAmount"
          type="number"
          placeholder="Max"
          class="filter-input number-input"
          @input="handleAmountChange"
        />
      </div>

      <div class="filter-group">
        <label for="start-date" class="filter-label"> From Date </label>
        <input
          id="start-date"
          v-model="startDate"
          type="date"
          class="filter-input"
          @change="handleDateChange"
        />
      </div>

      <div class="filter-group">
        <label for="end-date" class="filter-label"> To Date </label>
        <input
          id="end-date"
          v-model="endDate"
          type="date"
          class="filter-input"
          @change="handleDateChange"
        />
      </div>
    </div>

    <div class="filter-actions">
      <button
        type="button"
        class="toggle-advanced-btn"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? "Hide" : "Show" }} Advanced Filters
      </button>

      <button type="button" class="clear-filters-btn" @click="clearAllFilters">
        Clear All Filters
      </button>
    </div>
  </div>
</template>

<style scoped>
.loan-filters {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
}

.filters-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.filters-row:last-child {
  margin-bottom: 0;
}

.advanced-filters {
  border-top: 1px solid #e2e8f0;
  padding-top: 1rem;
  margin-top: 1rem;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.filter-input,
.filter-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.number-input {
  max-width: 120px;
}

.filter-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-start;
  align-items: center;
  flex-wrap: wrap;
}

.toggle-advanced-btn {
  background: #6366f1;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.toggle-advanced-btn:hover {
  background: #5855eb;
}

.clear-filters-btn {
  background: #ef4444;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.clear-filters-btn:hover {
  background: #dc2626;
}

@media (max-width: 768px) {
  .filters-row {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: center;
  }
}
</style>
