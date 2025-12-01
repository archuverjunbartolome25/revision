<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\SalesOrder;
use App\Models\Inventory;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;


class SalesOrderController extends Controller
{
    // ----- Count Methods -----
    public function getPendingCount()
    {
        $count = SalesOrder::where('order_type', 'Pending')->count();
        return response()->json(['count' => $count]);
    }

    public function getProcessingCount()
    {
        $count = SalesOrder::where('order_type', 'Processing')->count();
        return response()->json(['count' => $count]);
    }

    public function getCompletedCount()
    {
        $count = SalesOrder::where('order_type', 'Completed')->count();
        return response()->json(['count' => $count]);
    }

    public function getCsoCount()
    {
        $count = SalesOrder::where('order_type', 'CSO')->count();
        return response()->json(['count' => $count]);
    }

    public function getRtvCount()
    {
        $count = SalesOrder::where('order_type', 'RTV')->count();
        return response()->json(['count' => $count]);
    }

    public function getDisposalCount()
    {
        $count = SalesOrder::where('order_type', 'Disposal')->count();
        return response()->json(['count' => $count]);
    }

    // ----- List & Filter -----
    public function index(Request $request)
    {
        if ($request->has('order_type') && $request->input('order_type') !== 'All') {
            return SalesOrder::where('order_type', $request->input('order_type'))->get();
        }
        return SalesOrder::all();
    }

