<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('disposals', function (Blueprint $table) {
            $table->id();
            $table->string('disposal_number')->unique();
            $table->date('disposal_date');
            $table->string('reason')->nullable();
            $table->unsignedBigInteger('employee_id');
            $table->string('item_type');
            $table->string('item');
            $table->integer('quantity');
            $table->string('status')->default('Pending');
            $table->date('disposed_date')->nullable();
            $table->time('disposed_time')->nullable();
            $table->timestamps();


            $table->foreign('employee_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('disposals');
    }
};
