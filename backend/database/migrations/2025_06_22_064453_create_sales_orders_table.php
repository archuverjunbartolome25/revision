<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_orders', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('employee_id')->nullable();
            $table->unsignedBigInteger('customer_id');

            $table->string('location');
            $table->text('products');    
            $table->text('quantities'); 

            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->date('delivery_date')->nullable();
            $table->string('order_type');
            $table->integer('qty_350ml')->default(0);
            $table->integer('qty_500ml')->default(0);
            $table->integer('qty_1L')->default(0);
            $table->integer('qty_6L')->default(0);
            $table->string('status');
            $table->date('date_delivered')->nullable();

            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
            $table->foreign('employee_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};