    // ----- Show by ID -----
    public function show($id)
    {
        $order = SalesOrder::with('customer')->findOrFail($id);
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $request->validate([
            'customer_id'   => 'required|exists:customers,id',
            'location'      => 'required|string',
            'date'          => 'required|date',
            'delivery_date' => 'required|date',
            'order_type'    => 'required|string',
            'products'      => 'required|array|min:1',
            'products.*.product_id' => 'required|integer|exists:inventories,id',
            'products.*.quantity'   => 'required|integer|min:1',
            'amount'        => 'required|numeric',
        ]);

        $employeeId = $request->employee_id ?? auth()->user()->employeeID ?? 'UNKNOWN';
        
        $affectedInventoryIds = [];

        DB::beginTransaction();

        try {
            $quantities = [];
            $productsList = [];

            foreach ($request->products as $p) {
                $inventory = DB::table('inventories')->find($p['product_id']);

                if ($inventory) {
                    $productName = $inventory->item;
                    $qty = intval($p['quantity']);

                    if ($qty > 0) {
                        $quantities[$productName] = $qty; 
                        $productsList[] = $productName;
                    }
                }
            }

            $productsJson = json_encode($productsList);

            $order = SalesOrder::create([
                'customer_id'   => $request->customer_id,
                'location'      => $request->location,
                'date'          => $request->date,
                'delivery_date' => $request->delivery_date,
                'order_type'    => $request->order_type,
                'products'      => $productsJson,
                'amount'        => $request->amount,
                'quantities'    => $quantities, // JSONB or array
                'status'        => 'Pending',
            ]);

            // 🔹 Deduct inventory & log activity
            foreach ($quantities as $product => $casesOrdered) {
                if ($casesOrdered <= 0) continue;

                $inventory = DB::table('inventories')->where('item', $product)->first();
                if (!$inventory) continue;

                $pcsPerUnit = $inventory->pcs_per_unit ?? 1;
                $pcsOrdered = $casesOrdered * $pcsPerUnit;

                DB::table('inventories')->where('id', $inventory->id)->update([
                    'quantity'     => max(0, $inventory->quantity - $casesOrdered),
                    'quantity_pcs' => max(0, $inventory->quantity_pcs - $pcsOrdered),
                    'updated_at'   => now(),
                ]);
                
                // Track for notification check
                $affectedInventoryIds[] = $inventory->id;

                // Log inventory deduction
                \App\Models\InventoryActivityLog::create([
                    'employee_id'  => $employeeId,
                    'module'       => 'Sales Order',
                    'type'         => 'Finished Goods',
                    'item_name'    => $product,
                    'quantity'     => $pcsOrdered,
                    'processed_at' => now(),
                ]);
            }

            DB::commit();
            $this->checkAndUpdateNotifications($affectedInventoryIds, []);

            return response()->json([
                'message' => 'Sales order created and inventory updated successfully.',
                'data'    => $order
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Sales Order Creation Error: ' . $e->getMessage());

            return response()->json([
                'error' => 'Failed to create sales order: ' . $e->getMessage()
            ], 500);
        }
    }

    
    private function checkAndUpdateNotifications(array $finishedGoodsIds, array $rawMaterialIds)
    {
        foreach ($finishedGoodsIds as $id) {
            $item = \App\Models\Inventory::find($id);
            if ($item) {
                $this->checkItemStock($item, 'App\Models\Inventory');
            }
        }
    
        foreach ($rawMaterialIds as $id) {
            $item = \App\Models\InventoryRawMat::find($id);
            if ($item) {
                $this->checkItemStock($item, 'App\Models\InventoryRawMat');
            }
        }
    }
    
    private function checkItemStock($item, string $type)
    {
        $quantity = $item->quantity ?? 0;
        $lowStockAlert = $item->low_stock_alert ?? 0;
    
        if ($lowStockAlert <= 0) {
            return;
        }
    
        $warningThreshold = $lowStockAlert * 1.5;
    
        $priority = null;
    
        if ($quantity <= $lowStockAlert) {
            $priority = 'critical';
        }
        elseif ($quantity <= $warningThreshold) {
            $priority = 'warning';
        }
    
        if ($priority) {
            $this->createOrUpdateNotification($item, $type, $priority, $quantity, $lowStockAlert);
        } else {
            // Remove notification if stock is back to normal
            $this->removeNotification($item, $type);
        }
    }
    
    private function createOrUpdateNotification($item, string $type, string $priority, float $quantity, float $lowStockAlert)
    {
        $notification = \App\Models\InventoryNotification::where('notifiable_type', $type)
            ->where('notifiable_id', $item->id)
            ->first();
    
        $data = [
            'notifiable_type' => $type,
            'notifiable_id' => $item->id,
            'item_name' => $item->item,
            'priority' => $priority,
            'current_quantity' => $quantity,
            'low_stock_alert' => $lowStockAlert,
            'unit' => $item->unit ?? null,
        ];
    
        if ($notification) {
            if ($notification->priority === 'warning' && $priority === 'critical') {
                $data['is_read'] = false;
                $data['read_at'] = null;
            }
            
            $notification->update($data);
        } else {
            // Create new notification
            \App\Models\InventoryNotification::create($data);
        }
    }

    private function removeNotification($item, string $type)
    {
        \App\Models\InventoryNotification::where('notifiable_type', $type)
            ->where('notifiable_id', $item->id)
            ->delete();
    }
    
// public function store(Request $request)
// {
//     // ✅ Validate only what is sent from frontend
//     $request->validate([
//         'customer_id'   => 'required|exists:customers,id',
//         'location'      => 'required|string',
//         'date'          => 'required|date',
//         'delivery_date' => 'required|date',
//         'order_type'    => 'required|string',
//         'products'      => 'required|array|min:1',
//         'products.*.product_id' => 'required|integer|exists:inventories,id',
//         'products.*.quantity'   => 'required|integer|min:1',
//         'amount'        => 'required|numeric',
//     ]);

//     $employeeId = $request->employee_id ?? auth()->user()->employeeID ?? 'UNKNOWN';

//     DB::beginTransaction();

//     try {
//         // 🔹 Convert products array to productName => quantity format
//         $quantities = [];
//         $productsList = [];

//         foreach ($request->products as $p) {
//             $inventory = DB::table('inventories')->find($p['product_id']);

//             if ($inventory) {
//                 $productName = $inventory->item;
//                 $qty = intval($p['quantity']);

//                 if ($qty > 0) {
//                     $quantities[$productName] = $qty; 
//                     $productsList[] = $productName;
//                 }
//             }
//         }

//         // Encode only product names
//         $productsJson = json_encode($productsList);

//         // 🔹 Create the sales order
//         $order = SalesOrder::create([
//             'customer_id'   => $request->customer_id,
//             'location'      => $request->location,
//             'date'          => $request->date,
//             'delivery_date' => $request->delivery_date,
//             'order_type'    => $request->order_type,
//             'products'      => $productsJson,
//             'amount'        => $request->amount,
//             'quantities'    => $quantities, // JSONB or array
//             'status'        => 'Pending',
//         ]);

//         // 🔹 Deduct inventory & log activity
//         foreach ($quantities as $product => $casesOrdered) {
//             if ($casesOrdered <= 0) continue;

//             $inventory = DB::table('inventories')->where('item', $product)->first();
//             if (!$inventory) continue;

//             $pcsPerUnit = $inventory->pcs_per_unit ?? 1;
//             $pcsOrdered = $casesOrdered * $pcsPerUnit;

//             DB::table('inventories')->where('id', $inventory->id)->update([
//                 'quantity'     => max(0, $inventory->quantity - $casesOrdered),
//                 'quantity_pcs' => max(0, $inventory->quantity_pcs - $pcsOrdered),
//                 'updated_at'   => now(),
//             ]);

//             // Log inventory deduction
//             \App\Models\InventoryActivityLog::create([
//                 'employee_id'  => $employeeId,
//                 'module'       => 'Sales Order',
//                 'type'         => 'Finished Goods',
//                 'item_name'    => $product,
//                 'quantity'     => $pcsOrdered,
//                 'processed_at' => now(),
//             ]);
//         }

//         DB::commit();

//         return response()->json([
//             'message' => 'Sales order created and inventory updated successfully.',
//             'data'    => $order
//         ], 201);

//     } catch (\Exception $e) {
//         DB::rollBack();
//         \Log::error('Sales Order Creation Error: ' . $e->getMessage());

//         return response()->json([
//             'error' => 'Failed to create sales order: ' . $e->getMessage()
//         ], 500);
//     }
// }

    // ----- Update -----
    public function update(Request $request, $id)
    {
        $order = SalesOrder::findOrFail($id);

        $request->validate([
            'order_type' => 'required|string|in:CSO,RTV,Disposal',
        ]);

        $order->order_type = $request->order_type;
        $order->save();

        return response()->json(['message' => 'Updated successfully', 'order' => $order]);
    }

    // ----- Update Status Only -----
public function updateStatus(Request $request, $id)
{
    $request->validate([
        'status' => 'required|string|in:Pending,Processing,Delivered,Completed',
    ]);

    $order = SalesOrder::findOrFail($id);
    $order->status = $request->status;
    $order->save();

    return response()->json([
        'message' => 'Status updated successfully',
        'order' => $order,
    ]);
}
public function markDelivered(Request $request, $id)
{
    $request->validate([
        'date_delivered' => 'required|date',
    ]);

    $order = SalesOrder::findOrFail($id);
    $order->status = 'Delivered';
    $order->date_delivered = $request->date_delivered;
    $order->save();

    return response()->json(['message' => 'Order marked as Delivered successfully', 'data' => $order]);
}

    // ----- Delete -----
    public function destroy(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:sales_orders,id',
        ]);

        SalesOrder::whereIn('id', $request->ids)->delete();

        return response()->json(['message' => 'Selected orders deleted successfully']);
    }

