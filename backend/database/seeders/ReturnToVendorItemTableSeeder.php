<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReturnToVendorItemTableSeeder extends Seeder
{
    public function run(): void
    {
        $items = [];

        $addItem = function (&$items, $returnId, $productId, $qty, $type) {
            if ($qty > 0) {
                $items[] = [
                    'return_id' => $returnId,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'product_type' => $type, // 'finished' or 'raw'
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        };

        // Customer RTV items (finished goods)
        $addItem($items, 1, 1, 5, 'finished');
        $addItem($items, 1, 2, 3, 'finished');
        $addItem($items, 2, 1, 2, 'finished');

        // Supplier RTS items (raw materials)
        $addItem($items, 3, 1, 10, 'raw'); // raw material id 1
        $addItem($items, 3, 2, 5, 'raw');  // raw material id 2
        $addItem($items, 4, 3, 8, 'raw');  // raw material id 3

        DB::table('return_to_vendor_items')->insert($items);
    }
}
