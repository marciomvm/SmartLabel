/**
 * Parses raw barcode/scanner output to extract the readable_id.
 * 
 * Barcodes encode data as: batch_id~TYPE~Strain (or with | separator)
 * e.g. "S-26022026-01~SUBSTRATE~Lions Mane"
 * 
 * This function extracts just the readable_id (e.g. "S-26022026-01").
 * If no separator is found, returns the input as-is (manual entry).
 */
export function parseScanCode(raw: string) {
    const trimmed = raw.trim()
    // Split by ~ or | separator
    const parts = trimmed.split(/[~|]/)
    return {
        readableId: parts[0]?.trim() || trimmed,
        type: parts[1]?.trim() || undefined,
        strain: parts[2]?.trim() || undefined,
    }
}