    // ----- PDF Generation -----
    public function generatePdf($id)
    {
        $order = SalesOrder::with('customer')->findOrFail($id);

        $datePart = str_replace('-', '', $order->date);
        $idPart = str_pad($order->id, 4, '0', STR_PAD_LEFT);
        $orderNumber = "SO-{$datePart}-{$idPart}";

        $pdf = PDF::loadView('pdfs.sales_order', [
            'order' => $order,
            'customer' => $order->customer,
            'orderNumber' => $orderNumber
        ]);

        return $pdf->download('sales-order-' . $order->id . '.pdf');
    }
public function mostSelling()
{
    try {
        $totals = \DB::table('sales_orders')
            ->selectRaw('
                COALESCE(SUM("qty_350ml"), 0) as total_350ml,
                COALESCE(SUM("qty_500ml"), 0) as total_500ml,
                COALESCE(SUM("qty_1L"), 0) as total_1l,
                COALESCE(SUM("qty_6L"), 0) as total_6l
            ')
            ->whereRaw('EXTRACT(MONTH FROM "date") = ?', [now()->month])
            ->whereRaw('EXTRACT(YEAR FROM "date") = ?', [now()->year])
            ->first();

        $products = [
            "350ml" => $totals->total_350ml,
            "500ml" => $totals->total_500ml,
            "1L"    => $totals->total_1l, // ✅ lowercase alias matches
            "6L"    => $totals->total_6l,
        ];

        $topProduct = collect($products)->sortDesc()->keys()->first();
        $topQty = $products[$topProduct];

return response()->json([
    "success" => true,
    "top_product" => $topProduct,
    "total_sold" => number_format($topQty), // ✅ formats with thousands separator
    "all_products" => collect($products)->map(fn($qty) => number_format($qty))
]);

    } catch (\Exception $e) {
        return response()->json([
            "success" => false,
            "message" => $e->getMessage()
        ], 500);
    }
}
public function topProducts()
{
    $month = now()->month;
    $year = now()->year;

    $totals = DB::table('sales_orders')
        ->selectRaw('
            COALESCE(SUM((quantities->>\'350ml\')::int), 0) as total_350ml,
            COALESCE(SUM((quantities->>\'500ml\')::int), 0) as total_500ml,
            COALESCE(SUM((quantities->>\'1L\')::int), 0) as total_1l,
            COALESCE(SUM((quantities->>\'6L\')::int), 0) as total_6l
        ')
        ->whereRaw('EXTRACT(MONTH FROM date) = ?', [$month])
        ->whereRaw('EXTRACT(YEAR FROM date) = ?', [$year])
        ->first();

    // Build array of products
    $products = [
        ['product' => '350ml', 'total_sales' => intval($totals->total_350ml ?? 0)],
        ['product' => '500ml', 'total_sales' => intval($totals->total_500ml ?? 0)],
        ['product' => '1L',    'total_sales' => intval($totals->total_1l ?? 0)],
        ['product' => '6L',    'total_sales' => intval($totals->total_6l ?? 0)],
    ];

    // Sort all products descending by total sales
    usort($products, fn($a, $b) => $b['total_sales'] <=> $a['total_sales']);

    return response()->json($products);
}

// Total Sales Orders
public function totalCount()
{
    $count = SalesOrder::count();
    return response()->json(['count' => $count]);
}
public function getSalesByYear(Request $request)
{
    $year = $request->input('year', now()->year);

    $sales = SalesOrder::selectRaw('
            EXTRACT(MONTH FROM date) as month,
            SUM(amount) as total_amount
        ')
        ->whereYear('date', $year)
        ->groupBy('month')
        ->orderBy('month')
        ->get();

    return response()->json($sales);
}

}
