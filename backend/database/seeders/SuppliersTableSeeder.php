<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;


class SuppliersTableSeeder extends Seeder
{
    public function run()
    {
        {
            DB::table('suppliers')->truncate();
            
            DB::table('suppliers')->insert([
                [
                    'id' => 1,
                    'name' => 'Mc Bride Corporation',
                    'contact_person' => 'John McBride',
                    'email' => 'john@mcbride.com',
                    'phone' => '0917-123-4567',
                    'address' => 'Manila, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
                [
                    'id' => 2,
                    'name' => 'Filpet, Inc.',
                    'contact_person' => 'Maria Santos',
                    'email' => 'maria@filpet.com',
                    'phone' => '0918-234-5678',
                    'address' => 'Quezon City, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
                [
                    'id' => 3,
                    'name' => 'Royalseal',
                    'contact_person' => 'Roberto Cruz',
                    'email' => 'roberto@royalseal.com',
                    'phone' => '0919-345-6789',
                    'address' => 'Makati, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
                [
                    'id' => 4,
                    'name' => 'Shrinkpack',
                    'contact_person' => 'Ana Reyes',
                    'email' => 'ana@shrinkpack.com',
                    'phone' => '0920-456-7890',
                    'address' => 'Pasig, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
                [
                    'id' => 5,
                    'name' => 'Synergy',
                    'contact_person' => 'Carlos Mendoza',
                    'email' => 'carlos@synergy.com',
                    'phone' => '0921-567-8901',
                    'address' => 'Caloocan, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
                [
                    'id' => 6,
                    'name' => 'Polyflex',
                    'contact_person' => 'Diana Flores',
                    'email' => 'diana@polyflex.com',
                    'phone' => '0922-678-9012',
                    'address' => 'Taguig, Philippines',
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                    'tin' => '638-260-448-00000',
                ],
            ]);
        }
    }
}
