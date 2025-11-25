<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SupplierOffersTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('supplier_offers')->truncate();
        
        DB::table('supplier_offers')->insert([
            // Mc Bride Corporation offers
            [
                'id' => 1,
                'supplier_id' => 1,
                'rawmat_id' => 1, // Plastic Bottle (350ml)
                'unit' => 'pieces',
                'price' => 2.10,
                'created_at' => '2025-11-02 23:31:20',
                'updated_at' => '2025-11-02 23:31:20',
            ],
            [
                'id' => 2,
                'supplier_id' => 1,
                'rawmat_id' => 2, // Plastic Bottle (500ml)
                'unit' => 'pieces',
                'price' => 2.25,
                'created_at' => '2025-11-02 23:44:37',
                'updated_at' => '2025-11-02 23:44:37',
            ],
            [
                'id' => 4,
                'supplier_id' => 1,
                'rawmat_id' => 4, // Plastic Bottle (1L)
                'unit' => 'pieces',
                'price' => 4.05,
                'created_at' => '2025-11-02 23:48:11',
                'updated_at' => '2025-11-02 23:48:11',
            ],
            [
                'id' => 5,
                'supplier_id' => 1,
                'rawmat_id' => 5, // Plastic Gallon (6L)
                'unit' => 'pieces',
                'price' => 23.00,
                'created_at' => '2025-11-02 23:48:36',
                'updated_at' => '2025-11-02 23:48:36',
            ],
            [
                'id' => 6,
                'supplier_id' => 1,
                'rawmat_id' => 6, // Blue Plastic Cap
                'unit' => 'pieces',
                'price' => 0.50,
                'created_at' => '2025-11-02 23:48:57',
                'updated_at' => '2025-11-02 23:48:57',
            ],
            [
                'id' => 8,
                'supplier_id' => 1,
                'rawmat_id' => 8, // Blue Plastic Cap (6L)
                'unit' => 'pieces',
                'price' => 3.00,
                'created_at' => '2025-11-02 23:49:34',
                'updated_at' => '2025-11-02 23:49:34',
            ],
            
            // Filpet, Inc. offers (alternative supplier for same materials)
            [
                'id' => 3,
                'supplier_id' => 2,
                'rawmat_id' => 3, // Plastic Bottle (500ml) - different rawmat_id
                'unit' => 'pieces',
                'price' => 2.35,
                'created_at' => '2025-11-02 23:47:39',
                'updated_at' => '2025-11-02 23:47:39',
            ],
            [
                'id' => 7,
                'supplier_id' => 2,
                'rawmat_id' => 7, // Blue Plastic Cap - different rawmat_id
                'unit' => 'pieces',
                'price' => 0.49,
                'created_at' => '2025-11-02 23:49:14',
                'updated_at' => '2025-11-02 23:49:14',
            ],
            
            // Royalseal offers
            [
                'id' => 9,
                'supplier_id' => 3,
                'rawmat_id' => 9, // Label
                'unit' => 'rolls',
                'price' => 7960.00,
                'created_at' => '2025-11-02 23:50:02',
                'updated_at' => '2025-11-02 23:50:02',
            ],
            
            // Shrinkpack offers (alternative label supplier)
            [
                'id' => 10,
                'supplier_id' => 4,
                'rawmat_id' => 10, // Label - different rawmat_id
                'unit' => 'rolls',
                'price' => 5960.00,
                'created_at' => '2025-11-02 23:50:16',
                'updated_at' => '2025-11-02 23:50:16',
            ],
            
            // Synergy offers
            [
                'id' => 11,
                'supplier_id' => 5,
                'rawmat_id' => 11, // Stretchfilm
                'unit' => 'pieces',
                'price' => 320.00,
                'created_at' => '2025-11-02 23:50:30',
                'updated_at' => '2025-11-02 23:50:30',
            ],
            
            // Polyflex offers
            [
                'id' => 12,
                'supplier_id' => 6,
                'rawmat_id' => 12, // Shrinkfilm
                'unit' => 'pieces',
                'price' => 2337.00,
                'created_at' => '2025-11-02 23:50:45',
                'updated_at' => '2025-11-02 23:50:45',
            ],
        ]);
    }
}
