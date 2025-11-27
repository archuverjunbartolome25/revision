<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventoryRawmatsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('inventory_rawmats')->truncate();
        $now = Carbon::now();

        DB::table('inventory_rawmats')->insert([
            // Plastic Bottles
            [
                'id' => 1,
                'item' => 'Plastic Bottle (350ml)',
                'unit' => 'pieces',
                'quantity' => 200000,
                'conversion' => 1,
                'quantity_pieces' => 200000,
                'low_stock_alert' => 50000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 2.10,
                'supplier_id' => 1, // Mc Bride
            ],
            [
                'id' => 2,
                'item' => 'Plastic Bottle (500ml)',
                'unit' => 'pieces',
                'quantity' => 300000,
                'conversion' => 1,
                'quantity_pieces' => 300000,
                'low_stock_alert' => 50000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 2.25,
                'supplier_id' => 1, // Mc Bride
            ],
            [
                'id' => 3,
                'item' => 'Plastic Bottle (500ml)',
                'unit' => 'pieces',
                'quantity' => 250000,
                'conversion' => 1,
                'quantity_pieces' => 250000,
                'low_stock_alert' => 50000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 2.35,
                'supplier_id' => 2, // Filpet (same item, different supplier)
            ],
            [
                'id' => 4,
                'item' => 'Plastic Bottle (1L)',
                'unit' => 'pieces',
                'quantity' => 150000,
                'conversion' => 1,
                'quantity_pieces' => 150000,
                'low_stock_alert' => 30000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 4.05,
                'supplier_id' => 1, // Mc Bride
            ],
            [
                'id' => 5,
                'item' => 'Plastic Gallon (6L)',
                'unit' => 'pieces',
                'quantity' => 100000,
                'conversion' => 1,
                'quantity_pieces' => 100000,
                'low_stock_alert' => 20000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 23.00,
                'supplier_id' => 1, // Mc Bride
            ],
            // Caps
            [
                'id' => 6,
                'item' => 'Blue Plastic Cap',
                'unit' => 'pieces',
                'quantity' => 300000,
                'conversion' => 1,
                'quantity_pieces' => 300000,
                'low_stock_alert' => 100000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 0.50,
                'supplier_id' => 1, // Mc Bride
            ],
            [
                'id' => 7,
                'item' => 'Blue Plastic Cap',
                'unit' => 'pieces',
                'quantity' => 400000,
                'conversion' => 1,
                'quantity_pieces' => 400000,
                'low_stock_alert' => 100000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 0.49,
                'supplier_id' => 2, // Filpet (same item, different supplier)
            ],
            [
                'id' => 8,
                'item' => 'Blue Plastic Cap (6L)',
                'unit' => 'pieces',
                'quantity' => 150000,
                'conversion' => 1,
                'quantity_pieces' => 150000,
                'low_stock_alert' => 30000,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 3.00,
                'supplier_id' => 1, // Mc Bride
            ],
            // Labels
            [
                'id' => 9,
                'item' => 'Label',
                'unit' => 'rolls',
                'quantity' => 50,
                'conversion' => 10000, // 10,000 labels per roll
                'quantity_pieces' => 500000,
                'low_stock_alert' => 20,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 1.00,
                'supplier_id' => 3, // Royalseal
            ],
            [
                'id' => 10,
                'item' => 'Label',
                'unit' => 'rolls',
                'quantity' => 40,
                'conversion' => 10000,
                'quantity_pieces' => 400000,
                'low_stock_alert' => 20,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 2.00,
                'supplier_id' => 4, // Shrinkpack (same item, different supplier)
            ],
            // Films
            [
                'id' => 11,
                'item' => 'Stretchfilm',
                'unit' => 'pieces',
                'quantity' => 150,
                'conversion' => 1,
                'quantity_pieces' => 150,
                'low_stock_alert' => 50,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 320.00,
                'supplier_id' => 5, // Synergy
            ],
            [
                'id' => 12,
                'item' => 'Shrinkfilm',
                'unit' => 'pieces',
                'quantity' => 120,
                'conversion' => 1,
                'quantity_pieces' => 120,
                'low_stock_alert' => 30,
                'created_at' => $now,
                'updated_at' => $now,
                'unit_cost' => 2337.00,
                'supplier_id' => 6, // Polyflex
            ],
        ]);
    }
}
