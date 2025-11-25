<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        {
            DB::table('inventories')->truncate();
            $now = Carbon::now();
            
            DB::table('inventories')->insert([
                [
                    'id' => 1,
                    'item' => '350ml',
                    'unit' => 'case',
                    'quantity' => 250,
                    'quantity_pcs' => 6000,
                    'unit_cost' => 130.00,
                    'low_stock_alert' => 100,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'materials_needed' => '["Plastic Bottle (350ml)","Blue Plastic Cap","Label","Stretchfilm"]'
                ],
                [
                    'id' => 2,
                    'item' => '500ml',
                    'unit' => 'case',
                    'quantity' => 300,
                    'quantity_pcs' => 7200,
                    'unit_cost' => 155.00,
                    'low_stock_alert' => 150,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'materials_needed' => '["Plastic Bottle (500ml)","Blue Plastic Cap","Label"]'
                ],
                [
                    'id' => 3,
                    'item' => '1L',
                    'unit' => 'case',
                    'quantity' => 200,
                    'quantity_pcs' => 2400,
                    'unit_cost' => 180.00,
                    'low_stock_alert' => 100,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'materials_needed' => '["Plastic Bottle (1L)","Blue Plastic Cap","Label"]'
                ],
                [
                    'id' => 4,
                    'item' => '6L',
                    'unit' => 'pieces',
                    'quantity' => 500,
                    'quantity_pcs' => 500,
                    'unit_cost' => 60.00,
                    'low_stock_alert' => 200,
                    'created_at' => $now,
                    'updated_at' => $now,
                    'materials_needed' => '["Plastic Gallon (6L)","Blue Plastic Cap (6L)","Label","Shrinkfilm"]'
                ],
            ]);
        }
    }
}
