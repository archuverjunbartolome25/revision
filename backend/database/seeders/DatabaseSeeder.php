<?php

namespace Database\Seeders;

// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * @return void
     */
public function run(): void
{

    // PersonalAccessTokensSeeder::class,

    $this->call([
        DefaultUserSeeder::class,
        InventorySeeder::class,
        InventoryRawmatsSeeder::class,
        CustomerSeeder::class,
        SuppliersTableSeeder::class,
        SupplierOffersTableSeeder::class,
        SalesOrdersTableSeeder::class,
        PurchaseOrdersSeeder::class,
        PurchaseOrderItemsSeeder::class,
        PurchaseReceiptsSeeder::class,
        ProductionOutputsSeeder::class,
        InventoryActivityLogsSeeder::class,
        ReturnToVendorTableSeeder::class,
        ReturnToVendorItemTableSeeder::class,
        DisposalsSeeder::class,
    ]);
}
}
