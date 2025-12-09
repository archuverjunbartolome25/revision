<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Inventory;
use App\Models\InventoryRawmat;
use App\Models\Supplier;
use App\Models\SupplierOffer;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
   public function index()
    {
        $inventories = Inventory::all()->map(function($item) {
            $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];
            
            // Find the latest activity log for this item by name
            $latestLog = DB::table('inventory_activity_logs')
                ->where('item_name', $item->item_name)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Add the quantities from the latest log
            if ($latestLog) {
                $item->previous_quantity = $latestLog->previous_quantity;
                $item->remaining_quantity = $latestLog->remaining_quantity;
            } else {
                $item->previous_quantity = null;
                $item->remaining_quantity = null;
            }
            
            return $item;
        });

        return response()->json($inventories);
    }
    // public function index()
    // {
    //     $inventories = Inventory::all()->map(function($item) {
    //         $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];
    //         return $item;
    //     });

    //     return response()->json($inventories);
    // }


    public function store(Request $request)
    {
        $validated = $request->validate([
            'item' => 'required|string',
            'unit' => 'required|string',
            'pcs_per_unit' => 'required|integer|min:1',
            'quantity' => 'required|integer|min:0',
            'quantity_pcs' => 'nullable|integer|min:0',
            'unit_cost' => 'nullable|numeric|min:0',
            'materials_needed' => 'nullable|array',
            'materials_needed.*' => 'string',
        ]);

        $validated['pcs_per_unit'] = $validated['pcs_per_unit'] ?? 1;
        $validated['materials_needed'] = $validated['materials_needed'] ?? [];

        $item = Inventory::create($validated);

        return response()->json([
            'message' => 'Item added successfully',
            'data' => $item
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate(['quantity' => 'required|integer|min:0']);
        $item = Inventory::findOrFail($id);
        $item->quantity = $validated['quantity'];
        $item->save();

        return response()->json(['message' => 'Inventory updated successfully']);
    }

    /**
     * Deduct items from both finished goods and raw materials
     */
/**
 * Deduct items from both finished goods and raw materials
 */
public function deduct(Request $request)
{
    $type = $request->input('type');  // Finished Goods or Raw Materials
    $itemName = $request->input('item');
    $quantity = (int) $request->input('quantity'); // user input
    $unit = $request->input('unit', 'unit');      // default to 'unit'

    if (!$itemName || $quantity <= 0) {
        return response()->json(['error' => 'Missing or invalid required fields.'], 400);
    }

    // Determine which table
    if ($type === 'Finished Goods') {
        $inventory = Inventory::where('item', $itemName)->first();
    } elseif ($type === 'Raw Materials') {
        $inventory = InventoryRawmat::where('item', $itemName)->first();
    } else {
        return response()->json(['error' => 'Invalid type specified.'], 400);
    }

    if (!$inventory) {
        return response()->json(['error' => "{$type} item not found."], 404);
    }

    $pcsPerUnit = $inventory->pcs_per_unit ?? 1;

    // Calculate total pieces to deduct
    if ($unit === 'pcs') {
        $totalPiecesToDeduct = $quantity; // Already in pieces
    } else {
        $totalPiecesToDeduct = $quantity * $pcsPerUnit; // Convert units to pieces
    }

    if ($inventory->quantity_pcs < $totalPiecesToDeduct) {
        return response()->json(['error' => 'Insufficient stock.'], 400);
    }

    // Deduct pieces
    $inventory->quantity_pcs -= $totalPiecesToDeduct;
    $inventory->quantity = intdiv($inventory->quantity_pcs, $pcsPerUnit);

    $inventory->save();

    return response()->json([
        'message' => "✅ Successfully deducted {$quantity} {$unit} from {$itemName} ({$totalPiecesToDeduct} pcs).",
        'data' => $inventory
    ]);
}


    public function receiveItem(Request $request)
    {
    $validated = $request->validate([
        'item' => 'required|string',
        'unit' => 'required|string',
        'pcs_per_unit' => 'nullable|integer|min:1',
        'quantity' => 'required|integer|min:1',
        'quantity_pcs' => 'nullable|integer|min:0',
        'unit_cost' => 'nullable|numeric|min:0', // add this
    ]);

    $validated['pcs_per_unit'] = $validated['pcs_per_unit'] ?? 1;

    $item = Inventory::firstOrCreate(
        ['item' => $validated['item']],
        ['unit' => $validated['unit'], 'quantity' => 0, 'quantity_pcs' => 0, 'unit_cost' => $validated['unit_cost'] ?? 0]
    );

    $item->pcs_per_unit = $validated['pcs_per_unit'];
    $item->quantity += $validated['quantity'];
    $item->quantity_pcs += $validated['quantity_pcs'] ?? 0;
    $item->unit_cost = $validated['unit_cost'] ?? $item->unit_cost; // update if provided
    $item->save();

    return response()->json([
        'message' => 'Inventory updated successfully',
        'data' => $item
    ]);
}

    public function addQuantity(Request $request, $id)
    {
        $request->validate(['quantity' => 'required|integer|min:1']);

        $inventory = Inventory::findOrFail($id);
        $inventory->quantity += $request->quantity;
        $inventory->save();

        return response()->json([
            'message' => 'Quantity updated successfully',
            'data' => $inventory
        ]);
    }

    public function updateAlert(Request $request, $id)
    {
        $request->validate(['low_stock_alert' => 'required|integer|min:1']);
        $item = Inventory::findOrFail($id);
        $item->low_stock_alert = $request->low_stock_alert;
        $item->save();

        return response()->json(['message' => 'Alert quantity updated successfully']);
    }

    public function inventoryByYear(Request $request)
    {
        $year = $request->query('year', now()->year);

        $data = Inventory::selectRaw('EXTRACT(MONTH FROM created_at) as month, SUM(quantity_pcs) as total_quantity')
            ->whereRaw('EXTRACT(YEAR FROM created_at) = ?', [$year])
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json($data);
    }
    public function updatePrice(Request $request, $id)
    {
        // Validate that unit_cost is present and numeric
        $request->validate([
            'unit_cost' => 'required|numeric|min:0',
        ]);

        $item = Inventory::find($id);

        if (!$item) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $item->unit_cost = $request->unit_cost;
        $item->save();

        return response()->json([
            'message' => 'Price updated successfully',
            'data' => $item
        ]);
    }
    // public function updateMaterials(Request $request, $id)
    // {
    //     $inventory = Inventory::findOrFail($id);

    //     // Get materials array from request
    //     $materials = $request->input('materials_needed', []);

    //     // Save as JSON to the correct column
    //     $inventory->materials_needed = json_encode($materials);
    //     $inventory->save();

    //     return response()->json([
    //         'message' => 'Materials updated successfully',
    //         'data' => $inventory
    //     ]);
    // }
    public function finishedGoods()
    {
        // Return all items in inventories as finished goods
        $finishedGoods = Inventory::all()
            ->map(function($item) {
                $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];
                return $item;
            });

        return response()->json($finishedGoods);
    }

    public function getFinishedGood($itemName)
    {
        // Fetch by item name instead of ID
        $item = Inventory::where('item', $itemName)->first();

        if (!$item) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];

        return response()->json($item);
    }


    public function destroy($id)
    {
        $inventory = Inventory::find($id);

        if (!$inventory) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        try {
            $inventory->delete(); // Soft delete
            return response()->json(['message' => 'Item deleted successfully (soft deleted)']);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Cannot delete item. It may be referenced in other records.'
            ], 400);
        }
    }

        public function restore($id)
    {
        $inventory = Inventory::withTrashed()->find($id);

        if (!$inventory) {
            return response()->json(['message' => 'Item not found'], 404);
        }

        $inventory->restore();

        return response()->json(['message' => 'Item restored successfully']);
    }


    // * NEW METHODS
    // NOTE USED FOR FINISHED GOODS LISTING IN PRODUCTION OUTPUT
    public function getAllFinishedGoods()
    {
        try {
            $items = Inventory::all();

            if ($items->isEmpty()) {
                return response()->json([
                    'message' => 'No finished goods found',
                    'data' => []
                ], 404);
            }

            // Decode materials_needed for each item
            $items->transform(function ($item) {
                $item->materials_needed = $item->materials_needed
                    ? json_decode($item->materials_needed, true)
                    : [];
                return $item;
            });

            // Return pure list
            return response()->json($items, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'An error occurred while fetching finished goods',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    // NOTE USED FOR BOM DISPLAY WITH MATERIAL DETAILS
    // public function getAllFinishedGoodsWithNeededMaterials()
    // {
    //     $inventories = Inventory::all()->map(function($item) {
    //         $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];
    //         $selectedMaterials = $item->selected_materials ?? [];
    //         $transformedMaterials = [];
            
    //         foreach ($selectedMaterials as $materialName => $supplierOfferId) {
    //             // Get the supplier offer directly by ID
    //             $supplierOffer = DB::table('supplier_offers')
    //                 ->where('id', $supplierOfferId)
    //                 ->first();
                
    //             if ($supplierOffer) {
    //                 // Get raw material details
    //                 $rawMaterial = DB::table('inventory_rawmats')
    //                     ->where('id', $supplierOffer->rawmat_id)
    //                     ->first();
                    
    //                 // Get supplier details
    //                 $supplier = DB::table('suppliers')
    //                     ->where('id', $supplierOffer->supplier_id)
    //                     ->first();
                    
    //                 if ($rawMaterial && $supplier) {
    //                     $transformedMaterials[] = [
    //                         'raw_material_id' => $rawMaterial->id,
    //                         'raw_material_name' => $rawMaterial->item,
    //                         'raw_material_unit' => $supplierOffer->unit,
    //                         'rawmats_pcs_per_unit' => $rawMaterial->conversion,
    //                         'supplier_id' => $supplier->id,
    //                         'supplier_name' => $supplier->name,
    //                         'unit_price' => $supplierOffer->price,
    //                     ];
    //                 }
    //             }
    //         }
            
    //         $item->selected_materials = $transformedMaterials;
    //         return $item;
    //     });
    
    //     return response()->json($inventories);
    // }

    public function getAllFinishedGoodsWithNeededMaterials()
    {
        $inventories = Inventory::all()->map(function($item) {
            $item->materials_needed = $item->materials_needed ? json_decode($item->materials_needed) : [];
            $selectedMaterials = $item->selected_materials ?? [];
            $transformedMaterials = [];
            
            foreach ($selectedMaterials as $materialName => $supplierOfferId) {
                // Get the supplier offer directly by ID
                $supplierOffer = DB::table('supplier_offers')
                    ->where('id', $supplierOfferId)
                    ->first();
                
                if ($supplierOffer) {
                    // Get raw material details
                    $rawMaterial = DB::table('inventory_rawmats')
                        ->where('id', $supplierOffer->rawmat_id)
                        ->first();
                    
                    // Get supplier details
                    $supplier = DB::table('suppliers')
                        ->where('id', $supplierOffer->supplier_id)
                        ->first();
                    
                    if ($rawMaterial && $supplier) {
                        $transformedMaterials[] = [
                            'raw_material_id' => $rawMaterial->id,
                            'raw_material_name' => $rawMaterial->item,
                            'raw_material_unit' => $supplierOffer->unit,
                            'rawmats_pcs_per_unit' => $rawMaterial->conversion,
                            'supplier_id' => $supplier->id,
                            'supplier_name' => $supplier->name,
                            'unit_price' => $supplierOffer->price,
                        ];
                    }
                }
            }
            
            $item->selected_materials = $transformedMaterials;
            
            // Find the latest activity log for this item by name
            $latestLog = DB::table('inventory_activity_logs')
                ->where('item_name', $item->item)
                ->orderBy('created_at', 'desc')
                ->first();
            
            // Add the quantities from the latest log
            if ($latestLog) {
                $item->previous_quantity = $latestLog->previous_quantity;
                $item->remaining_quantity = $latestLog->remaining_quantity;
            } else {
                $item->previous_quantity = null;
                $item->remaining_quantity = null;
            }
            
            // Get sum of all additions (where remaining > previous)
            $totalReceived = DB::table('inventory_activity_logs')
                ->where('item_name', $item->item)
                ->whereColumn('remaining_quantity', '>', 'previous_quantity')
                ->selectRaw('SUM(remaining_quantity - previous_quantity) as total')
                ->value('total');
            
            $item->last_received = $totalReceived ?? 0;
            
            // Get sum of all deductions (where remaining < previous)
            $totalDeducted = DB::table('inventory_activity_logs')
                ->where('item_name', $item->item)
                ->whereColumn('remaining_quantity', '<', 'previous_quantity')
                ->selectRaw('SUM(previous_quantity - remaining_quantity) as total')
                ->value('total');
            
            $item->last_deduct = $totalDeducted ?? 0;
            
            return $item;
        });
    
        return response()->json($inventories);
    }

    public function updateMaterials(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);
    
        // Update materials_needed if provided
        if ($request->has('materials_needed')) {
            $inventory->materials_needed = json_encode($request->input('materials_needed'));
        }
    
        // Update selected_materials
        if ($request->has('selected_materials')) {
            $selectedMaterialsInput = $request->input('selected_materials');
            if (!is_array($selectedMaterialsInput)) {
                $selectedMaterialsInput = [$selectedMaterialsInput]; // wrap single object
            }
    
            $finalSelectedMaterials = [];
    
            foreach ($selectedMaterialsInput as $material) {
                if (!isset($material['name'], $material['supplier'])) continue;
    
                // 1. Get rawmats id
                $rawMat = InventoryRawmat::where('item', $material['name'])->first();
                if (!$rawMat) continue;
    
                // 2. Get supplier id
                $supplier = Supplier::where('name', $material['supplier'])->first();
                if (!$supplier) continue;
    
                // 3. Find supplier_offer where both match
                $supplierOffer = SupplierOffer::where('rawmat_id', $rawMat->id)
                    ->where('supplier_id', $supplier->id)
                    ->first();
    
                if (!$supplierOffer) continue;
    
                // 4. Assign Rawmats_name : supplier_offer_id
                $finalSelectedMaterials[$material['name']] = $supplierOffer->id;
            }
    
            // Save JSON string
            // $inventory->selected_materials = json_encode($finalSelectedMaterials, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            $inventory->selected_materials = $finalSelectedMaterials;
        }
    
        $inventory->save();
        
    
        return response()->json([
            'message' => 'Materials updated successfully',
            'data' => $inventory
        ]);
    }
}


