import { mount, VueWrapper } from "@vue/test-utils"
import { describe, it, expect, beforeEach } from "vitest"
import type { ComponentPublicInstance } from "vue"
import type { FilterState } from "../types"
import LoanFilters from "../components/LoanFilters.vue"

// Utility: wait for debounce
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type LoanFiltersEmits = {
    "update:modelValue": [FilterState]
    "update:pageSize": [number]
}

function getWrapper(
    modelValue: FilterState = {
        search: "",
        status: "All",
        minAmount: undefined,
        maxAmount: undefined,
        startDate: undefined,
        endDate: undefined,
    },
    pageSize = 25
): VueWrapper<ComponentPublicInstance<{}, {}, {}, {}, {}, {}, LoanFiltersEmits>> {
    return mount(LoanFilters, {
        props: {
            modelValue,
            pageSize,
        },
    })
}

describe("LoanFilters.vue", () => {
    let wrapper: ReturnType<typeof getWrapper>

    beforeEach(() => {
        wrapper = getWrapper()
    })

    it("renders with default props", () => {
        expect(wrapper.find("#search-input").exists()).toBe(true)
        expect(wrapper.find("#status-select").exists()).toBe(true)
        expect(wrapper.find("#page-size-select").exists()).toBe(true)
    })

    it("emits update:modelValue when typing in search", async () => {
        const input = wrapper.find<HTMLInputElement>("#search-input")
        await input.setValue("John Doe")
        await input.trigger("input")

        await wait(350) // debounce delay

        const events = wrapper.emitted<LoanFiltersEmits["update:modelValue"]>("update:modelValue")
        expect(events).toBeTruthy()
        expect(events?.at(-1)?.[0].search).toBe("John Doe")
    })

    it("emits update:modelValue when status changes", async () => {
        const select = wrapper.find<HTMLSelectElement>("#status-select")
        await select.setValue("Approved")

        const events = wrapper.emitted<LoanFiltersEmits["update:modelValue"]>("update:modelValue")
        expect(events?.at(-1)?.[0].status).toBe("Approved")
    })

    it("emits update:pageSize when rows per page changes", async () => {
        const select = wrapper.find<HTMLSelectElement>("#page-size-select")
        await select.setValue("50")

        const events = wrapper.emitted<LoanFiltersEmits["update:pageSize"]>("update:pageSize")
        expect(events?.[0][0]).toBe(50)
    })

    it("shows advanced filters when toggle clicked", async () => {
        expect(wrapper.find(".advanced-filters").exists()).toBe(false)
        await wrapper.find(".toggle-advanced-btn").trigger("click")
        expect(wrapper.find(".advanced-filters").exists()).toBe(true)
    })

    it("clears all filters on Clear All Filters button", async () => {
        const w = getWrapper({
            search: "abc",
            status: "Pending",
            minAmount: 100,
            maxAmount: 500,
            startDate: "2023-01-01",
            endDate: "2023-02-01",
        })

        await w.find(".clear-filters-btn").trigger("click")

        const events = w.emitted<LoanFiltersEmits["update:modelValue"]>("update:modelValue")
        const emitted = events?.at(-1)?.[0]

        expect(emitted).toEqual({
            search: "",
            status: "All",
            minAmount: undefined,
            maxAmount: undefined,
            startDate: undefined,
            endDate: undefined,
        })
    })

    it("updates model when amount inputs are changed", async () => {
        await wrapper.find(".toggle-advanced-btn").trigger("click")

        const min = wrapper.find<HTMLInputElement>("#min-amount")
        const max = wrapper.find<HTMLInputElement>("#max-amount")

        await min.setValue("200")
        await min.trigger("input")
        await max.setValue("400")
        await max.trigger("input")

        await wait(600) // debounce for amount

        const events = wrapper.emitted<LoanFiltersEmits["update:modelValue"]>("update:modelValue")
        const emitted = events?.at(-1)?.[0]
        expect(emitted?.minAmount).toBe(200)
        expect(emitted?.maxAmount).toBe(400)
    })

    it("updates model when date inputs are changed", async () => {
        await wrapper.find(".toggle-advanced-btn").trigger("click")

        const start = wrapper.find<HTMLInputElement>("#start-date")
        const end = wrapper.find<HTMLInputElement>("#end-date")

        await start.setValue("2024-01-01")
        await start.trigger("change")
        await end.setValue("2024-01-15")
        await end.trigger("change")

        const events = wrapper.emitted<LoanFiltersEmits["update:modelValue"]>("update:modelValue")
        const emitted = events?.at(-1)?.[0]
        expect(emitted?.startDate).toBe("2024-01-01")
        expect(emitted?.endDate).toBe("2024-01-15")
    })
})
