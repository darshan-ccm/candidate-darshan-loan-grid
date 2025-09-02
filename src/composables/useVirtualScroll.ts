import { ref, computed, nextTick, watch } from 'vue'
import type { VirtualScrollState } from '../types'
import { calculateVisibleRange, throttle } from '../utils'

export function useVirtualScroll(
    itemHeight: number,
    containerHeight: number,
    overscan = 5
) {
    const scrollTop = ref(0)
    const scrollElement = ref<HTMLElement>()

    const virtualState = computed((): VirtualScrollState => ({
        startIndex: 0,
        endIndex: 0,
        scrollTop: scrollTop.value,
        containerHeight,
        itemHeight
    }))

    // ✅ Reset to very top on mount AND make sure dependents recompute immediately
    const onScroll = throttle((event: Event) => {
        const target = event.target as HTMLElement
        scrollTop.value = target?.scrollTop ?? 0
    }, 16) // ~60fps

    watch(
        scrollElement,
        (el) => {
            if (el) {
                el.scrollTop = 0
                scrollTop.value = 0
                onScroll({ target: el } as unknown as Event)
            }
        },
        { immediate: true }
    )

    function calculateVisibleItems(totalItems: number) {
        return calculateVisibleRange(
            scrollTop.value,
            containerHeight,
            itemHeight,
            totalItems,
            overscan
        )
    }

    function scrollToTop() {
        if (scrollElement.value) {
            scrollElement.value.scrollTop = 0
            scrollTop.value = 0
        }
    }

    async function scrollToIndex(index: number) {
        if (scrollElement.value) {
            const targetScrollTop = index * itemHeight
            scrollElement.value.scrollTop = targetScrollTop
            scrollTop.value = targetScrollTop
            await nextTick()
        }
    }

    function isNearBottom(threshold = 100): boolean {
        if (!scrollElement.value) return false
        const { scrollTop: st, scrollHeight, clientHeight } = scrollElement.value
        return scrollHeight - (st + clientHeight) < threshold
    }

    return {
        scrollTop,
        scrollElement,
        virtualState,
        calculateVisibleItems,
        scrollToTop,
        scrollToIndex,
        isNearBottom,
        onScroll
    }
}
