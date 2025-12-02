<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionOutputController extends Controller
{
    public function index()
    {
        return DB::table('production_outputs')
            ->select('production_date', 'batch_number', 'product_name', 'quantity_pcs', 'quantity')
            ->orderByDesc('production_date')
            ->get();
    }

    
    public function store(Request $request)
    {
        $request->validate([
            'products' => 'required|array',
            'products.*.product_name' => 'required|string',
            'products.*.quantity_pcs' => 'required|integer|min:1',
            'products.*.raw_materials' => 'nullable|array',
            'batch_number' => 'nullable|string',
        ]);
    
        $employeeId = $request->employee_id ?? auth()->user()->employeeID ?? 'UNKNOWN';
        $batchNumber = $request->batch_number ?? 'BATCH-' . now()->format('YmdHis');
    
        $debugInfo = [];
        
        $affectedFinishedGoods = [];
        $affectedRawMaterials = [];
    
        DB::beginTransaction();
    
        try {
            foreach ($request->products as $prod) {
                $productName = trim($prod['product_name']);
                $quantityPcs = (int) $prod['quantity_pcs'];
    
                $finishedGood = \App\Models\Inventory::whereRaw(
                    'LOWER(item) = ?',
                    [strtolower($productName)]
                )->first();
                $pcsPerUnit = $finishedGood->pcs_per_unit ?? 1;
    
                $materialsNeeded = [];
                if ($finishedGood && $finishedGood->materials_needed) {
                    $decoded = json_decode($finishedGood->materials_needed, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        foreach ($decoded as $key => $val) {
                            $materialsNeeded[] = is_numeric($key) ? trim($val) : trim($key);
                        }
                    }
                }
    
                $keyedMaterials = [];
                $selectedSuppliers = [];
    
                $requestRawMaterials = $prod['rawMaterials'] ?? $prod['raw_materials'] ?? [];
                $debugInfo['raw_materials_received'] = $requestRawMaterials;
    
                foreach ($materialsNeeded as $mat) {
                    $keyedMaterials[$mat] = $quantityPcs;
                }
    
                foreach ($requestRawMaterials as $raw) {
                    $matName = trim($raw['material'] ?? $raw['name'] ?? '');
                    $qty = (int) ($raw['quantity'] ?? $quantityPcs);
                    if ($qty <= 0) continue;
                    $keyedMaterials[$matName] = $qty;
    
                    if (!empty($raw['supplier_id'])) {
                        $selectedSuppliers[$matName] = $raw['supplier_id'];
                        $debugInfo['supplier_lookup'][$matName] = [
                            'method' => 'supplier_id_provided',
                            'value' => $raw['supplier_id'],
                        ];
                    } elseif (!empty($raw['supplier'])) {
                        $supplier = DB::table('suppliers')
                            ->whereRaw('LOWER(name) = ?', [strtolower(trim($raw['supplier']))])
                            ->first();
    
                        if ($supplier) {
                            $selectedSuppliers[$matName] = $supplier->id;
                            $debugInfo['supplier_lookup'][$matName] = [
                                'method' => 'name_lookup',
                                'searched_for' => $raw['supplier'],
                                'found_id' => $supplier->id,
                                'found_name' => $supplier->name ?? 'N/A',
                            ];
                        } else {
                            $debugInfo['supplier_lookup'][$matName] = [
                                'method' => 'name_lookup',
                                'searched_for' => $raw['supplier'],
                                'found' => false,
                                'error' => 'Supplier not found in database',
                            ];
                        }
                    }
                }
    
                foreach ($keyedMaterials as $rawMat => $qty) {
                    if (!isset($selectedSuppliers[$rawMat])) {
                        $supplier = DB::table('supplier_offers')
                            ->join('inventory_rawmats', 'inventory_rawmats.id', '=', 'supplier_offers.rawmat_id')
                            ->select('supplier_offers.supplier_id')
                            ->whereRaw('LOWER(inventory_rawmats.item) = ?', [strtolower($rawMat)])
                            ->first();
    
                        if ($supplier) {
                            $selectedSuppliers[$rawMat] = $supplier->supplier_id;
                            $debugInfo['supplier_lookup'][$rawMat] = [
                                'method' => 'auto_assigned',
                                'value' => $supplier->supplier_id,
                            ];
                        } else {
                            $debugInfo['supplier_lookup'][$rawMat] = [
                                'method' => 'auto_assigned',
                                'value' => null,
                                'error' => 'No supplier found',
                            ];
                        }
                    }
                }
    
                $debugInfo['keyed_materials'] = $keyedMaterials;
                $debugInfo['selected_suppliers'] = $selectedSuppliers;
    
                \App\Models\ProductionOutput::create([
                    'employee_id' => $employeeId,
                    'product_name' => $productName,
                    'quantity_pcs' => $quantityPcs,
                    'quantity' => floor($quantityPcs / $pcsPerUnit),
                    'materials_needed' => $keyedMaterials,
                    'selected_suppliers' => $selectedSuppliers,
                    'batch_number' => $batchNumber,
                    'production_date' => now(),
                ]);
    
                if ($finishedGood) {
                    $previousQuantity = $finishedGood->quantity_pcs;
                    $finishedGood->quantity_pcs += $quantityPcs;
                    $finishedGood->quantity = floor($finishedGood->quantity_pcs / $pcsPerUnit);
                    $finishedGood->save();
                
                    $remainingQuantity = $finishedGood->quantity_pcs; 
                
                    $affectedFinishedGoods[] = $finishedGood->id;
                
                    // Log finished goods
                    \App\Models\InventoryActivityLog::create([
                        'employee_id' => $employeeId,
                        'module' => 'Production Output',
                        'type' => 'Finished Goods',
                        'item_name' => $productName,
                        'quantity' => $quantityPcs,
                        'previous_quantity' => $previousQuantity,
                        'remaining_quantity'=> $remainingQuantity,
                        'processed_at' => now(),
                    ]);
                }
    
                foreach ($keyedMaterials as $rawItem => $usedQtyPcs) {
                    $supplierId = $selectedSuppliers[$rawItem] ?? null;
                    $remaining = $usedQtyPcs;
    
                    $debugInfo['deduction'][$rawItem] = [
                        'requested_qty_pcs' => $usedQtyPcs,
                        'supplier_id' => $supplierId,
                    ];
    
                    if ($supplierId) {
                        // Find raw material ID first
                        $rawMaterial = DB::table('inventory_rawmats')
                            ->whereRaw('LOWER(item) = ?', [strtolower($rawItem)])
                            ->first();
    
                        if (!$rawMaterial) {
                            $debugInfo['deduction'][$rawItem]['error'] = 'Raw material not found';
                            continue;
                        }
    
                        $inventories = DB::table('inventory_rawmats as ir')
                            ->join('supplier_offers as so', function ($join) use ($supplierId, $rawMaterial) {
                                $join->on('so.rawmat_id', '=', 'ir.id')
                                    ->where('so.supplier_id', $supplierId)
                                    ->where('so.rawmat_id', $rawMaterial->id);
                            })
                            ->select('ir.*')
                            ->whereRaw('LOWER(ir.item) = ?', [strtolower($rawItem)])
                            ->where('ir.quantity_pieces', '>', 0)
                            ->orderBy('ir.quantity_pieces', 'desc')
                            ->get();
    
                        $debugInfo['deduction'][$rawItem]['inventory_found'] = $inventories->count();
                        $debugInfo['deduction'][$rawItem]['inventory_details'] = $inventories->map(function ($inv) {
                            return [
                                'id' => $inv->id,
                                'item' => $inv->item,
                                'quantity_pieces' => $inv->quantity_pieces,
                            ];
                        })->toArray();
    
                        foreach ($inventories as $stock) {
                            if ($remaining <= 0) break;
                        
                            $deductPcs = min($remaining, $stock->quantity_pieces);
                            $conversion = $stock->conversion ?? 1;
                        
                            // Compute previous quantity before deduction
                            $previousQuantity = $stock->quantity_pieces;
                        
                            // Compute new quantities
                            $newQuantityPieces = max(0, $stock->quantity_pieces - $deductPcs);
                            $newQuantity = floor($newQuantityPieces / $conversion);
                        
                            // Update the inventory
                            DB::table('inventory_rawmats')
                                ->where('id', $stock->id)
                                ->update([
                                    'quantity_pieces' => $newQuantityPieces,
                                    'quantity' => $newQuantity,
                                    'updated_at' => now(),
                                ]);
                        
                            // Track affected inventory items
                            if (!in_array($stock->id, $affectedRawMaterials)) {
                                $affectedRawMaterials[] = $stock->id;
                            }
                        
                            // Log activity with previous and remaining quantities
                            \App\Models\InventoryActivityLog::create([
                                'employee_id' => $employeeId,
                                'module' => 'Production Output',
                                'type' => 'Raw Materials',
                                'item_name' => $rawItem,
                                'quantity' => $deductPcs,
                                'previous_quantity' => $previousQuantity,
                                'remaining_quantity' => $newQuantityPieces,
                                'processed_at' => now(),
                            ]);
                        
                            // Reduce remaining quantity to deduct
                            $remaining -= $deductPcs;
                        }
                    } else {
                        $inventories = DB::table('inventory_rawmats')
                            ->whereRaw('LOWER(item) = ?', [strtolower($rawItem)])
                            ->where('quantity_pieces', '>', 0)
                            ->orderBy('quantity_pieces', 'desc')
                            ->get();
    
                        $debugInfo['deduction'][$rawItem]['inventory_found'] = $inventories->count();
                        $debugInfo['deduction'][$rawItem]['inventory_details'] = $inventories->map(function ($inv) {
                            return [
                                'id' => $inv->id,
                                'item' => $inv->item,
                                'quantity_pieces' => $inv->quantity_pieces,
                            ];
                        })->toArray();
    
                        foreach ($inventories as $stock) {
                            if ($remaining <= 0) break;
                        
                            $deductPcs = min($remaining, $stock->quantity_pieces);
                            $conversion = $stock->conversion ?? 1;
                        
                            // Compute previous quantity before deduction
                            $previousQuantity = $stock->quantity_pieces;
                        
                            // Compute new quantities
                            $newQuantityPieces = max(0, $stock->quantity_pieces - $deductPcs);
                            $newQuantity = floor($newQuantityPieces / $conversion);
                        
                            // Update the inventory
                            DB::table('inventory_rawmats')
                                ->where('id', $stock->id)
                                ->update([
                                    'quantity_pieces' => $newQuantityPieces,
                                    'quantity' => $newQuantity,
                                    'updated_at' => now(),
                                ]);
                        
                            // Track affected inventory items
                            if (!in_array($stock->id, $affectedRawMaterials)) {
                                $affectedRawMaterials[] = $stock->id;
                            }
                        
                            // Log activity including previous and remaining quantities
                            \App\Models\InventoryActivityLog::create([
                                'employee_id' => $employeeId,
                                'module' => 'Production Output',
                                'type' => 'Raw Materials',
                                'item_name' => $rawItem,
                                'quantity' => $deductPcs,
                                'previous_quantity' => $previousQuantity,
                                'remaining_quantity' => $newQuantityPieces,
                                'processed_at' => now(),
                            ]);
                        
                            // Decrease remaining quantity to deduct
                            $remaining -= $deductPcs;
                        }
                        
                    }
    
                    $debugInfo['deduction'][$rawItem]['remaining_after'] = $remaining;
    
                    if ($remaining > 0) {
                        $debugInfo['deduction'][$rawItem]['warning'] = "Not enough inventory, {$remaining} pieces could not be deducted";
                    }
                }
            }
    
            DB::commit();
    
            $this->checkAndUpdateNotifications($affectedFinishedGoods, $affectedRawMaterials);
    
            return response()->json([
                'message' => 'Production output recorded successfully.',
                'debug' => $debugInfo,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'debug' => $debugInfo ?? [],
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
    
    // private function createOrUpdateNotification($item, string $type, string $priority, float $quantity, float $lowStockAlert)
    // {
    //     $notification = \App\Models\InventoryNotification::where('notifiable_type', $type)
    //         ->where('notifiable_id', $item->id)
    //         ->first();
    
    //     $data = [
    //         'notifiable_type' => $type,
    //         'notifiable_id' => $item->id,
    //         'item_name' => $item->item,
    //         'priority' => $priority,
    //         'current_quantity' => $quantity,
    //         'low_stock_alert' => $lowStockAlert,
    //         'unit' => $item->unit ?? null,
    //     ];
    
    //     if ($notification) {
    //         if ($notification->priority === 'warning' && $priority === 'critical') {
    //             $data['is_read'] = false;
    //             $data['read_at'] = null;
    //         }
            
    //         $notification->update($data);
    //     } else {
    //         // Create new notification
    //         \App\Models\InventoryNotification::create($data);
    //     }
    // }

    private function createOrUpdateNotification($item, string $type, string $priority, float $quantity, float $lowStockAlert)
    {
        $data = [
            'notifiable_type' => $type,
            'notifiable_id' => $item->id,
            'item_name' => $item->item,
            'priority' => $priority,
            'current_quantity' => $quantity,
            'low_stock_alert' => $lowStockAlert,
            'unit' => $item->unit ?? null,
        ];
    
        // Always create a new notification
        \App\Models\InventoryNotification::create($data);
    }

    private function removeNotification($item, string $type)
    {
        \App\Models\InventoryNotification::where('notifiable_type', $type)
            ->where('notifiable_id', $item->id)
            ->delete();
    }
    
    public function destroyMany(Request $request)
    {
        $validated = $request->validate(['dates' => 'required|array', 'dates.*' => 'date']);
        DB::table('production_outputs')->whereIn('production_date', $validated['dates'])->delete();
        return response()->json(['message' => 'Selected production outputs deleted successfully']);
    }

    public function showDetails($batch_number)
    {
        $productions = DB::table('production_outputs')
            ->where('batch_number', $batch_number)
            ->get();

        if ($productions->isEmpty()) {
            return response()->json([]);
        }

        $result = [];

        foreach ($productions as $prod) {

            $materialsNeeded = $prod->materials_needed
                ? json_decode($prod->materials_needed, true)
                : [];

            $selectedSuppliers = $prod->selected_suppliers
                ? json_decode($prod->selected_suppliers, true)
                : [];

            $materials = [];

            foreach ($materialsNeeded as $rawmatName => $qtyPerUnit) {
                // handle array of strings (qtyPerUnit = 1)
                if (is_numeric($rawmatName)) {
                    $rawmatName = $qtyPerUnit;
                    $qtyPerUnit = 1;
                }

                $totalQty = $qtyPerUnit * $prod->quantity_pcs;

                $supplierId = $selectedSuppliers[$rawmatName] ?? null;

                if ($supplierId) {
                    $offer = DB::table('supplier_offers')
                        ->join('inventory_rawmats', 'inventory_rawmats.id', '=', 'supplier_offers.rawmat_id')
                        ->join('suppliers', 'suppliers.id', '=', 'supplier_offers.supplier_id')
                        ->where('supplier_offers.supplier_id', $supplierId)
                        ->whereRaw('LOWER(inventory_rawmats.item) = ?', [strtolower($rawmatName)])
                        ->select(
                            'inventory_rawmats.item as material',
                            'suppliers.name as supplier',
                            'supplier_offers.price as unit_price'
                        )
                        ->first();

                    if ($offer) {
                        $materials[] = [
                            'material'   => $offer->material,
                            'supplier'   => $offer->supplier,
                            'qty'        => $totalQty,
                            'unit_price' => round($offer->unit_price, 6),
                            'total'      => round($offer->unit_price * $totalQty, 2),
                        ];
                        continue;
                    }
                }

                // fallback if no supplier recorded or found
                $materials[] = [
                    'material'   => $rawmatName,
                    'supplier'   => 'Unknown Supplier',
                    'qty'        => $totalQty,
                    'unit_price' => 0,
                    'total'      => 0,
                ];
            }

            $result[] = [
                'product_name' => $prod->product_name,
                'batch_number' => $prod->batch_number,
                'materials'    => $materials,
            ];
        }

        return response()->json($result);
    }
    
    public function getRawMaterialsByProduct($product)
    {
        $mapping = [
            '350ml' => ['Plastic Bottle (350ml)', 'Blue Plastic Cap', 'Label'],
            '500ml' => ['Plastic Bottle (500ml)', 'Blue Plastic Cap', 'Label'],
            '1L'    => ['Plastic Bottle (1L)', 'Blue Plastic Cap', 'Label'],
            '6L'    => ['Plastic Gallon (6L)', '6L Cap', 'Label'],
        ];

        $materials = [];
        foreach ($mapping[$product] ?? [] as $mat) {
            $suppliers = DB::table('supplier_offers')
                ->join('suppliers', 'suppliers.id', '=', 'supplier_offers.supplier_id')
                ->join('inventory_rawmats', 'inventory_rawmats.id', '=', 'supplier_offers.rawmat_id')
                ->where('inventory_rawmats.item', $mat)
                ->pluck('suppliers.name');

            $materials[] = [
                'name' => $mat,
                'multi_supplier' => $suppliers->count() > 1,
                'suppliers' => $suppliers,
            ];
        }

        return response()->json($materials);
    }

    // * NEW METHODS
    public function getAllProductionOutputByBatch(Request $request)
    {
        $query = DB::table('production_outputs')
            ->select(
                'batch_number',
                DB::raw('MIN(production_date) as production_date'),
                DB::raw('STRING_AGG(product_name, \', \') as product_names'),
                DB::raw('SUM(quantity_pcs) as total_quantity_pcs'),
                DB::raw('SUM(quantity) as total_quantity'),
                DB::raw('MAX(created_at) as latest_created_at') 
            )
            ->groupBy('batch_number');
    
        // Filter by a single date if provided
        if ($request->has('date')) {
            $query->whereDate('created_at', $request->date);
        }
    
        // Order by latest_created_at descending
        $batches = $query->orderByDesc('latest_created_at')->get();
    
        return response()->json($batches);
    }

    public function getProductionOutputByBatchNumber($batch_number)
    {
        $productions = DB::table('production_outputs')
            ->where('batch_number', $batch_number)
            ->get();
    
        if ($productions->isEmpty()) {
            return response()->json([]);
        }
    
        $result = [];
    
        foreach ($productions as $prod) {
            // Decode JSON fields
            $materialsNeeded = $prod->materials_needed
                ? json_decode($prod->materials_needed, true)
                : [];
    
            $selectedSuppliers = $prod->selected_suppliers
                ? json_decode($prod->selected_suppliers, true)
                : [];
    
            $materials = [];
    
            foreach ($materialsNeeded as $materialName => $qtyPerUnit) {
                // Calculate total quantity needed (in pieces)
                $totalQty = $prod->quantity_pcs;
    
                // Get the supplier ID for this material
                $supplierId = $selectedSuppliers[$materialName] ?? null;
    
                if ($supplierId) {
                    // Find supplier details
                    $offer = DB::table('supplier_offers')
                        ->join('inventory_rawmats', 'inventory_rawmats.id', '=', 'supplier_offers.rawmat_id')
                        ->join('suppliers', 'suppliers.id', '=', 'supplier_offers.supplier_id')
                        ->where('supplier_offers.supplier_id', $supplierId)
                        ->whereRaw('LOWER(inventory_rawmats.item) = ?', [strtolower($materialName)])
                        ->select(
                            'inventory_rawmats.item as material',
                            'suppliers.name as supplier',
                            'supplier_offers.price as unit_price'
                        )
                        ->first();
    
                    if ($offer) {
                        $materials[] = [
                            'material'       => $offer->material,
                            'supplier'       => $offer->supplier,
                            'quantity'       => $totalQty,
                            'quantity_pcs'   => $prod->quantity_pcs, // ✅ Added here
                            'unit_price'     => round($offer->unit_price, 2),
                            'total'          => round($offer->unit_price * $totalQty, 2),
                        ];
                        continue;
                    }
                }
    
                // Fallback: try to find material without supplier match
                $rawmat = DB::table('inventory_rawmats')
                    ->whereRaw('LOWER(item) = ?', [strtolower($materialName)])
                    ->first();
    
                $materials[] = [
                    'material'       => $rawmat ? $rawmat->item : $materialName,
                    'supplier'       => 'No Supplier Assigned',
                    'quantity'       => $totalQty,
                    'quantity_pcs'   => $prod->quantity_pcs, // ✅ Added here too
                    'unit_price'     => 0,
                    'total'          => 0,
                ];
            }
    
            $result[] = [
                'product_name'   => $prod->product_name,
                'batch_number'   => $prod->batch_number,
                'quantity_pcs'   => $prod->quantity_pcs, // Overall product count
                'materials'      => $materials,
            ];
        }
    
        return response()->json($result);
    }
}
