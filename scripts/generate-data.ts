import { writeFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

class SeededRandom {
    private seed: number

    constructor(seed: number) {
        this.seed = seed
    }

    next(): number {
        this.seed = (this.seed * 9301 + 49297) % 233280
        return this.seed / 233820
    }

    nextInt(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1)) + min
    }

    choice<T>(array: T[]): T {
        return array[this.nextInt(0, array.length - 1)]
    }
}

interface Loan {
    id: number
    borrowerName: string
    amount: number
    status: 'Pending' | 'Approved' | 'Rejected'
    closeDate: string
}

function generateLoanData(count: number, seed = 12345): Loan[]{
    const rng = new SeededRandom(seed)
    const loans: Loan[] = []
    
    const firstNames = [
        'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa',
        'James', 'Maria', 'Robert', 'Anna', 'William', 'Emma', 'Richard', 'Olivia',
        'Thomas', 'Ava', 'Charles', 'Isabella', 'Joseph', 'Sophia', 'Christopher', 'Charlotte',
        'Daniel', 'Mia', 'Matthew', 'Amelia', 'Anthony', 'Harper', 'Mark', 'Evelyn'
    ]

    const lastNames = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
        'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas',
        'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White',
        'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young'
    ]

    const statuses: ('Pending' | 'Approved' | 'Rejected')[] = ['Pending', 'Approved', 'Rejected']

    for (let i = 1; i <= count; i++){
        const firstName = rng.choice(firstNames)
        const lastName = rng.choice(lastNames)
        const amount = rng.nextInt(1000, 500000)
        const status = rng.choice(statuses)

        const startDate = new Date('2024-01-01')
        const endDate = new Date('2025-12-31')
        const randomTime = startDate.getTime() + rng.next() * (endDate.getTime() - startDate.getTime())
        const closeDate = new Date(randomTime).toISOString().split('T')[0]


        loans.push({
            id: i,
            borrowerName: `${firstName} ${lastName}`,
            amount,
            status,
            closeDate
        })
    }
    return loans
}

function main() {
    try {
        // Create data directory if it doesn't exist
        mkdirSync(resolve(process.cwd(), 'public/data'), { recursive: true })

        // Generate full dataset (50,000 records)
        console.log('Generating 50,000 loan records...')
        const fullData = generateLoanData(50000)
        writeFileSync(
            resolve(process.cwd(), 'public/data/loans.json'),
            JSON.stringify(fullData, null, 2)
        )
        console.log('✅ Generated public/data/loans.json')

        // Generate small dataset (100 records) for quick development
        console.log('Generating 100 loan records for development...')
        const smallData = generateLoanData(100, 54321) // Different seed for variety
        writeFileSync(
            resolve(process.cwd(), 'public/data/loans_100.json'),
            JSON.stringify(smallData, null, 2)
        )
        console.log('✅ Generated public/data/loans_100.json')

        console.log('Data generation complete!')
    } catch (error) {
        console.error('Error generating data:', error)
        process.exit(1)
    }
}

main()