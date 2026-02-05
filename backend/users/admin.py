from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'is_staff', 'is_verified')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra Fields', {'fields': ('avatar', 'num_whatsapp', 'is_verified')}),
    )
