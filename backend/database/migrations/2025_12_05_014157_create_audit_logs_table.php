<?php


use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->string('module'); // 'Production Output', 'Purchase Order', 'Disposal', 'Sales Order'
            $table->unsignedBigInteger('record_id'); 
            $table->string('action');
            $table->string('status'); 
            $table->unsignedBigInteger('created_by'); 
            $table->unsignedBigInteger('performed_by'); 
            $table->timestamps();
            
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('performed_by')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};
