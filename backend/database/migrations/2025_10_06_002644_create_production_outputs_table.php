<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('production_outputs', function (Blueprint $table) {
            $table->id();
            $table->string('product_name');
            $table->integer('quantity')->default(0);
            $table->integer('quantity_pcs')->default(0);
            $table->json('materials_needed')->nullable();
            $table->json('selected_suppliers')->nullable();
            $table->string('batch_number')->nullable();
            $table->string('employee_id')->nullable();
            $table->timestamp('production_date')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('production_outputs');
    }
};
