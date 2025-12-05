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
            
            $table->unsignedBigInteger('customer_id');
 
            $table->string('location');
            $table->jsonb('products');     // Changed from text to jsonb
            $table->jsonb('quantities');   // Changed from text to jsonb

            $table->decimal('amount', 12, 2);
            $table->date('date');
            $table->date('delivery_date')->nullable();
            $table->string('order_type');
            $table->string('status');
            $table->date('date_delivered')->nullable();
            $table->string('employee_id')->nullable();

            $table->timestamps();

            $table->foreign('customer_id')->references('id')->on('customers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sales_orders');
    }
};