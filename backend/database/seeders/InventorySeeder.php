<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class InventorySeeder extends Seeder
{
    public function run(): void
    {
        DB::table('inventories')->truncate();
        $now = Carbon::now();
        
        DB::table('inventories')->insert([
            [
                'id' => 1,
                'item' => 'Bottled Water (350ml)',
                'unit' => 'case',
                'quantity' => 250,
                'quantity_pcs' => 6000,
                'unit_cost' => 130.00,
                'low_stock_alert' => 100,
                'pcs_per_unit' => 24,
                'created_at' => $now,
                'updated_at' => $now,
                'materials_needed' => '["Plastic Bottle (350ml)","Blue Plastic Cap","Label"]',
                'selected_materials' => '{"Plastic Bottle (350ml)":1,"Blue Plastic Cap":6,"Label":9}'
            ],
            [
                'id' => 2,
                'item' => 'Bottled Water (500ml)',
                'unit' => 'case',
                'quantity' => 300,
                'quantity_pcs' => 7200,
                'pcs_per_unit' => 24,
                'unit_cost' => 155.00,
                'low_stock_alert' => 150,
                'created_at' => $now,
                'updated_at' => $now,
                'materials_needed' => '["Plastic Bottle (500ml)","Blue Plastic Cap","Label"]',
                'selected_materials' => '{"Plastic Bottle (500ml)":2,"Blue Plastic Cap":7,"Label":10}'
            ],
            [
                'id' => 3,
                'item' => 'Bottled Water (1L)',
                'unit' => 'case',
                'quantity' => 200,
                'quantity_pcs' => 2400,
                'pcs_per_unit' => 12,
                'unit_cost' => 180.00,
                'low_stock_alert' => 100,
                'created_at' => $now,
                'updated_at' => $now,
                'materials_needed' => '["Plastic Bottle (1L)","Blue Plastic Cap","Label"]',
                'selected_materials' => '{"Plastic Bottle (1L)":4,"Blue Plastic Cap":6,"Label":9}'
            ],
            [
                'id' => 4,
                'item' => 'Gallon Water (6L)',
                'unit' => 'pieces',
                'quantity' => 500,
                'pcs_per_unit' => 1,
                'quantity_pcs' => 500,
                'unit_cost' => 60.00,
                'low_stock_alert' => 200,
                'created_at' => $now,
                'updated_at' => $now,
                'materials_needed' => '["Plastic Gallon (6L)","Blue Plastic Cap (6L)","Label"]',
                'selected_materials' => '{"Plastic Gallon (6L)":5,"Blue Plastic Cap (6L)":8,"Label":9}'
            ],
        ]);
    }
}
