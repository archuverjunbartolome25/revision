<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplier_offers', function (Blueprint $table) {
            $table->id();

            // Foreign keys
            $table->unsignedBigInteger('supplier_id');
            $table->unsignedBigInteger('rawmat_id');

            // Offer details
            $table->string('unit')->default('pieces');
            $table->decimal('price', 10, 2);

            $table->timestamps();

            // Constraints
            $table->foreign('supplier_id')
                ->references('id')->on('suppliers')
                ->onDelete('cascade');

            $table->foreign('rawmat_id')
                ->references('id')->on('inventory_rawmats')
                ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplier_offers');
    }
};