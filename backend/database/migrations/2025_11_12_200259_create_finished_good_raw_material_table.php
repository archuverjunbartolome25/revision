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
    public function up()
    {
Schema::create('finished_good_raw_material', function (Blueprint $table) {
    $table->id();
    $table->foreignId('inventory_id')->constrained('inventories')->onDelete('cascade');
    $table->foreignId('inventory_rawmat_id')->constrained('inventory_rawmats')->onDelete('cascade');
    $table->integer('quantity_per_finished_good');
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
        Schema::dropIfExists('finished_good_raw_material');
    }
};
