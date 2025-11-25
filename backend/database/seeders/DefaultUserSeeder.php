<?php

    namespace Database\Seeders;

    use Illuminate\Database\Seeder;
    use Illuminate\Support\Facades\DB;
    use Illuminate\Support\Facades\Hash;

    class DefaultUserSeeder extends Seeder
    {
        public function run()
        {
            DB::table('users')->truncate();

            DB::table('users')->insert([
                'id' => 1,  
                'employeeID' => 'E072501',
                'password' => Hash::make('password123'),
                'created_at' => now(),
                'updated_at' => now(),
                'role' => 'Warehouse Supervisor',
                'firstname' => 'Archuverjun',
                'lastname' => 'Bartolome',
                'email' => 'ajbuttowski26@gmail.com',
                'status' => 'Active',
            ]);
        }
    }
