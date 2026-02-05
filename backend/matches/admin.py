from django.contrib import admin
from .models import Match, LeagueStanding

@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
    list_display = ('tournament', 'player1', 'player2', 'score_player1', 'score_player2', 'status')
    list_filter = ('tournament', 'status', 'round')

@admin.register(LeagueStanding)
class LeagueStandingAdmin(admin.ModelAdmin):
    list_display = ('tournament', 'player', 'points', 'played', 'goal_difference')
    list_filter = ('tournament',)
