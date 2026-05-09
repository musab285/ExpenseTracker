from django.contrib import admin
from .models import User, Profile, Expense, Category

# Register your models here.

admin.site.register(User)
admin.site.register(Profile)
admin.site.register(Expense)
admin.site.register(Category)

