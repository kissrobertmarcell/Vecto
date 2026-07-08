<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poker_votes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poker_session_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('value');
            $table->timestamps();

            $table->unique(['poker_session_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poker_votes');
    }
};
