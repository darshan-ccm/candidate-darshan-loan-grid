// LoanTableRow.spec.ts
import { mount } from '@vue/test-utils'
import { formatCurrency, formatDate, getStatusColor } from '../utils'
import type { Loan } from '../types'
import { describe, expect, it } from 'vitest'
import LoanTableRow from '../components/LoanTableRow.vue'

const mockLoan: Loan = {
    id: 'LN001',
    borrowerName: 'John Doe',
    amount: 25000,
    status: 'Approved',
    closeDate: '2025-01-15',
}

describe('LoanTableRow.vue', () => {
    it('renders loan details correctly', () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan }
        })

        expect(wrapper.find('.cell-id').text()).toBe(mockLoan.id)
        expect(wrapper.find('.borrower-name').text()).toBe(mockLoan.borrowerName)
        expect(wrapper.find('.amount').text()).toBe(formatCurrency(mockLoan.amount))
        expect(wrapper.find('.status-badge').text()).toBe(mockLoan.status)
        expect(wrapper.find('.cell-close-date time').text()).toBe(formatDate(mockLoan.closeDate))
    })


    it('emits "select" when row is clicked', async () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan }
        })

        await wrapper.trigger('click')
        expect(wrapper.emitted('select')).toBeTruthy()
        expect(wrapper.emitted('select')![0]).toEqual([mockLoan])
    })

    it('emits "select" when Enter key is pressed', async () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan }
        })

        await wrapper.trigger('keydown', { key: 'Enter' })
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('emits "select" when Space key is pressed', async () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan }
        })

        await wrapper.trigger('keydown', { key: ' ' })
        expect(wrapper.emitted('select')).toBeTruthy()
    })

    it('applies row height via style prop', () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan, height: 80 }
        })

        expect(wrapper.attributes('style')).toContain('height: 80px;')
    })

    it('has accessibility attributes', () => {
        const wrapper = mount(LoanTableRow, {
            props: { loan: mockLoan }
        })

        const row = wrapper.find('tr')
        expect(row.attributes('role')).toBe('row')
        expect(row.attributes('tabindex')).toBe('0')
    })
})
