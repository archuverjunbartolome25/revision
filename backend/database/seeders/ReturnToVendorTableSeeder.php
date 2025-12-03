<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReturnToVendorTableSeeder extends Seeder
{
    public function run(): void
    {
        $returns = [
            // Customer RTVs
            [
                'id' => 1,
                'customer_id' => 1,
                'supplier_id' => null,
                'location' => 'Cabuyao Branch',
                'date_ordered' => '2025-11-03',
                'date_returned' => '2025-11-03',
                'status' => 'Approved',
            ],
            [
                'id' => 2,
                'customer_id' => 1,
                'supplier_id' => null,
                'location' => 'Cabuyao Branch',
                'date_ordered' => '2025-11-04',
                'date_returned' => '2025-11-04',
                'status' => 'Approved',
            ],

            // Supplier RTSs
            [
                'id' => 3,
                'customer_id' => null,
                'supplier_id' => 1,
                'location' => 'Supplier Warehouse',
                'date_ordered' => '2025-11-05',
                'date_returned' => '2025-11-05',
                'status' => 'Pending',
            ],
            [
                'id' => 4,
                'customer_id' => null,
                'supplier_id' => 2,
                'location' => 'Supplier Warehouse',
                'date_ordered' => '2025-11-06',
                'date_returned' => '2025-11-06',
                'status' => 'Pending',
            ],
        ];

        // Generate RTV/RTS number for each row
        foreach ($returns as &$return) {
            $prefix = $return['supplier_id'] ? 'RTS' : 'RTV';
            $datePart = date('Ymd', strtotime($return['date_ordered'] ?? now()));
            $randomPart = rand(1000, 9999);
            $return['rtv_number'] = "{$prefix}-{$datePart}-{$randomPart}";
            $return['created_at'] = now();
            $return['updated_at'] = now();
        }

        DB::table('return_to_vendor')->insert($returns);
    }
}
