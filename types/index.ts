export type BatchType = 'GRAIN' | 'SUBSTRATE' | 'BULK'
export type BatchStatus = 'INCUBATING' | 'READY' | 'SOLD' | 'CONTAMINATED' | 'ARCHIVED'

export interface Batch {
    id: string
    readable_id: string
    type: BatchType
    strain_id?: string
    status: BatchStatus
    parent_id?: string
    lc_batch?: string
    notes?: string
    created_at: string
    updated_at: string
}

export interface Strain {
    id: string
    name: string
    colonization_days: number
}

export type LCStatus = 'ACTIVE' | 'EXHAUSTED' | 'CONTAMINATED'

export interface LiquidCulture {
    id: string
    readable_id: string
    strain_id?: string
    strain?: Strain
    status: LCStatus
    volume_ml?: number
    notes?: string
    created_at: string
    updated_at: string
}
