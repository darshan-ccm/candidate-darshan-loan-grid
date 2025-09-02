import { mount, VueWrapper } from "@vue/test-utils"
import { describe, it, expect, beforeEach } from "vitest"
import type { ComponentPublicInstance } from "vue"
import type { SortableColumn, SortDirection, SortState } from "../types"
import LoanTableHeader from "../components/LoanTableHeader.vue"

type LoanTableHeaderEmits = {
    sort: [SortableColumn, SortDirection]
}

function getWrapper(
    sortState: SortState = { column: "id", direction: "none" },
    isSticky = false
): VueWrapper<ComponentPublicInstance<{}, {}, {}, {}, {}, {}, LoanTableHeaderEmits>> {
    return mount(LoanTableHeader, {
        props: {
            sortState,
            isSticky,
        },
    })
}

describe("LoanTableHeader.vue", () => {
    let wrapper: ReturnType<typeof getWrapper>

    beforeEach(() => {
        wrapper = getWrapper()
    })

    it("renders all columns with correct labels", () => {
        const headers = wrapper.findAll("th .header-text").map((h) => h.text())
        expect(headers).toEqual(["ID", "Borrower Name", "Amount", "Status", "Close Date"])
    })

    it("adds sticky class when isSticky is true", () => {
        const stickyWrapper = getWrapper({ column: "id", direction: "none" }, true)
        expect(stickyWrapper.find("thead").classes()).toContain("sticky")
    })

    it("emits sort event when clicking a sortable header", async () => {
        const firstHeader = wrapper.find("th.header-id")
        await firstHeader.trigger("click")

        const events = wrapper.emitted<LoanTableHeaderEmits["sort"]>("sort")
        expect(events).toBeTruthy()
        expect(events?.[0]).toEqual(["id", "asc"])
    })


    it("emits sort on Enter key press", async () => {
        const header = wrapper.find("th.header-amount")
        await header.trigger("keydown", { key: "Enter" })

        const events = wrapper.emitted<LoanTableHeaderEmits["sort"]>("sort")
        expect(events?.[0]).toEqual(["amount", "asc"])
    })

    it("emits sort on Space key press", async () => {
        const header = wrapper.find("th.header-status")
        await header.trigger("keydown", { key: " " })

        const events = wrapper.emitted<LoanTableHeaderEmits["sort"]>("sort")
        expect(events?.[0]).toEqual(["status", "asc"])
    })

    it("applies aria-sort attribute correctly", async () => {
        const header = wrapper.find("th.header-id")
        expect(header.attributes("aria-sort")).toBe("none")

        // simulate sorted asc
        const ascWrapper = getWrapper({ column: "id", direction: "asc" })
        expect(ascWrapper.find("th.header-id").attributes("aria-sort")).toBe("ascending")

        // simulate sorted desc
        const descWrapper = getWrapper({ column: "id", direction: "desc" })
        expect(descWrapper.find("th.header-id").attributes("aria-sort")).toBe("descending")
    })

    it("applies sorted class to active sorted column", async () => {
        const ascWrapper = getWrapper({ column: "borrowerName", direction: "asc" })
        const header = ascWrapper.find("th.header-borrowerName")
        expect(header.classes()).toContain("sorted")
    })
})
