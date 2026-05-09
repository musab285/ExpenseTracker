from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from .models import Expense, Income, Profile, Debt


@receiver(post_save, sender=Expense)
def update_balance_on_expense_create(sender, instance, created, **kwargs):
    """Deduct expense amount from profile balance when expense is created (if not soft-deleted)."""
    if created and not instance.is_deleted:
        profile = instance.profile
        profile.balance -= instance.amount
        profile.save(update_fields=['balance'])


@receiver(post_delete, sender=Expense)
def update_balance_on_expense_delete(sender, instance, **kwargs):
    """Add back expense amount to profile balance when expense is hard-deleted (only if not already soft-deleted)."""
    if not instance.is_deleted:
        profile = instance.profile
        profile.balance += instance.amount
        profile.save(update_fields=['balance'])


@receiver(post_save, sender=Income)
def update_balance_on_income_create(sender, instance, created, **kwargs):
    """Add income amount to profile balance when income is created (if not soft-deleted)."""
    if created and not instance.is_deleted:
        profile = instance.profile
        profile.balance += instance.amount
        profile.save(update_fields=['balance'])


@receiver(post_delete, sender=Income)
def update_balance_on_income_delete(sender, instance, **kwargs):
    """Remove income amount from profile balance when income is hard-deleted (if not soft-deleted)."""
    if not instance.is_deleted:
        profile = instance.profile
        profile.balance -= instance.amount
        profile.save(update_fields=['balance'])


@receiver(post_save, sender=Debt)
def update_balance_on_debt_create(sender, instance, created, update_fields, **kwargs):
    """Debts are user-level transactions and do not affect profile balances."""
    pass


@receiver(post_delete, sender=Debt)
def update_balance_on_debt_delete(sender, instance, **kwargs):
    """Debts are user-level transactions and do not affect profile balances."""
    pass
