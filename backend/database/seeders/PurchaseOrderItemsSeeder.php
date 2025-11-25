<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PurchaseOrderItemsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('purchase_order_items')->truncate();
        
        DB::table('purchase_order_items')->insert([
            [
                'id' => 1,
                'purchase_order_id' => 1,
                'item_name' => 'Plastic Bottle (350ml)',
                'item_type' => 'finished',
                'quantity' => 5000,
                'received_quantity' => 5000,
                'unit_cost' => 2.10,
                'total_amount' => 10500.00,
                'created_at' => '2025-11-03 00:51:45',
                'updated_at' => '2025-11-03 00:52:00',
            ],
            
            [
                'id' => 2,
                'purchase_order_id' => 2,
                'item_name' => 'Plastic Bottle (500ml)',
                'item_type' => 'finished',
                'quantity' => 10000,
                'received_quantity' => 10000,
                'unit_cost' => 2.35,
                'total_amount' => 23500.00,
                'created_at' => '2025-11-03 19:39:16',
                'updated_at' => '2025-11-03 19:41:20',
            ],
            
            [
                'id' => 3,
                'purchase_order_id' => 3,
                'item_name' => 'Label',
                'item_type' => 'finished',
                'quantity' => 5,
                'received_quantity' => 5,
                'unit_cost' => 7960.00,
                'total_amount' => 39800.00,
                'created_at' => '2025-11-03 22:36:29',
                'updated_at' => '2025-11-03 22:38:00',
            ],
            
            [
                'id' => 4,
                'purchase_order_id' => 4,
                'item_name' => 'Blue Plastic Cap',
                'item_type' => 'finished',
                'quantity' => 10000,
                'received_quantity' => 10000,
                'unit_cost' => 0.50,
                'total_amount' => 5000.00,
                'created_at' => '2025-11-04 15:51:37',
                'updated_at' => '2025-11-04 15:53:15',
            ],
            
            [
                'id' => 5,
                'purchase_order_id' => 5,
                'item_name' => 'Stretchfilm',
                'item_type' => 'finished',
                'quantity' => 30,
                'received_quantity' => 30,
                'unit_cost' => 320.00,
                'total_amount' => 9600.00,
                'created_at' => '2025-11-04 23:30:38',
                'updated_at' => '2025-11-04 23:31:00',
            ],
            [
                'id' => 6,
                'purchase_order_id' => 5,
                'item_name' => 'Shrinkfilm',
                'item_type' => 'finished',
                'quantity' => 30,
                'received_quantity' => 30,
                'unit_cost' => 320.00,
                'total_amount' => 9600.00,
                'created_at' => '2025-11-04 23:30:38',
                'updated_at' => '2025-11-04 23:31:00',
            ],
        ]);
    }
}
