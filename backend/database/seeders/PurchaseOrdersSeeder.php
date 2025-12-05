<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class PurchaseOrdersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        DB::table('purchase_orders')->truncate();
        
        DB::table('purchase_orders')->insert([
            [
                'id' => 1,
                'created_by' => 1,
                'po_number' => 'PO-1762102282082',
                'supplier_name' => 'Mc Bride Corporation',
                'order_date' => '2025-11-02',
                'expected_date' => '2025-11-15',
                'status' => 'Completed',
                'amount' => 10500.00,
                'created_at' => '2025-11-03 00:51:45',
                'updated_at' => '2025-11-03 00:52:00',
            ],
            [
                'id' => 2,
                'created_by' => 1,
                'po_number' => 'PO-1762169848814',
                'supplier_name' => 'Filpet, Inc.',
                'order_date' => '2025-11-03',
                'expected_date' => '2025-11-16',
                'status' => 'Completed',
                'amount' => 23500.00,
                'created_at' => '2025-11-03 19:39:16',
                'updated_at' => '2025-11-03 19:41:20',
            ],
            [
                'id' => 3,
                'created_by' => 1,
                'po_number' => 'PO-1762180484692',
                'supplier_name' => 'Royalseal',
                'order_date' => '2025-11-03',
                'expected_date' => '2025-11-16',
                'status' => 'Completed',
                'amount' => 39800.00,
                'created_at' => '2025-11-03 22:36:29',
                'updated_at' => '2025-11-03 22:38:00',
            ],
            [
                'id' => 4,
                'created_by' => 1,
                'po_number' => 'PO-1762242680745',
                'supplier_name' => 'Mc Bride Corporation',
                'order_date' => '2025-11-04',
                'expected_date' => '2025-11-17',
                'status' => 'Completed',
                'amount' => 5000.00,
                'created_at' => '2025-11-04 15:51:37',
                'updated_at' => '2025-11-04 15:53:15',
            ],
            [
                'id' => 5,
                'created_by' => 1,
                'po_number' => 'PO-1762270221965',
                'supplier_name' => 'Synergy',
                'order_date' => '2025-11-04',
                'expected_date' => '2025-11-17',
                'status' => 'Completed',
                'amount' => 9600.00,
                'created_at' => '2025-11-04 23:30:38',
                'updated_at' => '2025-11-04 23:31:00',
            ],
            
        ]);
    }
}


