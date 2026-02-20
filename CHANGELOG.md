# Changelog - Mushroom Factory System

All notable changes to this project will be documented in this file.

## [1.4.2] - 2026-02-20

### Added
- **Inventory Filtering**: New select filter in `BatchesTable` to filter by Batch Type (`GRAIN`, `SUBSTRATE`).
- **Bulk Creation Enhancements**:
  - "Add +1" button to quickly add an extra batch with same parameters.
  - Individual "Print" actions in the results table for row-level control.
- **Whats New Page**: Dedicated `/changelog` page accessible from the header.

### Changed
- **Branding Update**: System renamed from "Mushroom" to **FungiHub** with updated titles and metadata.
- **Default Label Size**: Updated printer configuration and UI defaults to **40x20mm (Small/Economic)**.
- **Backend Optimization**: `getBatchesPaginated` action now supports server-side type filtering via Supabase.

## [1.4.1] - 2026-02-19

### Added
- **V3 Dashboard**: Complete redesign of the home page with glassmorphism and animated stats.
- **Real-time Search**: Instant filtering of the batches grid without full page reloads.

### Fixed
- **LC Batch Visibility**: Added `lc_batch` field to the inventory grid for better parent tracking.

## [1.4.0] - 2026-02-15

### Added
- **Sales Module**: New page to track and mark batches as sold.
- **Sales Stats**: 30-day sales overview on the dashboard.
- **Liquid Culture Management**: Dedicated section for tracking strains and LC volumes.
