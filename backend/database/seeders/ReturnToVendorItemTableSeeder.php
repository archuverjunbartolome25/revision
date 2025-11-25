<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReturnToVendorItemTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $items = [];

        // Helper to push items based on qty field
        $addItem = function (&$items, $returnId, $productId, $qty) {
            if ($qty > 0) {
                $items[] = [
                    'return_id' => $returnId,
                    'product_id' => $productId,
                    'quantity' => $qty,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        };

        // RTV 1
        $addItem($items, 1, 1, 1); // qty_350ml = 1

        // RTV 2
        $addItem($items, 2, 1, 2);

        // RTV 3
        $addItem($items, 3, 1, 2);

        // RTV 4
        $addItem($items, 4, 1, 1);

        // RTV 5
        $addItem($items, 5, 1, 1);

        DB::table('return_to_vendor_items')->insert($items);
    }
}
