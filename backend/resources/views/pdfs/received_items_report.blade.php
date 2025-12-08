<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Received Items Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #777; padding: 5px; text-align: left; vertical-align: top; }
        th { background-color: #4CAF50; color: white; }
        td.right { text-align: right; }
        h2 { margin-bottom: 5px; }
        small { color: gray; font-size: 13px; display: block; margin-bottom: 5px; }
    </style>
</head>
<body>
    <h2>
        Received Items Report
        @if(!empty($supplier) && strtolower($supplier) !== 'all')
            <small>({{ $supplier }})</small>
        @endif
        @if(!empty($month))
            <small>({{ \Carbon\Carbon::createFromFormat('Y-m', $month)->format('F Y') }})</small>
        @endif
    </h2>

    <small>Generated on: {{ $generatedAt }}</small>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>PO Number</th>
                <th>Item Name</th>
                <th>Supplier</th>
                <th>Received Date</th>
                <th class="right">Received Qty (pcs)</th>
            </tr>
        </thead>
        <tbody>
            @forelse($receivedItems as $index => $item)
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->po_number }}</td>
                    <td>{{ $item->item_name }}</td>
                    <td>{{ $item->supplier_name }}</td>
                    <td>{{ $item->received_date ? \Carbon\Carbon::parse($item->received_date)->format('M d, Y') : '-' }}</td>
                    <td class="right">{{ number_format((float)$item->quantity_received) }} pcs</td>
                </tr>
            @empty
                <tr>
                    <td colspan="6" style="text-align:center;">No received items found.</td>
                </tr>
            @endforelse
        </tbody>
    </table>
</body>
</html>