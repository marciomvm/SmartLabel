'use client'

import { useTransition } from 'react'
import { updateBatchStatus } from '@/actions/batch'
import { Button } from '@/components/ui/button'
import { BatchStatus } from '@/types'
import { AlertTriangle, DollarSign, ArrowRight } from 'lucide-react'

export function BatchActions({ id, currentStatus }: { id: string, currentStatus: BatchStatus }) {
    const [isPending, startTransition] = useTransition()

    const handleUpdate = (status: BatchStatus) => {
        startTransition(async () => {
            await updateBatchStatus(id, status)
        })
    }

    if (currentStatus === 'CONTAMINATED') {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center font-bold">
                ⚠ This batch is contaminated
            </div>
        )
    }

    if (currentStatus === 'SOLD') {
        return (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-bold">
                ✅ This batch has been sold
            </div>
        )
    }

    return (
        <div className="grid grid-cols-2 gap-3">
            {currentStatus === 'INCUBATING' && (
                <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleUpdate('READY')}
                    className="col-span-2 bg-blue-100 text-blue-800 hover:bg-blue-200"
                >
                    Mark Ready <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}

            {currentStatus === 'READY' && (
                <Button
                    variant="secondary"
                    disabled={isPending}
                    onClick={() => handleUpdate('SOLD')}
                    className="bg-green-100 text-green-800 hover:bg-green-200"
                >
                    <DollarSign className="mr-2 h-4 w-4" /> Mark Sold
                </Button>
            )}

            <Button
                variant="destructive"
                disabled={isPending}
                onClick={() => handleUpdate('CONTAMINATED')}
                className={currentStatus === 'READY' ? '' : 'col-span-2'}
            >
                <AlertTriangle className="mr-2 h-4 w-4" /> Contaminated
            </Button>
        </div>
    )
}
