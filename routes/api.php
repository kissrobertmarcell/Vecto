<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\CommentController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\PokerController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\SprintController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::middleware('web')->prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('reset-password', [AuthController::class, 'resetPassword']);
});

Route::middleware(['web', 'auth:sanctum'])->group(function () {
    Route::post('auth/logout', [AuthController::class, 'logout']);
    Route::get('auth/me', [AuthController::class, 'me']);

    Route::get('dashboard', [DashboardController::class, 'index']);
    Route::get('search', [SearchController::class, 'index']);

    Route::get('notifications', [NotificationController::class, 'index']);
    Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead']);

    Route::get('user', [UserController::class, 'show']);
    Route::patch('user', [UserController::class, 'update']);
    Route::get('users/search', [UserController::class, 'search']);

    Route::apiResource('projects', ProjectController::class)->only(['index', 'store', 'show', 'update', 'destroy']);
    Route::get('projects/{project}/members', [ProjectController::class, 'members']);
    Route::post('projects/{project}/members', [ProjectController::class, 'inviteMember']);
    Route::patch('projects/{project}/members/{member}', [ProjectController::class, 'updateMemberRole']);
    Route::delete('projects/{project}/members/{member}', [ProjectController::class, 'removeMember']);

    Route::get('projects/{project}/tasks', [TaskController::class, 'index']);
    Route::post('projects/{project}/tasks', [TaskController::class, 'store']);
    Route::patch('projects/{project}/backlog/reorder', [TaskController::class, 'reorderBacklog']);
    Route::get('tasks/{task}', [TaskController::class, 'show']);
    Route::patch('tasks/{task}', [TaskController::class, 'update']);
    Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
    Route::post('tasks/{task}/move', [TaskController::class, 'move']);
    Route::post('tasks/{task}/assign-sprint', [TaskController::class, 'assignSprint']);

    Route::get('projects/{project}/sprints', [SprintController::class, 'index']);
    Route::post('projects/{project}/sprints', [SprintController::class, 'store']);
    Route::get('sprints/{sprint}', [SprintController::class, 'show']);
    Route::patch('sprints/{sprint}', [SprintController::class, 'update']);
    Route::delete('sprints/{sprint}', [SprintController::class, 'destroy']);
    Route::post('sprints/{sprint}/start', [SprintController::class, 'start']);
    Route::post('sprints/{sprint}/complete', [SprintController::class, 'complete']);

    Route::get('boards/{board}', [BoardController::class, 'show']);
    Route::patch('boards/{board}', [BoardController::class, 'update']);
    Route::post('boards/{board}/columns', [BoardController::class, 'storeColumn']);
    Route::patch('columns/{column}', [BoardController::class, 'updateColumn']);
    Route::delete('columns/{column}', [BoardController::class, 'destroyColumn']);
    Route::post('boards/{board}/columns/reorder', [BoardController::class, 'reorderColumns']);

    Route::get('tasks/{task}/comments', [CommentController::class, 'index']);
    Route::post('tasks/{task}/comments', [CommentController::class, 'store']);
    Route::patch('comments/{comment}', [CommentController::class, 'update']);
    Route::delete('comments/{comment}', [CommentController::class, 'destroy']);

    Route::post('tasks/{task}/poker-sessions', [PokerController::class, 'store']);
    Route::get('tasks/{task}/poker-sessions/active', [PokerController::class, 'active']);
    Route::get('poker-sessions/{pokerSession}', [PokerController::class, 'show']);
    Route::post('poker-sessions/{pokerSession}/vote', [PokerController::class, 'vote']);
    Route::post('poker-sessions/{pokerSession}/reveal', [PokerController::class, 'reveal']);
    Route::post('poker-sessions/{pokerSession}/accept', [PokerController::class, 'accept']);
});
