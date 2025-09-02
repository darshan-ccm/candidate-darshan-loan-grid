// useVirtualScroll.test.ts
import { nextTick } from 'vue'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVirtualScroll } from '../composables/useVirtualScroll'

// Mock utils
vi.mock('../utils', async (importOriginal) => {
    const actual = await importOriginal()
    return {
        ...actual,
        throttle: (fn: any) => fn, 
        calculateVisibleRange: vi.fn(
            (
                scrollTop: number,
                containerHeight: number,
                itemHeight: number,
                totalItems: number,
                overscan: number
            ) => {
                const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
                const itemsPerViewport = Math.ceil(containerHeight / itemHeight)
                const end = Math.min(
                    totalItems - 1,
                    start + itemsPerViewport + overscan * 2 - 1
                )
                return { startIndex: start, endIndex: end }
            }
        ),
    }
})

describe('useVirtualScroll', () => {
    const itemHeight = 20
    const containerHeight = 100
    const totalItems = 200

    let scroll: ReturnType<typeof useVirtualScroll>
    let mockElement: any

    beforeEach(() => {
        mockElement = {
            scrollTop: 0,
            scrollHeight: 4000,
            clientHeight: containerHeight,
        }

        scroll = useVirtualScroll(itemHeight, containerHeight, 2)
        scroll.scrollElement.value = mockElement
    })

    it('initializes with scrollTop = 0', () => {
        expect(scroll.scrollTop.value).toBe(0)
    })

    it('calculates visible items correctly at top', () => {
        const range = scroll.calculateVisibleItems(totalItems)
        expect(range.startIndex).toBe(0)
        expect(range.endIndex).toBeGreaterThan(0)
    })

    it('updates scrollTop on onScroll event', () => {
        mockElement.scrollTop = 200
        scroll.onScroll({ target: mockElement } as unknown as Event)
        expect(scroll.scrollTop.value).toBe(200)
    })

    it('scrollToTop resets scrollTop', () => {
        mockElement.scrollTop = 300
        scroll.scrollToTop()
        expect(scroll.scrollTop.value).toBe(0)
        expect(mockElement.scrollTop).toBe(0)
    })

    it('scrollToIndex moves to correct position', async () => {
        await scroll.scrollToIndex(10)
        expect(scroll.scrollTop.value).toBe(200) // 10 * 20
        expect(mockElement.scrollTop).toBe(200)
    })

    it('isNearBottom returns false when far', () => {
        mockElement.scrollTop = 100
        expect(scroll.isNearBottom()).toBe(false)
    })

    it('isNearBottom returns true when near bottom', () => {
        mockElement.scrollTop = mockElement.scrollHeight - containerHeight - 50
        expect(scroll.isNearBottom()).toBe(true)
    })

    it('watch on scrollElement resets to top on mount', async () => {
        const newScroll = useVirtualScroll(itemHeight, containerHeight, 2)
        const el = { scrollTop: 500, scrollHeight: 4000, clientHeight: 100 }
        newScroll.scrollElement.value = el as HTMLElement
        await nextTick()
        expect(el.scrollTop).toBe(0)
        expect(newScroll.scrollTop.value).toBe(0)
    })
})
