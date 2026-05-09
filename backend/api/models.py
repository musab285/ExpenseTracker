from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


# Create your models here.

class User(AbstractUser):
    pass


class Profile(models.Model):
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE,
        related_name='user_profiles'
    )
    accountType = models.CharField(max_length=20)
    balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

class Category(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='categories'
    )
    name = models.CharField(max_length=50)

    class Meta:
        unique_together = ('name', 'user')

    def __str__(self):
        return self.name

class Expense(models.Model):
    profile = models.ForeignKey(
        Profile, 
        on_delete=models.CASCADE,
        related_name='expenses_profile'
    )
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='expenses'
    )
    payment_type = models.CharField(max_length=50, blank=True, null=True)
    ref_id = models.CharField(max_length=100, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    comments = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

class Income(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='incomes'
    )
    profile = models.ForeignKey(
        Profile,
        on_delete=models.CASCADE,
        related_name='income_distributions'
    )
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    timestamp = models.DateTimeField(default=timezone.now)
    comments = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)

class Debt(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='debts'
    )
    name = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    is_paid = models.BooleanField(default=False)
    due_date = models.DateField(blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    comments = models.TextField(blank=True, null=True)
    is_deleted = models.BooleanField(default=False)
