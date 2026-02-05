from django.db import models
from django.conf import settings

class Notification(models.Model):
    TYPE_FRIEND_REQUEST = 'FRIEND_REQUEST'
    TYPE_TOURNAMENT_REQUEST = 'TOURNAMENT_REQUEST'
    TYPE_INVITATION = 'INVITATION'
    TYPE_MATCH_RESULT = 'MATCH_RESULT'

    TYPE_CHOICES = [
        (TYPE_FRIEND_REQUEST, 'Friend Request'),
        (TYPE_TOURNAMENT_REQUEST, 'Tournament Join Request'),
        (TYPE_INVITATION, 'Tournament Invitation'),
        (TYPE_MATCH_RESULT, 'Match Result'),
    ]

    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Notification for {self.receiver} ({self.type})"
