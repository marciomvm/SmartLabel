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

    return (
        <div className="space-y-4">
            {/* Status Alerts */}
            {currentStatus === 'CONTAMINATED' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-center font-bold flex items-center justify-center gap-2">
                    <AlertTriangle className="h-5 w-5" /> This batch is contaminated
                </div>
            )}

            {currentStatus === 'SOLD' && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-center font-bold flex items-center justify-center gap-2">
                    <DollarSign className="h-5 w-5" /> This batch has been sold
                </div>
            )}

            {currentStatus === 'ARCHIVED' && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 text-center font-bold">
                    🗄️ This batch is archived
                </div>
            )}

            {/* Actions Grid */}
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
                    <>
                        <Button
                            variant="secondary"
                            disabled={isPending}
                            onClick={() => handleUpdate('SOLD')}
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                        >
                            <DollarSign className="mr-2 h-4 w-4" /> Mark Sold
                        </Button>
                        <Button
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleUpdate('INCUBATING')}
                            className="col-span-2 border-amber-200 text-amber-800 hover:bg-amber-50"
                        >
                            <AlertTriangle className="mr-2 h-4 w-4" /> Not Ready (Keep Incubating)
                        </Button>
                    </>
                )}

                {/* Contamination is possible for Incubating and Ready */}
                {(currentStatus === 'INCUBATING' || currentStatus === 'READY') && (
                    <Button
                        variant="destructive"
                        disabled={isPending}
                        onClick={() => handleUpdate('CONTAMINATED')}
                        className={currentStatus === 'READY' ? '' : 'col-span-2'}
                    >
                        <AlertTriangle className="mr-2 h-4 w-4" /> Contaminated
                    </Button>
                )}

                {/* Archive Button for Terminal States */}
                {(currentStatus === 'SOLD' || currentStatus === 'READY' || currentStatus === 'CONTAMINATED') && (
                    <Button
                        variant="ghost"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdate('ARCHIVED')}
                        className="col-span-2 text-muted-foreground hover:bg-muted"
                    >
                        Archive Batch
                    </Button>
                )}

                {currentStatus === 'ARCHIVED' && (
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={isPending}
                        onClick={() => handleUpdate('READY')} // Restore to ready? Or just incubating? Let's assume Ready or generic restore. Actually usually archiving is final. 
                        // Let's allow un-archive to Ready if it was accidental? Or just status 'INCUBATING'? 
                        // For now, let's look at the implementation plan. No un-archive specified. 
                        // But handy to have "Restore". Let's set to INCUBATING for safety? Or PREVIOUS? We don't track previous easily here.
                        // Let's just NOT render any button for ARCHIVED for now, effectively read-only. 
                        // Or maybe a "Restore" button that sets to INCUBATING?
                        // Let's leave it empty for now as per plan.
                        className="hidden"
                    >
                        Restore
                    </Button>
                )}
            </div>
        </div>
    )
}
