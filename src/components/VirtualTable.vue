<template>
  <div class="virtual-table-container">
    <!-- Info Bar -->
    <div class="info-bar">
      <div class="info-left">
        <span class="info-text">
          Showing {{ loadedCount }} of {{ totalCount }} records
        </span>
        <span v-if="isLoading" class="loading-indicator">
          <svg class="loading-spinner" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
              fill="none"
              opacity="0.25"
            />
            <path
              fill="currentColor"
              opacity="0.75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      </div>
      <div class="info-right">
        <button
          v-if="hasPerformanceOptimizations"
          type="button"
          class="perf-indicator"
          :title="`Performance optimizations active for ${loadedCount} rows`"
        >
          ⚡ Optimized
        </button>
      </div>
    </div>

    <!-- Virtual Table -->
    <div
      ref="scrollContainer"
      class="table-scroll-container"
      :style="{ height: `${containerHeight}px` }"
      @scroll="handleScroll"
      role="grid"
      :aria-rowcount="totalCount"
      :aria-label="`Loan management table with ${totalCount} loans`"
    >
      <!-- Sticky Header -->
      <div class="table-header-container">
        <table class="header-table" role="presentation">
          <LoanTableHeader
            :sort-state="sortState"
            :is-sticky="true"
            @sort="handleSort"
          />
        </table>
      </div>

      <!-- Scrollable Body -->
      <div
        class="table-body-container"
        :style="{
          height: `${totalHeight}px`,
          paddingTop: `${offsetY}px`,
        }"
      >
        <table class="body-table" role="presentation">
          <tbody>
            <LoanTableRow
              v-for="(loan, index) in visibleItems"
              :key="loan.id"
              :loan="loan"
              :rowIndex="index"
              :height="itemHeight"
              @select="handleRowSelect"
            />
          </tbody>
        </table>
      </div>

      <!-- Loading Overlay -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-content">
          <svg class="loading-spinner large" viewBox="0 0 24 24">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
              fill="none"
              opacity="0.25"
            />
            <path
              fill="currentColor"
              opacity="0.75"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Loading data...</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";

import LoanTableHeader from "./LoanTableHeader.vue";
import LoanTableRow from "./LoanTableRow.vue";
import type { Loan, SortableColumn, SortDirection, SortState } from "../types";
import { useVirtualScroll } from "../composables/useVirtualScroll";
import { throttle } from "../utils";

interface Props {
  items: Loan[];
  totalCount: number;
  loadedCount: number;
  isLoading: boolean;
  hasMoreData: boolean;
  sortState: SortState;
  containerHeight?: number;
  itemHeight?: number;
}

interface Emits {
  (e: "load-more"): void;
  (e: "sort", column: SortableColumn, direction: SortDirection): void;
  (e: "row-select", loan: Loan): void;
}

const props = withDefaults(defineProps<Props>(), {
  containerHeight: 600,
  itemHeight: 60,
});

const emit = defineEmits<Emits>();

const scrollContainer = ref<HTMLElement>();
const loadTrigger = ref<HTMLElement>();

const { scrollElement, calculateVisibleItems, isNearBottom, onScroll } =
  useVirtualScroll(props.itemHeight, props.containerHeight);

watch(
  scrollContainer,
  (el) => {
    scrollElement.value = el;
  },
  { immediate: true }
);

const visibleRange = computed(() => {
  return calculateVisibleItems(props.items.length);
});

const visibleStartIndex = computed(() => visibleRange.value.startIndex);
const visibleEndIndex = computed(() => visibleRange.value.endIndex);

const visibleItems = computed(() => {
  const start = visibleStartIndex.value;
  const end = visibleEndIndex.value;
  return props.items.slice(start, end + 1);
});

const totalHeight = computed(() => props.items.length * props.itemHeight);
const offsetY = computed(() => visibleStartIndex.value * props.itemHeight);

const hasPerformanceOptimizations = computed(() => props.loadedCount > 2000);

const throttledScrollHandler = throttle((event: Event) => {
  onScroll(event);
  checkForLoadMore();
}, 300);

function checkForLoadMore() {
  if (props.hasMoreData && !props.isLoading && isNearBottom(100)) {
    emit("load-more");
  }
}

function handleScroll(event: Event) {
  throttledScrollHandler(event);
}

function handleSort(column: SortableColumn, direction: SortDirection) {
  emit("sort", column, direction);
}

function handleRowSelect(loan: Loan) {
  emit("row-select", loan);
}

let intersectionObserver: IntersectionObserver | null = null;

onMounted(async () => {
  await nextTick();

  if (loadTrigger.value && "IntersectionObserver" in window) {
    intersectionObserver = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && props.hasMoreData && !props.isLoading) {
          emit("load-more");
        }
      },
      {
        root: scrollContainer.value,
        rootMargin: "200px",
        threshold: 0.1,
      }
    );

    intersectionObserver.observe(loadTrigger.value);
  }
});

onUnmounted(() => {
  if (intersectionObserver) {
    intersectionObserver.disconnect();
  }
});

watch(
  () => props.items.length,
  async (newLength, oldLength) => {
    if (newLength > oldLength && scrollContainer.value) {
      await nextTick();
      checkForLoadMore();
    }
  }
);
</script>

<style scoped>
.virtual-table-container {
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}

.info-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-size: 0.875rem;
}

.info-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-text {
  color: #6b7280;
  font-weight: 500;
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #3b82f6;
  font-size: 0.875rem;
}

.perf-indicator {
  background: #10b981;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
}

.table-scroll-container {
  position: relative;
  overflow: auto;
  background: white;
}

.table-header-container {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  border-bottom: 2px solid #e2e8f0;
}

.header-table,
.body-table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.table-body-container {
  position: relative;
}

.load-trigger {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(4px);
  border-top: 1px solid #e5e7eb;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.load-trigger.visible {
  opacity: 1;
  transform: translateY(0);
}

.load-more-btn {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.load-more-btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.load-more-btn:active {
  transform: translateY(0);
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
  backdrop-filter: blur(2px);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #3b82f6;
}

.loading-spinner {
  width: 1rem;
  height: 1rem;
  animation: spin 1s linear infinite;
}

.loading-spinner.large {
  width: 2rem;
  height: 2rem;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Scrollbar styling */
.table-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.table-scroll-container::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.table-scroll-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}

.table-scroll-container::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-bar {
    padding: 0.5rem;
    font-size: 0.75rem;
  }

  .info-left {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .perf-indicator {
    font-size: 0.625rem;
    padding: 0.125rem 0.5rem;
  }

  .load-more-btn {
    padding: 0.5rem 1.5rem;
    font-size: 0.875rem;
  }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .virtual-table-container {
    border: 2px solid #000;
  }

  .info-bar {
    border-bottom: 2px solid #000;
  }

  .load-trigger {
    border-top: 2px solid #000;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .load-trigger,
  .load-more-btn,
  .loading-spinner {
    transition: none;
    animation: none;
  }
}
</style>
