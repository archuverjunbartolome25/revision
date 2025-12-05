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
            
            // What record was affected
            $table->string('module'); // 'Production Output', 'Purchase Order', 'Disposal', 'Sales Order'
            $table->unsignedBigInteger('record_id'); // ID of the record
            
            // What happened
            $table->string('action'); // 'Created', 'Received', 'Approved', 'Delivered', 'Completed'
            $table->string('status'); // Current status after this action
            
            // Who did it
            $table->unsignedBigInteger('created_by'); // Employee who originally created the record
            $table->unsignedBigInteger('performed_by'); // Employee who performed THIS specific action
            
            $table->timestamps();
            
            // Foreign keys
            $table->foreign('created_by')->references('id')->on('users');
            $table->foreign('performed_by')->references('id')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('audit_logs');
    }
};
