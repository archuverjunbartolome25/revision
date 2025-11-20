<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Purchase Order</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; }
        .header { display: flex; justify-content: space-between; align-items: center; }
        .company { width: 50%; }
        .company h2, .company h3 { margin: 0; }
        .company p { margin: 2px 0; }
        .title { font-size: 22px; color: #004080; font-weight: bold; text-align: left; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        table th, table td { border: 1px solid #000; padding: 6px; text-align: left; }
        .no-border td { border: none; padding: 2px 0; }
        .footer { margin-top: 30px; font-size: 11px; text-align: center; }
        .signature-table { width:100%; margin-top:50px; text-align:center; border:none; border-collapse:collapse; }
        .signature-table td { border:none; padding-top:20px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="company">
            <h2>Balipure Purified Drinking Water</h2>
            <h3>Bali Champion Bottlers Inc.</h3>
            <p>VAT Registered: TIN 009-068-451-000</p>
        </div>
        <div class="title">Purchase Order</div>
    </div>

    <table class="no-border">
        <tr>
            <td><strong>Order #:</strong> {{ $order->po_number }}</td>
            <td><strong>Order Date:</strong> {{ $order->order_date }}</td>
        </tr>
        <tr>
            <td><strong>Delivery Note #:</strong> DN-{{ $order->id }}</td>
            <td><strong>Expected Date:</strong> {{ $order->expected_date }}</td>
        </tr>
        <tr>
            <td><strong>Supplier:</strong> {{ $order->supplier_name }}</td>
            <td><strong>Status:</strong> {{ ucfirst($order->status) }}</td>
        </tr>
    </table>

    <h4>ORDERED ITEMS:</h4>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Description</th>
                <th>Ordered</th>
                <th>Delivered</th>
                <th>Outstanding</th>
                <th>Unit Cost</th>
                <th>Total Price</th>
            </tr>
        </thead>
        <tbody>
            @php $grandTotal = 0; @endphp
            @foreach($order->items as $index => $item)
                @php
                    // Fetch the unit cost from InventoryRawmat table
                    $rawMaterial = \App\Models\InventoryRawmat::where('item', $item->item_name)->first();
                    $unitCost = $rawMaterial ? $rawMaterial->unit_cost : 0;
                    $totalPrice = $unitCost * $item->quantity;
                    $grandTotal += $totalPrice;
                @endphp
                <tr>
                    <td>{{ $index + 1 }}</td>
                    <td>{{ $item->item_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ $item->received_quantity }}</td>
                    <td>{{ $item->quantity - $item->received_quantity }}</td>
                    <td>₱{{ number_format($unitCost, 2) }}</td>
                    <td>₱{{ number_format($totalPrice, 2) }}</td>
                </tr>
            @endforeach
            <tr>
                <td colspan="6" style="text-align:right; font-weight:bold;">Grand Total:</td>
                <td style="font-weight:bold;">₱{{ number_format($grandTotal, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="footer">
        <p>Notice must be given to us of any goods not received within 10 days taken from the date of dispatch stated on invoice.</p>
        <p>Any shortage or damage must be notified within 72 hours of receipt of goods.</p>
        <p>No goods may be returned without prior authorization from the company.</p>
        <p><strong>Thank you for your business!</strong></p>
        <p>L-21 B-13 Malabanias Road, Josefa Subdivision, Brgy. Malabanias, Angeles City, Pampanga</p>
        <p>sales.balipure@gmail.com</p>
    </div>

    <table class="signature-table">
        <tr>
            <td>__________________________</td>
            <td>__________________________</td>
            <td>__________________________</td>
        </tr>
        <tr>
            <td>Prepared By</td>
            <td>Approved By</td>
            <td>Received By</td>
        </tr>
    </table>

</body>
</html>
