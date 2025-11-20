<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductionOutputController extends Controller
{
    /** List all production outputs */
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

    DB::beginTransaction();

    try {
        foreach ($request->products as $prod) {

            $productName = trim($prod['product_name']);
            $quantityPcs = (int) $prod['quantity_pcs'];
            $requestRawMaterials = $prod['raw_materials'] ?? [];

            // Fetch finished good
            $finishedGood = \App\Models\Inventory::whereRaw('LOWER(item) = ?', [strtolower($productName)])->first();
            $pcsPerUnit = $finishedGood->pcs_per_unit ?? 1;

            // Build materials_needed
            $materialsNeeded = [];
            if ($finishedGood && $finishedGood->materials_needed) {
                $decoded = json_decode($finishedGood->materials_needed, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    foreach ($decoded as $key => $val) {
                        $materialsNeeded[] = is_numeric($key) ? trim($val) : trim($key);
                    }
                }
            }

            // Merge default + requested raw materials
            $keyedMaterials = [];
            $selectedSuppliers = [];
            foreach ($materialsNeeded as $mat) {
                $keyedMaterials[$mat] = $quantityPcs;
            }
            foreach ($requestRawMaterials as $raw) {
                $matName = trim($raw['material']);
                $qty = (int) ($raw['quantity'] ?? $quantityPcs);
                if ($qty <= 0) continue;
                $keyedMaterials[$matName] = $qty;
                if (!empty($raw['supplier_id'])) {
                    $selectedSuppliers[$matName] = $raw['supplier_id'];
                }
            }

            // ✅ Auto-assign supplier if none provided
            foreach ($keyedMaterials as $rawMat => $qty) {
                if (!isset($selectedSuppliers[$rawMat])) {
                    $supplier = DB::table('supplier_offers')
                        ->join('inventory_rawmats', 'inventory_rawmats.id', '=', 'supplier_offers.rawmat_id')
                        ->select('supplier_offers.supplier_id')
                        ->whereRaw('LOWER(inventory_rawmats.item) = ?', [strtolower($rawMat)])
                        ->first();

                    if ($supplier) {
                        $selectedSuppliers[$rawMat] = $supplier->supplier_id;
                    }
                }
            }

            // Insert production output
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

            // Update finished goods stock
            if ($finishedGood) {
                $finishedGood->increment('quantity_pcs', $quantityPcs);
                $finishedGood->quantity = floor($finishedGood->quantity_pcs / $pcsPerUnit);
                $finishedGood->save();
            }

            // Log finished goods
            \App\Models\InventoryActivityLog::create([
                'employee_id' => $employeeId,
                'module' => 'Production Output',
                'type' => 'Finished Goods',
                'item_name' => $productName,
                'quantity' => $quantityPcs,
                'processed_at' => now(),
            ]);

            // Deduct raw materials
            foreach ($keyedMaterials as $rawItem => $usedQty) {
                $supplierId = $selectedSuppliers[$rawItem] ?? null;

                if ($supplierId) {
                    $raw = DB::table('inventory_rawmats')
                        ->whereRaw('LOWER(item) = ?', [strtolower($rawItem)])
                        ->where('supplier_id', $supplierId)
                        ->first();
                    if ($raw) {
                        DB::table('inventory_rawmats')->where('id', $raw->id)->decrement('quantity_pieces', $usedQty);
                        \App\Models\InventoryActivityLog::create([
                            'employee_id' => $employeeId,
                            'module' => 'Production Output',
                            'type' => 'Raw Materials',
                            'item_name' => $rawItem,
                            'quantity' => $usedQty,
                            'processed_at' => now(),
                        ]);
                    }
                } else {
                    $inventories = DB::table('inventory_rawmats')
                        ->whereRaw('LOWER(item) = ?', [strtolower($rawItem)])
                        ->orderBy('quantity_pieces', 'desc')
                        ->get();
                    $remaining = $usedQty;
                    foreach ($inventories as $stock) {
                        if ($remaining <= 0) break;
                        $deduct = min($remaining, $stock->quantity_pieces);
                        DB::table('inventory_rawmats')->where('id', $stock->id)->decrement('quantity_pieces', $deduct);
                        \App\Models\InventoryActivityLog::create([
                            'employee_id' => $employeeId,
                            'module' => 'Production Output',
                            'type' => 'Raw Materials',
                            'item_name' => $rawItem,
                            'quantity' => $deduct,
                            'processed_at' => now(),
                        ]);
                        $remaining -= $deduct;
                    }
                }
            }

        }

        DB::commit();
        return response()->json(['message' => 'Production output recorded successfully.']);
    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json(['error' => $e->getMessage()], 500);
    }
}


    /** Delete multiple production outputs by date */
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


    /** Get raw materials and supplier options for a product */
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
}
