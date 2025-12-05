<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

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
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 2,
                'supplier_id' => 1,
                'rawmat_id' => 2, // Plastic Bottle (500ml)
                'unit' => 'pieces',
                'price' => 2.25,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 4,
                'supplier_id' => 1,
                'rawmat_id' => 3, // Plastic Bottle (1L)
                'unit' => 'pieces',
                'price' => 4.05,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 5,
                'supplier_id' => 1,
                'rawmat_id' => 4, // Plastic Gallon (6L)
                'unit' => 'pieces',
                'price' => 23.00,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 6,
                'supplier_id' => 1,
                'rawmat_id' => 5, // Blue Plastic Cap
                'unit' => 'pieces',
                'price' => 0.50,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 8,
                'supplier_id' => 1,
                'rawmat_id' => 6, // Blue Plastic Cap (6L)
                'unit' => 'pieces',
                'price' => 3.00,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            
            // Filpet, Inc. offers (alternative supplier for same materials)
            [
                'id' => 3,
                'supplier_id' => 2,
                'rawmat_id' => 2, // Plastic Bottle (500ml) - different rawmat_id
                'unit' => 'pieces',
                'price' => 2.35,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'id' => 7,
                'supplier_id' => 2,
                'rawmat_id' => 5, // Blue Plastic Cap - different rawmat_id
                'unit' => 'pieces',
                'price' => 0.49,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            
            // Royalseal offers
            [
                'id' => 9,
                'supplier_id' => 3,
                'rawmat_id' => 7, // Label
                'unit' => 'rolls',
                'price' => 0.20,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            
            // Shrinkpack offers (alternative label supplier)
            [
                'id' => 10,
                'supplier_id' => 4,
                'rawmat_id' => 7, // Label - different rawmat_id
                'unit' => 'rolls',
                'price' => 0.60,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            
            // Synergy offers
            [
                'id' => 11,
                'supplier_id' => 5,
                'rawmat_id' => 8, // Stretchfilm
                'unit' => 'pieces',
                'price' => 320.00,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            
            // Polyflex offers
            [
                'id' => 12,
                'supplier_id' => 6,
                'rawmat_id' => 9, // Shrinkfilm
                'unit' => 'pieces',
                'price' => 2337.00,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ]);
    }
}
