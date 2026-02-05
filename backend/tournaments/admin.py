from django.contrib import admin
from .models import Tournament, TournamentParticipant, TournamentJoinRequest, TournamentInvitation

@admin.register(Tournament)
class TournamentAdmin(admin.ModelAdmin):
    list_display = ('name', 'type', 'status', 'admin', 'visibility')
    list_filter = ('type', 'status', 'visibility')

@admin.register(TournamentParticipant)
class TournamentParticipantAdmin(admin.ModelAdmin):
    list_display = ('user', 'tournament', 'role', 'joined_at')
    list_filter = ('role', 'tournament')

admin.site.register(TournamentJoinRequest)
admin.site.register(TournamentInvitation)
