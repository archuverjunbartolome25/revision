<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        Schema::create('inventories', function (Blueprint $table) {
            $table->id();
    
            $table->string('item');
            $table->string('unit');
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->integer('pcs_per_unit')->default(1);
            $table->integer('quantity')->default(0);
            $table->integer('quantity_pcs')->default(0);
            $table->integer('low_stock_alert')->default(0);
            $table->jsonb('materials_needed')->nullable();
            $table->json('selected_materials')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('inventories');
    }
};
