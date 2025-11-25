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
        Schema::create('return_to_vendor_items', function (Blueprint $table) {
            $table->id();


            $table->unsignedBigInteger('return_id');
            $table->foreign('return_id')
                  ->references('id')
                  ->on('return_to_vendor')
                  ->onDelete('cascade');


            $table->unsignedBigInteger('product_id');
            $table->foreign('product_id')
                  ->references('id')
                  ->on('inventories')
                  ->onDelete('restrict');

            // Quantity field
            $table->integer('quantity');

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
        Schema::dropIfExists('return_to_vendor_items');
    }
};
