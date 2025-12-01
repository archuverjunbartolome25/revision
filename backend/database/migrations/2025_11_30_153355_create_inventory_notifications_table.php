<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_notifications', function (Blueprint $table) {
            $table->id();
            $table->string('notifiable_type'); 
            $table->unsignedBigInteger('notifiable_id');
            $table->string('item_name');
            $table->enum('priority', ['warning', 'critical']); 
            $table->integer('current_quantity')->default(0);
            $table->integer('low_stock_alert')->default(0);
            $table->string('unit')->nullable();
            $table->boolean('is_read')->default(false);
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
            
            $table->index(['notifiable_type', 'notifiable_id']);
            $table->index('is_read');
            $table->index('priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_notifications');
    }
};