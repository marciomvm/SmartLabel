export type BatchType = 'GRAIN' | 'SUBSTRATE' | 'BULK'
export type BatchStatus = 'INCUBATING' | 'READY' | 'SOLD' | 'CONTAMINATED'

export interface Batch {
    id: string
    readable_id: string
    type: BatchType
    strain_id?: string
    status: BatchStatus
    parent_id?: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface Strain {
    id: string
    name: string
    colonization_days: number
}
