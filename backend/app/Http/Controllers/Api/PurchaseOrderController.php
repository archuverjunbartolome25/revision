<?php

namespace App\Http\Controllers\Api;

use Barryvdh\DomPDF\Facade\Pdf;
use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\Inventory;
use App\Models\InventoryRawmat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index()
    {
        return response()->json(PurchaseOrder::with('items')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'po_number'      => 'required|unique:purchase_orders',
            'supplier_name'  => 'required|string',
            'order_date'     => 'required|date',
            'expected_date'  => 'required|date',
            'status'         => 'required|string',
            'amount'         => 'required|numeric'
        ]);

        $order = PurchaseOrder::create($request->only([
            'po_number', 'supplier_name', 'order_date', 'expected_date', 'status', 'amount'
        ]));

        return response()->json($order, 201);
    }

    public function destroy($id)
    {
        $order = PurchaseOrder::findOrFail($id);
        $order->items()->delete();
        $order->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    public function generateDeliveryNote($id)
    {
        $order = PurchaseOrder::with('items')->findOrFail($id);

        if (!in_array(strtolower(trim($order->status)), ['completed', 'partially received'])) {
            abort(403, 'Delivery note only available after some items are received.');
        }

        $receivedItems = $order->items->filter(fn($item) => $item->received_quantity > 0);

        $pdf = Pdf::loadView('pdfs.delivery_note', [
            'order' => $order,
            'items' => $receivedItems
        ]);

        return $pdf->download('delivery_note_' . $order->po_number . '.pdf');
    }

    public function update(Request $request, $id)
    {
        $order = PurchaseOrder::findOrFail($id);

        $request->validate([
            'supplier_name' => 'required|string',
            'order_date'    => 'required|date',
            'expected_date' => 'required|date',
            'status'        => 'required|string',
            'amount'        => 'required|numeric'
        ]);

        $order->update($request->only([
            'supplier_name', 'order_date', 'expected_date', 'status', 'amount'
        ]));

        return response()->json([
            'message' => 'Purchase order updated successfully',
            'order'   => $order
        ]);
    }

 

    public function receiveItems(Request $request, $id)
    {
        $request->validate([
            'item_id'  => 'required|exists:purchase_order_items,id',
            'quantity' => 'required|integer|min:1',
            'image'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);
    
        $affectedRawMatIds = [];
        $affectedInventoryIds = [];
    
        DB::beginTransaction();
    
        try {
            $order = PurchaseOrder::with('items')->findOrFail($id);
            $item  = $order->items()->where('id', $request->item_id)->firstOrFail();
    
            $qty = (int) $request->quantity;
            $remaining = ($item->quantity ?? 0) - ($item->received_quantity ?? 0);
    
            if ($qty > $remaining) {
                DB::rollBack();
                return response()->json([
                    'error' => "Cannot receive more than remaining quantity ({$remaining})."
                ], 422);
            }
            $item->received_quantity = ($item->received_quantity ?? 0) + $qty;
            $item->save();
    
            $imagePath = null;
            $imageMime = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imageMime = $file->getMimeType();
                $imagePath = $file->store('receipts', 'public');
            }
    
            $receiptId = DB::table('purchase_receipts')->insertGetId([
                'purchase_order_id'      => $order->id,
                'purchase_order_item_id' => $item->id,
                'po_number'              => $order->po_number,
                'item_name'              => $item->item_name,
                'quantity_received'      => $qty,
                'received_date'          => now(),
                'image_path'             => $imagePath,
                'image_mime'             => $imageMime,
                'created_at'             => now(),
                'updated_at'             => now(),
            ]);
    
            $employeeId = $order->employee_id ?? ($request->employee_id ?? auth()->user()->employeeID ?? 'UNKNOWN');
    
            $rawMat = InventoryRawmat::whereRaw('LOWER(item) = ?', [strtolower($item->item_name)])->first();
            if ($rawMat) {
                $conversion = $rawMat->conversion ?? 1;
                $receivedPcs = $qty * $conversion;
    
                // Add to quantity_pieces
                $rawMat->quantity_pieces += $receivedPcs;
                
                // Recalculate quantity based on conversion
                $rawMat->quantity = floor($rawMat->quantity_pieces / $conversion);
                
                $rawMat->save();
                
                // Track for notification check
                $affectedRawMatIds[] = $rawMat->id;
    
                \App\Models\InventoryActivityLog::create([
                    'employee_id' => $employeeId,
                    'module'      => 'Purchase Order',
                    'type'        => 'Raw Materials',
                    'item_name'   => $item->item_name,
                    'quantity'    => $receivedPcs,
                    'processed_at'=> now(),
                ]);
            } else {
                $finished = Inventory::firstOrCreate(
                    ['item' => $item->item_name],
                    ['unit' => 'pcs', 'quantity' => 0, 'quantity_pcs' => 0, 'low_stock_alert' => 0, 'pcs_per_unit' => 1]
                );
    
                $pcsPerUnit = $finished->pcs_per_unit ?? 1;
                $receivedPcs = $qty * $pcsPerUnit;
    
                $finished->quantity_pcs += $receivedPcs;
                
                $finished->quantity = floor($finished->quantity_pcs / $pcsPerUnit);
                
                $finished->save();
                
                $affectedInventoryIds[] = $finished->id;
    
                \App\Models\InventoryActivityLog::create([
                    'employee_id' => $employeeId,
                    'module'      => 'Purchase Order',
                    'type'        => 'Finished Goods',
                    'item_name'   => $item->item_name,
                    'quantity'    => $receivedPcs,
                    'processed_at'=> now(),
                ]);
            }
    
            $order->load('items');
            $totalOrdered  = $order->items->sum('quantity');
            $totalReceived = $order->items->sum('received_quantity');
            $order->status = $totalReceived === 0
                ? 'Pending'
                : ($totalReceived < $totalOrdered ? 'Partially Received' : 'Completed');
            $order->save();
    
            DB::commit();
    
            $this->checkAndUpdateNotifications($affectedInventoryIds, $affectedRawMatIds);
    
            $receipt = DB::table('purchase_receipts')->where('id', $receiptId)->first();
    
            return response()->json([
                'message' => 'Items received and logged successfully.',
                'order'   => $order,
                'receipt' => $receipt
            ]);
    
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('receiveItems error: ' . $e->getMessage());
            return response()->json([
                'error'   => 'Server error while receiving items.',
                'details' => $e->getMessage(),
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
            \App\Models\InventoryNotification::create($data);
        }
    }
    private function removeNotification($item, string $type)
    {
        \App\Models\InventoryNotification::where('notifiable_type', $type)
            ->where('notifiable_id', $item->id)
            ->delete();
    }

    // ✅ Receive items with image stored in DB as BYTEA + MIME type
// public function receiveItems(Request $request, $id)
// {
//     $request->validate([
//         'item_id'  => 'required|exists:purchase_order_items,id',
//         'quantity' => 'required|integer|min:1',
//         'image'    => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
//     ]);

//     DB::beginTransaction();

//     try {
//         $order = PurchaseOrder::with('items')->findOrFail($id);
//         $item  = $order->items()->where('id', $request->item_id)->firstOrFail();

//         $qty = (int) $request->quantity;
//         $remaining = ($item->quantity ?? 0) - ($item->received_quantity ?? 0);

//         if ($qty > $remaining) {
//             DB::rollBack();
//             return response()->json([
//                 'error' => "Cannot receive more than remaining quantity ({$remaining})."
//             ], 422);
//         }

//         // Update received quantity
//         $item->received_quantity = ($item->received_quantity ?? 0) + $qty;
//         $item->save();

//         // Handle image upload to storage/public
//         $imagePath = null;
//         $imageMime = null;
//         if ($request->hasFile('image')) {
//             $file = $request->file('image');
//             $imageMime = $file->getMimeType();
//             $imagePath = $file->store('receipts', 'public'); // stores in storage/app/public/purchase_receipts
//         }

//         // Insert receipt
//         $receiptId = DB::table('purchase_receipts')->insertGetId([
//             'purchase_order_id'      => $order->id,
//             'purchase_order_item_id' => $item->id,
//             'po_number'              => $order->po_number,
//             'item_name'              => $item->item_name,
//             'quantity_received'      => $qty,
//             'received_date'          => now(),
//             'image_path'             => $imagePath,   // just the file path
//             'image_mime'             => $imageMime,
//             'created_at'             => now(),
//             'updated_at'             => now(),
//         ]);

//         // Update inventory
//         $employeeId = $order->employee_id ?? ($request->employee_id ?? auth()->user()->employeeID ?? 'UNKNOWN');
//         $receivedQty = $qty;

//         $rawMat = InventoryRawmat::whereRaw('LOWER(item) = ?', [strtolower($item->item_name)])->first();
//         if ($rawMat) {
//             $conversion = $rawMat->conversion ?? 1;
//             $receivedQty = $qty * $conversion;

//             $rawMat->quantity += $qty;
//             $rawMat->quantity_pieces += $receivedQty;
//             $rawMat->save();

//             \App\Models\InventoryActivityLog::create([
//                 'employee_id' => $employeeId,
//                 'module'      => 'Purchase Order',
//                 'type'        => 'Raw Materials',
//                 'item_name'   => $item->item_name,
//                 'quantity'    => $receivedQty,
//                 'processed_at'=> now(),
//             ]);
//         } else {
//             $finished = Inventory::firstOrCreate(
//                 ['item' => $item->item_name],
//                 ['unit' => 'pcs', 'quantity' => 0, 'quantity_pcs' => 0, 'low_stock_alert' => 0]
//             );

//             $finished->quantity += $qty;
//             $finished->quantity_pcs += $receivedQty;
//             $finished->save();

//             \App\Models\InventoryActivityLog::create([
//                 'employee_id' => $employeeId,
//                 'module'      => 'Purchase Order',
//                 'type'        => 'Finished Goods',
//                 'item_name'   => $item->item_name,
//                 'quantity'    => $receivedQty,
//                 'processed_at'=> now(),
//             ]);
//         }

//         // Update order status
//         $order->load('items');
//         $totalOrdered  = $order->items->sum('quantity');
//         $totalReceived = $order->items->sum('received_quantity');
//         $order->status = $totalReceived === 0
//             ? 'Pending'
//             : ($totalReceived < $totalOrdered ? 'Partially Received' : 'Completed');
//         $order->save();

//         DB::commit();

//         // Return receipt info (just file path now)
//         $receipt = DB::table('purchase_receipts')->where('id', $receiptId)->first();

//         return response()->json([
//             'message' => 'Items received and logged successfully.',
//             'order'   => $order,
//             'receipt' => $receipt
//         ]);

//     } catch (\Exception $e) {
//         DB::rollBack();
//         \Log::error('receiveItems error: ' . $e->getMessage());
//         return response()->json([
//             'error'   => 'Server error while receiving items.',
//             'details' => $e->getMessage(),
//         ], 500);
//     }
// }

public function upload(Request $request)
{
    $request->validate([
        'file' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        'purchase_receipt_id' => 'required|exists:purchase_receipts,id',
    ]);

    $file = $request->file('file');

    // Store file in public storage (storage/app/public/uploads/receipts)
    $path = $file->store('uploads/receipts', 'public');

    // Update DB with the file path
    DB::table('purchase_receipts')
        ->where('id', $request->purchase_receipt_id)
        ->update(['image_path' => $path]);

    // Return JSON with file_path
    return response()->json([
        'file_path' => $path
    ]);
}

    /** Dashboard counts */
    public function getPendingCount()
    {
        return response()->json(['count' => PurchaseOrder::where('status', 'Pending')->count()]);
    }

    public function getPartialCount()
    {
        return response()->json(['count' => PurchaseOrder::where('status', 'Partially Received')->count()]);
    }

    public function getCompletedCount()
    {
        return response()->json(['count' => PurchaseOrder::where('status', 'Completed')->count()]);
    }

    /** Received items history with Base64 image + MIME */
/** Received items history with file path + MIME */
public function getAllReceivedItems()
{
    $items = DB::table('purchase_receipts')
        ->join('purchase_orders', 'purchase_receipts.purchase_order_id', '=', 'purchase_orders.id')
        ->select(
            'purchase_receipts.id',
            'purchase_orders.po_number',
            'purchase_orders.supplier_name',
            'purchase_receipts.item_name',
            'purchase_receipts.quantity_received',
            'purchase_receipts.received_date',
            'purchase_receipts.image_path',  // just the file path
            'purchase_receipts.image_mime'
        )
        ->orderBy('purchase_receipts.received_date', 'desc')
        ->get();

    return response()->json($items);
}

}
