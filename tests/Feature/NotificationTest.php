<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\NotificationController;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Route;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Route::middleware('auth:sanctum')->group(function () {
            Route::get('/api/notifications', [NotificationController::class, 'index']);
            Route::get('/api/notifications/unread-count', [NotificationController::class, 'unreadCount']);
            Route::post('/api/notifications/{notification}/read', [NotificationController::class, 'markRead']);
            Route::post('/api/notifications/read-all', [NotificationController::class, 'markAllRead']);
        });
    }

    private function sampleNotification(): Notification
    {
        return new class extends Notification
        {
            public function via(mixed $notifiable): array
            {
                return ['database'];
            }

            /**
             * @return array<string, mixed>
             */
            public function toArray(mixed $notifiable): array
            {
                return ['message' => 'You have a new notification.'];
            }
        };
    }

    public function test_user_can_list_their_notifications(): void
    {
        $user = User::factory()->create();
        $user->notify($this->sampleNotification());
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications');

        $response->assertOk();
        $response->assertJsonCount(1, 'data');
    }

    public function test_user_can_get_unread_notification_count(): void
    {
        $user = User::factory()->create();
        $user->notify($this->sampleNotification());
        $user->notify($this->sampleNotification());
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/notifications/unread-count');

        $response->assertOk()->assertJson(['count' => 2]);
    }

    public function test_user_can_mark_a_notification_as_read(): void
    {
        $user = User::factory()->create();
        $user->notify($this->sampleNotification());
        Sanctum::actingAs($user);

        $notification = $user->notifications()->first();

        $response = $this->postJson("/api/notifications/{$notification->id}/read");

        $response->assertOk();
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_user_can_mark_all_notifications_as_read(): void
    {
        $user = User::factory()->create();
        $user->notify($this->sampleNotification());
        $user->notify($this->sampleNotification());
        Sanctum::actingAs($user);

        $response = $this->postJson('/api/notifications/read-all');

        $response->assertOk();
        $this->assertSame(0, $user->unreadNotifications()->count());
    }
}
