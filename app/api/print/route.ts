import { NextRequest, NextResponse } from 'next/server'

const PRINT_SERVICE_URL = process.env.PRINT_SERVICE_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        const response = await fetch(`${PRINT_SERVICE_URL}/print-label`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        })

        const data = await response.json()

        return NextResponse.json(data)
    } catch (error) {
        console.error('Print service error:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Print service not available. Make sure the Python service is running.',
                instructions: [
                    '1. Open a new terminal',
                    '2. cd print-service',
                    '3. pip install flask flask-cors pillow qrcode[pil] bleak',
                    '4. python app.py'
                ]
            },
            { status: 503 }
        )
    }
}

export async function GET() {
    try {
        const response = await fetch(`${PRINT_SERVICE_URL}/health`)
        const data = await response.json()
        return NextResponse.json(data)
    } catch (error) {
        return NextResponse.json(
            { status: 'unavailable', message: 'Print service not running' },
            { status: 503 }
        )
    }
}
