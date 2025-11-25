<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateInventoryRawmatsTable extends Migration
{
    public function up()
    {
        Schema::create('inventory_rawmats', function (Blueprint $table) {
            $table->id();
            $table->string('item');
            $table->string('unit');
            $table->integer('quantity')->default(0);
            $table->integer('conversion')->default(1);
            $table->integer('quantity_pieces')->default(0);
            $table->integer('low_stock_alert')->default(0);
            $table->unsignedBigInteger('supplier_id');
            $table->decimal('unit_cost', 10, 2)->default(0);
            $table->timestamps();

        });
    }

    public function down()
    {
        Schema::dropIfExists('inventory_rawmats');
    }
}
