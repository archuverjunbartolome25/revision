<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\DB;

class RawMaterialSupplierController extends Controller
{
public function getByProduct($productName)
{
    // Fetch the product by item name
    $product = DB::table('inventories')->where('item', $productName)->first();

    if (!$product) {
        return response()->json(['message' => 'Unknown product'], 404);
    }

    // Clean the materials_needed string
    $raw = $product->materials_needed;

    // Remove extra quotes and backslashes
    $raw = trim($raw, '"');
    $materials = json_decode(stripslashes($raw), true);

    // If decoding still fails
    if (!$materials || !is_array($materials)) {
        return response()->json(['message' => 'No materials found'], 404);
    }

    $result = [];
    foreach ($materials as $mat) {
        // Fetch all suppliers offering this raw material
        $suppliers = DB::select("
            SELECT s.id, s.name
            FROM suppliers s
            JOIN supplier_offers so ON s.id = so.supplier_id
            JOIN inventory_rawmats rm ON rm.id = so.rawmat_id
            WHERE rm.item = ?
        ", [$mat]);

        $result[] = [
            'material' => $mat,
            'suppliers' => $suppliers,
        ];
    }

    return response()->json($result);
}

}
